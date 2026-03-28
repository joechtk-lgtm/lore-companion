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
    universe_name: Optional[str] = None
    spoiler_tier: Optional[str] = None
    canon_sources: Optional[list[str]] = None
    question: str
    history: Optional[list[dict]] = None


class AskResponse(BaseModel):
    answer: Optional[str]
    canon_badges: list[str]
    spoiler_safe: bool
    suggestions: list[str]
    confidence: str  # "high" | "general"
    spoiler_gated: bool = False
    gated_message: Optional[str] = None
    gated_tier: Optional[str] = None
    gated_answer: Optional[str] = None


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
    lore_context: str, canon_sources: list[str], config: dict,
    spoiler_tier: str, tier_order: list[str]
) -> str:
    universe_name = config.get("display_name", config.get("title", "this universe"))

    # Build source labels from config
    source_map = {s["id"]: s["label"] for s in config.get("canon_sources", [])}
    active_sources = [source_map.get(s, s) for s in canon_sources]
    sources_str = "\n".join(f"- {s}" for s in active_sources)

    # Build valid badge tags from canon sources
    badge_tags = " | ".join(f"[{s}]" for s in canon_sources)

    # Tier enforcement info
    tiers_list = config.get("spoiler_tiers", [])
    tier_map = {t["id"]: t for t in tiers_list}
    current_tier_info = tier_map.get(spoiler_tier, {})
    current_tier_label = current_tier_info.get("label", spoiler_tier)
    current_tier_desc = current_tier_info.get("description", "")
    ordered_labels = [t.get("label", t["id"]) for t in tiers_list]
    current_idx = next((i for i, t in enumerate(tiers_list) if t["id"] == spoiler_tier), 0)
    future_tiers = [t.get("label", t["id"]) for t in tiers_list[current_idx + 1:]]
    next_tier_label = future_tiers[0] if future_tiers else None
    ordered_labels_str = "\n".join(f"  {i+1}. {label}" for i, label in enumerate(ordered_labels))

    # Canon exclusion info
    all_source_ids = {s["id"] for s in config.get("canon_sources", [])}
    excluded_source_ids = sorted(all_source_ids - set(canon_sources))
    excluded_source_labels = [source_map.get(s, s) for s in excluded_source_ids]
    excluded_str = "\n".join(f"- {s}" for s in excluded_source_labels) if excluded_source_labels else "None"

    # Spoiler gating instruction
    if future_tiers:
        gating_instruction = f"""SPOILER GATING — MANDATORY:
If a question requires knowledge from content beyond the user's current tier, you MUST respond in EXACTLY this format and no other:
GATED:{next_tier_label}|[brief safe message telling the user that lies ahead]
[Then write the complete, unrestricted answer as if there were no spoiler limits]
SUGGESTIONS: q1|q2

The safe message must say something like "That lies ahead of where you are. Return to me when you reach [tier]."
Never hint at outcomes. Never say "I can't tell you" in a way that implies something big is coming. Just say the lore lies ahead.
Only use this GATED format when the question genuinely requires beyond-tier content. For all safe questions, respond normally."""
    else:
        gating_instruction = "The user is at the final tier. Answer all questions fully with no restrictions."

    # Build explicit locked tier list
    if future_tiers:
        locked_tiers_block = "YOU MUST NOT discuss any content from these tiers:\n" + "\n".join(
            f"- {t}" for t in future_tiers
        )
    else:
        locked_tiers_block = "No tiers are locked — user is at the final tier."

    return f"""You are a lore guide for {universe_name}.

SPOILER TIER ENFORCEMENT — THIS IS NON-NEGOTIABLE:
The user's current spoiler tier is: {current_tier_label}
This means they have only experienced: {current_tier_desc}

{locked_tiers_block}

Full tier order for this universe:
{ordered_labels_str}

CRITICAL RULE: Your ONLY source of truth is the LORE KNOWLEDGE BASE below. If a character, event, location, or concept does NOT appear anywhere in the lore knowledge base, it means their content is gated behind a higher spoiler tier. You MUST use the GATED response format for ANY topic not present in the lore knowledge base. Do NOT answer from your own knowledge — if it is not in the lore context below, it is off-limits.

{gating_instruction}

---

CANON SOURCE ENFORCEMENT — THIS IS NON-NEGOTIABLE:
The user has selected ONLY these canon sources:
{sources_str}

YOU MUST NOT include any content, references, or information from any source not listed above.
Excluded sources (do NOT draw from these):
{excluded_str}

If the only available answer requires an excluded source, say: "That information comes from a source you haven't selected. Enable [source name] in your settings to unlock it."

---

ACTIVE CANON SOURCES (only draw from these):
{sources_str}

LORE KNOWLEDGE BASE:
{lore_context}

VOICE AND STYLE:
Follow the voice profile in the lore knowledge base exactly.

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


def parse_gated_response(
    raw: str,
) -> tuple[Optional[str], list[str], bool, Optional[str], Optional[str], Optional[str]]:
    """
    Parse response for spoiler gating.
    Returns: (answer, suggestions, spoiler_gated, gated_message, gated_tier, gated_answer)
    """
    stripped = raw.strip()
    if not stripped.startswith("GATED:"):
        answer, suggestions = parse_suggestions(raw)
        return answer, suggestions, False, None, None, None

    first_newline = stripped.find("\n")
    if first_newline == -1:
        answer, suggestions = parse_suggestions(raw)
        return answer, suggestions, False, None, None, None

    gated_line = stripped[:first_newline]
    rest = stripped[first_newline + 1:].strip()

    gated_content = gated_line[6:]  # remove "GATED:"
    pipe_idx = gated_content.find("|")
    if pipe_idx == -1:
        answer, suggestions = parse_suggestions(raw)
        return answer, suggestions, False, None, None, None

    gated_tier = gated_content[:pipe_idx].strip()
    gated_message = gated_content[pipe_idx + 1:].strip()
    gated_answer, suggestions = parse_suggestions(rest)

    return None, suggestions, True, gated_message, gated_tier, gated_answer


# --- Fallback (Uncurated Universe) ---

def build_fallback_system_prompt(universe_name: str) -> str:
    return f"""You are a lore expert specifically for {universe_name}. The user has already told you they want to discuss {universe_name}. Do not ask which universe or film they mean. Do not ask for clarification about the subject. Assume all questions are about {universe_name} and answer directly.

Answer questions about {universe_name}'s characters, plot, lore, factions, and world. Be specific and accurate. If you are unsure about a detail, say so plainly rather than asking the user to clarify the universe.

The user has been warned that spoiler protection is not guaranteed. Answer fully without holding back for spoiler reasons unless the user has specified otherwise.

RESPONSE FORMAT:
After your answer, on a new line write SUGGESTIONS: followed by exactly 2 follow-up questions the user might want to ask, separated by a | character.
Example: SUGGESTIONS: Who is the main protagonist?|What is the central conflict?
The suggestions should be natural follow-ups to your specific answer. Do not repeat the question just asked."""


async def handle_uncurated_universe(request: AskRequest) -> AskResponse:
    universe_name = (
        request.universe_name
        or request.universe_id.replace("custom_", "").replace("_", " ").title()
    )

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set.")

    client = anthropic.Anthropic(api_key=api_key)
    messages = list(request.history) if request.history else []
    messages.append({"role": "user", "content": request.question})

    with client.messages.stream(
        model="claude-haiku-4-5-20251001",
        max_tokens=1200,
        system=build_fallback_system_prompt(universe_name),
        messages=messages,
    ) as stream:
        raw_answer = stream.get_final_message().content[0].text

    answer, suggestions = parse_suggestions(raw_answer)

    return AskResponse(
        answer=answer,
        canon_badges=[universe_name],
        spoiler_safe=False,
        suggestions=suggestions,
        confidence="general",
    )


# --- Endpoint ---

@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest, http_request: Request) -> AskResponse:
    client_ip = http_request.client.host if http_request.client else "unknown"
    check_rate_limits(client_ip)

    # Route uncurated universes to fallback mode
    config_path = UNIVERSES_DIR / request.universe_id / "config.json"
    if not config_path.exists():
        return await handle_uncurated_universe(request)

    # Validate and load universe
    config = load_universe_config(request.universe_id)
    tier_order = get_tier_order(config)

    if not request.spoiler_tier:
        raise HTTPException(status_code=400, detail="spoiler_tier is required for curated universes.")
    if request.canon_sources is None:
        raise HTTPException(status_code=400, detail="canon_sources is required for curated universes.")

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
    system_prompt = build_system_prompt(
        lore_context, request.canon_sources, config,
        request.spoiler_tier, tier_order
    )

    # Call Claude
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set.")

    client = anthropic.Anthropic(api_key=api_key)

    messages = list(request.history) if request.history else []
    messages.append({"role": "user", "content": request.question})

    with client.messages.stream(
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        system=system_prompt,
        messages=messages,
    ) as stream:
        raw_answer = stream.get_final_message().content[0].text

    answer, suggestions, spoiler_gated, gated_message, gated_tier, gated_answer = parse_gated_response(raw_answer)

    confidence = "high" if has_lore_files else "general"

    if spoiler_gated:
        # Extract badges from gated_answer for when the user reveals
        gated_badges = extract_badges_from_answer(gated_answer or "", request.canon_sources)
        if not gated_badges:
            gated_badges = extract_canon_badges(lore_context, request.canon_sources)
        return AskResponse(
            answer=None,
            canon_badges=gated_badges,
            spoiler_safe=False,
            suggestions=suggestions,
            confidence=confidence,
            spoiler_gated=True,
            gated_message=gated_message,
            gated_tier=gated_tier,
            gated_answer=gated_answer,
        )

    canon_badges = extract_badges_from_answer(answer or "", request.canon_sources)
    if not canon_badges:
        canon_badges = extract_canon_badges(lore_context, request.canon_sources)

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
