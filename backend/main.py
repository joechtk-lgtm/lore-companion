import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="Lore Companion API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://lore-companion.vercel.app",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?|https://[a-zA-Z0-9-]+-[a-zA-Z0-9]+\.vercel\.app",
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

UNIVERSES_DIR = Path(__file__).parent.parent / "universes"


# --- Rate Limiting ---

DAILY_LIMIT = 500
HOURLY_IP_LIMIT = 20

_daily_count = 0
_last_reset_date = None
_ip_hourly: dict = {}  # ip -> (hour, count)


def _check_and_reset_daily() -> None:
    global _daily_count, _last_reset_date
    today = datetime.now(timezone.utc).date()
    if _last_reset_date != today:
        _daily_count = 0
        _last_reset_date = today


def check_rate_limits(ip: str) -> None:
    global _daily_count

    _check_and_reset_daily()

    if _daily_count >= DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=(
                "The Continent grows quiet. The lore keeper rests "
                "until dawn. Try again tomorrow."
            ),
        )

    current_hour = datetime.now(timezone.utc).hour
    hour, count = _ip_hourly.get(ip, (current_hour, 0))
    if hour != current_hour:
        hour, count = current_hour, 0

    if count >= HOURLY_IP_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=(
                "You have asked many questions. "
                "Rest, and return when the hour has passed."
            ),
        )

    _ip_hourly[ip] = (hour, count + 1)
    _daily_count += 1


# --- Request / Response Models ---

class AskRequest(BaseModel):
    universe_id: str
    spoiler_tier: str
    canon_sources: list[str]
    question: str
    history: Optional[list[dict]] = None


class AskResponse(BaseModel):
    answer: str
    canon_badges: list[str]
    spoiler_safe: bool
    suggestions: list[str]
    confidence: str  # "high" | "general"


# --- Lore Loading ---

def load_universe_config(universe_id: str) -> dict:
    config_path = UNIVERSES_DIR / universe_id / "config.json"
    if not config_path.exists():
        raise HTTPException(status_code=404, detail=f"Universe '{universe_id}' not found.")
    with open(config_path) as f:
        return json.load(f)


def get_tier_order(config: dict) -> list[str]:
    """Return the ordered list of tier IDs from the universe config."""
    return [t["id"] for t in config.get("spoiler_tiers", [])]


def get_allowed_tiers(spoiler_tier: str, config: dict) -> set[str]:
    """Return all tiers at or below the requested spoiler tier."""
    tier_order = get_tier_order(config)
    if spoiler_tier not in tier_order:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid spoiler_tier '{spoiler_tier}'. Valid values: {tier_order}"
        )
    idx = tier_order.index(spoiler_tier)
    return set(tier_order[: idx + 1])


def filter_lore_content(content: str, allowed_tiers: set[str], tier_order: list[str]) -> str:
    """
    Filter markdown lore content by spoiler tier tags.

    Sections are tagged with: [spoiler_tier: tier_name]
    A section runs until the next tag or end of file.
    Sections with no tag default to the lowest tier (first in tier_order).
    """
    lines = content.splitlines(keepends=True)
    result = []
    default_tier = tier_order[0] if tier_order else "limgrave"
    current_tier = default_tier
    include_current = True

    for line in lines:
        tag_match = re.search(r'\[spoiler_tier:\s*(\w+)\]', line)
        if tag_match:
            current_tier = tag_match.group(1)
            include_current = current_tier in allowed_tiers
            # Keep the header line if this section is included (strip the tag)
            if include_current:
                cleaned = re.sub(r'\s*\[spoiler_tier:[^\]]+\]', '', line)
                if cleaned.strip():
                    result.append(cleaned)
        else:
            if include_current:
                # Skip canon_source tags (those are for canon badge extraction)
                if not re.search(r'\[canon_source:', line):
                    result.append(line)

    return "".join(result).strip()


def extract_canon_badges(content: str, canon_sources: list[str]) -> list[str]:
    """Pull canon source badges referenced in lore content, filtered to active sources."""
    source_set = set(canon_sources)
    matches = re.findall(r'\[([a-z][a-z0-9_]*)\]', content)
    return sorted({m for m in matches if m in source_set})


def load_lore_files(
    universe_id: str, config: dict, allowed_tiers: set[str], tier_order: list[str]
) -> tuple[str, bool]:
    """
    Load and filter all lore files for the universe.
    Returns (lore_context, has_lore_files).
    """
    universe_dir = UNIVERSES_DIR / universe_id
    chunks = []

    file_categories = config.get("lore_files", {})
    for category, filenames in file_categories.items():
        for filename in filenames:
            filepath = universe_dir / category / filename
            if not filepath.exists():
                continue
            raw = filepath.read_text(encoding="utf-8")
            filtered = filter_lore_content(raw, allowed_tiers, tier_order)
            if filtered:
                chunks.append(f"### {category.upper()}: {filename.replace('.md', '').upper()}\n\n{filtered}")

    # Load structural files (voice profile, canon rules)
    for key in ("voice_profile", "canon_rules"):
        fname = config.get(key)
        if fname:
            fpath = universe_dir / fname
            if fpath.exists():
                chunks.append(fpath.read_text(encoding="utf-8"))

    has_lore = len(chunks) > 2  # more than just voice/canon files
    return "\n\n---\n\n".join(chunks), has_lore


# --- Claude API Call ---

def build_system_prompt(
    lore_context: str, canon_sources: list[str], config: dict
) -> str:
    universe_name = config.get("display_name", config.get("title", "this universe"))

    # Build source labels from config
    source_map = {s["id"]: s["label"] for s in config.get("canon_sources", [])}
    active_sources = [source_map.get(s, s) for s in canon_sources]
    sources_str = "\n".join(f"- {s}" for s in active_sources)

    # Build valid badge tags from canon sources
    badge_tags = " | ".join(f"[{s}]" for s in canon_sources)

    return f"""You are a lore guide for {universe_name}.

ACTIVE CANON SOURCES (only draw from these):
{sources_str}

LORE KNOWLEDGE BASE:
{lore_context}

VOICE AND STYLE:
Follow the voice profile in the lore knowledge base exactly.

SPOILER SAFETY:
You have already been given only the lore content appropriate for this user's spoiler tier.
Do not speculate about or hint at content beyond what is in the lore knowledge base above.
If a question asks about something you genuinely don't know, say so plainly.

RESPONSE FORMAT:
Answer the question directly. Include canon source badges inline where relevant using:
{badge_tags}
Keep answers focused and appropriately concise.

If the user asks to go deeper or learn more, identify the single most interesting or mysterious element from your previous answer and expand on it directly. Do not ask which part interests them. Just pick the most compelling thread and follow it.

After your answer, on a new line write SUGGESTIONS: followed by exactly 2 follow-up questions the user might want to ask, separated by a | character.
Example: SUGGESTIONS: Who trained Geralt?|What is Kaer Morhen?
The suggestions should be natural follow-ups to your specific answer. Do not repeat the question just asked."""


def extract_badges_from_answer(answer: str, canon_sources: list[str]) -> list[str]:
    """Extract canon source badges from answer text, filtered to active sources."""
    # Build pattern from active canon sources
    source_pattern = "|".join(re.escape(s) for s in canon_sources)
    # Also match shorthand tags like [books], [netflix]
    shorthand = {
        "game_w3": ["game_w3"],
        "game_w1w2": ["game_w1w2"],
        "books_sapkowski": ["books", "books_sapkowski"],
        "netflix": ["netflix"],
        "game_eldenring": ["game_eldenring"],
        "dlc_shadowoftherdtree": ["dlc_shadowoftherdtree", "dlc_sote"],
    }
    all_tags = set()
    for src in canon_sources:
        all_tags.update(shorthand.get(src, [src]))

    pattern = "|".join(re.escape(t) for t in all_tags)
    found = re.findall(rf'\[({pattern})\]', answer)
    return sorted(set(found))


def parse_suggestions(raw_answer: str) -> tuple[str, list[str]]:
    """Split SUGGESTIONS line from answer text."""
    if "SUGGESTIONS:" not in raw_answer:
        return raw_answer.strip(), []

    parts = raw_answer.split("SUGGESTIONS:", 1)
    answer = parts[0].strip()
    suggestion_line = parts[1].strip()
    suggestions = [s.strip() for s in suggestion_line.split("|") if s.strip()]
    return answer, suggestions[:2]


# --- Endpoint ---

@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest, http_request: Request) -> AskResponse:
    client_ip = http_request.client.host if http_request.client else "unknown"
    check_rate_limits(client_ip)

    # Validate and load universe
    config = load_universe_config(request.universe_id)
    tier_order = get_tier_order(config)
    allowed_tiers = get_allowed_tiers(request.spoiler_tier, config)

    # Validate canon sources
    valid_sources = {s["id"] for s in config.get("canon_sources", [])}
    invalid = [s for s in request.canon_sources if s not in valid_sources]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid canon_sources: {invalid}. Valid: {sorted(valid_sources)}"
        )

    # Load and filter lore
    lore_context, has_lore_files = load_lore_files(
        request.universe_id, config, allowed_tiers, tier_order
    )

    if not lore_context.strip():
        raise HTTPException(status_code=500, detail="No lore content available for this tier.")

    # Build prompt
    system_prompt = build_system_prompt(lore_context, request.canon_sources, config)

    # Call Claude
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set.")

    client = anthropic.Anthropic(api_key=api_key)

    messages = list(request.history) if request.history else []
    messages.append({"role": "user", "content": request.question})

    with client.messages.stream(
        model="claude-haiku-4-5-20251001",
        max_tokens=1200,
        system=system_prompt,
        messages=messages,
    ) as stream:
        raw_answer = stream.get_final_message().content[0].text

    answer, suggestions = parse_suggestions(raw_answer)

    canon_badges = extract_badges_from_answer(answer, request.canon_sources)
    if not canon_badges:
        canon_badges = extract_canon_badges(lore_context, request.canon_sources)

    confidence = "high" if has_lore_files else "general"

    return AskResponse(
        answer=answer,
        canon_badges=canon_badges,
        spoiler_safe=True,
        suggestions=suggestions,
        confidence=confidence,
    )


@app.get("/status")
async def status():
    _check_and_reset_daily()
    remaining = max(0, DAILY_LIMIT - _daily_count)
    return {
        "requests_today": _daily_count,
        "daily_limit": DAILY_LIMIT,
        "requests_remaining": remaining,
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/universes")
async def list_universes():
    universes = []
    if UNIVERSES_DIR.exists():
        for d in UNIVERSES_DIR.iterdir():
            if d.is_dir() and (d / "config.json").exists():
                config_path = d / "config.json"
                with open(config_path) as f:
                    cfg = json.load(f)
                universes.append({
                    "id": d.name,
                    "display_name": cfg.get("display_name", d.name),
                    "accent_color": cfg.get("accent_color", "#c9a84c"),
                })
    return {"universes": universes}
