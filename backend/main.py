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

app = FastAPI(title="Lore Companion API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?",
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

UNIVERSES_DIR = Path(__file__).parent.parent / "universes"
SPOILER_TIER_ORDER = [
    "white_orchard",
    "velen_novigrad",
    "skellige",
    "kaer_morhen",
    "main_complete",
    "everything",
]


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
                "You have asked many questions of the Continent. "
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


# --- Lore Loading ---

def load_universe_config(universe_id: str) -> dict:
    config_path = UNIVERSES_DIR / universe_id / "config.json"
    if not config_path.exists():
        raise HTTPException(status_code=404, detail=f"Universe '{universe_id}' not found.")
    with open(config_path) as f:
        return json.load(f)


def get_allowed_tiers(spoiler_tier: str) -> set[str]:
    """Return all tiers at or below the requested spoiler tier."""
    if spoiler_tier not in SPOILER_TIER_ORDER:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid spoiler_tier '{spoiler_tier}'. Valid values: {SPOILER_TIER_ORDER}"
        )
    idx = SPOILER_TIER_ORDER.index(spoiler_tier)
    return set(SPOILER_TIER_ORDER[: idx + 1])


def filter_lore_content(content: str, allowed_tiers: set[str]) -> str:
    """
    Filter markdown lore content by spoiler tier tags.

    Sections are tagged with: [spoiler_tier: tier_name]
    A section runs until the next tag or end of file.
    Sections with no tag default to the lowest tier (white_orchard).
    """
    lines = content.splitlines(keepends=True)
    result = []
    current_tier = "white_orchard"  # default if no tag present
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


def extract_canon_badges(content: str) -> list[str]:
    """Pull canon source badges referenced in lore content."""
    matches = re.findall(r'\[(?:canon_source|game_w3|game_w1w2|books|netflix)\]', content)
    badges = set()
    for m in matches:
        inner = m.strip('[]')
        if inner.startswith('canon_source:'):
            badges.add(inner.split(':')[1].strip())
        else:
            badges.add(inner)
    return sorted(badges)


def load_lore_files(universe_id: str, config: dict, allowed_tiers: set[str], canon_sources: list[str]) -> str:
    """Load and filter all lore files for the universe."""
    universe_dir = UNIVERSES_DIR / universe_id
    chunks = []

    file_categories = config.get("lore_files", {})
    for category, filenames in file_categories.items():
        for filename in filenames:
            filepath = universe_dir / category / filename
            if not filepath.exists():
                continue
            raw = filepath.read_text(encoding="utf-8")
            filtered = filter_lore_content(raw, allowed_tiers)
            if filtered:
                chunks.append(f"### {category.upper()}: {filename.replace('.md', '').upper()}\n\n{filtered}")

    # Load structural files (voice profile, canon rules)
    for key in ("voice_profile", "canon_rules"):
        fname = config.get(key)
        if fname:
            fpath = universe_dir / fname
            if fpath.exists():
                chunks.append(fpath.read_text(encoding="utf-8"))

    return "\n\n---\n\n".join(chunks)


# --- Claude API Call ---

def build_system_prompt(lore_context: str, canon_sources: list[str]) -> str:
    source_labels = {
        "game_w3": "Witcher 3: Wild Hunt (main game and DLCs)",
        "game_w1w2": "Witcher 1 and Witcher 2",
        "books_sapkowski": "Sapkowski novels (primary canon)",
        "netflix": "Netflix adaptation (always label as adaptation, never blend silently with game/book canon)",
    }
    active_sources = [source_labels.get(s, s) for s in canon_sources]
    sources_str = "\n".join(f"- {s}" for s in active_sources)

    return f"""You are a lore guide for The Witcher 3: Wild Hunt universe.

ACTIVE CANON SOURCES (only draw from these):
{sources_str}

LORE KNOWLEDGE BASE:
{lore_context}

VOICE AND STYLE:
Follow the voice profile exactly. Matter-of-fact. Dry. Morally grey. Short declarative sentences.
Never use the word "delve". Never be romantic or heroic about violence.

CANON RULES:
Books are primary canon. Games are faithful sequels. Netflix ALWAYS labeled as adaptation.
Never blend Netflix details into book/game answers without flagging it.

SPOILER SAFETY:
You have already been given only the lore content appropriate for this user's spoiler tier.
Do not speculate about or hint at content beyond what is in the lore knowledge base above.
If a question asks about something you genuinely don't know, say so plainly.

RESPONSE FORMAT:
Answer the question directly. Include canon source badges inline where relevant using:
[game_w3], [game_w1w2], [books], [netflix]
Keep answers focused and appropriately concise. This is not a lecture — it's a traveler telling you what they know."""


BADGE_TO_SOURCE = {
    "game_w3": "game_w3",
    "game_w1w2": "game_w1w2",
    "books": "books_sapkowski",
    "books_sapkowski": "books_sapkowski",
    "netflix": "netflix",
}


def extract_badges_from_answer(answer: str) -> list[str]:
    badges = re.findall(r'\[(game_w3|game_w1w2|books|netflix|books_sapkowski)\]', answer)
    return sorted(set(badges))


# --- Endpoint ---

@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest, http_request: Request) -> AskResponse:
    client_ip = http_request.client.host if http_request.client else "unknown"
    check_rate_limits(client_ip)

    # Validate and load universe
    config = load_universe_config(request.universe_id)
    allowed_tiers = get_allowed_tiers(request.spoiler_tier)

    # Validate canon sources
    valid_sources = {s["id"] for s in config.get("canon_sources", [])}
    invalid = [s for s in request.canon_sources if s not in valid_sources]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid canon_sources: {invalid}. Valid: {sorted(valid_sources)}"
        )

    # Load and filter lore
    lore_context = load_lore_files(
        request.universe_id, config, allowed_tiers, request.canon_sources
    )

    if not lore_context.strip():
        raise HTTPException(status_code=500, detail="No lore content available for this tier.")

    # Build prompt
    system_prompt = build_system_prompt(lore_context, request.canon_sources)

    # Call Claude
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set.")

    client = anthropic.Anthropic(api_key=api_key)

    messages = list(request.history) if request.history else []
    messages.append({"role": "user", "content": request.question})

    with client.messages.stream(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=system_prompt,
        messages=messages,
    ) as stream:
        answer = stream.get_final_message().content[0].text

    selected = set(request.canon_sources)
    canon_badges = [
        b for b in extract_badges_from_answer(answer)
        if BADGE_TO_SOURCE.get(b) in selected
    ]
    if not canon_badges:
        # Fall back to badges from the lore files used
        canon_badges = [
            b for b in extract_canon_badges(lore_context)
            if BADGE_TO_SOURCE.get(b) in selected
        ]

    return AskResponse(
        answer=answer,
        canon_badges=canon_badges,
        spoiler_safe=True,
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
                universes.append(d.name)
    return {"universes": universes}
