# Lore Companion

A universal lore companion for story-driven games, books, and films. Spoiler-safe, canon-accurate Q&A that answers from your position in the story.

**Live at:** [lore-companion.vercel.app](https://lore-companion.vercel.app)

---

## The Problem

- **Wikis spoil everything.** One wrong click and a major death or twist is ruined.
- **AI tools hallucinate.** They confidently mix up timelines, invent characters, and blend sources.
- **Adaptations contaminate the information space.** Book lore, game lore, and show lore blur together when you just want to know what happened in *your* version of the story.

Lore Companion fixes all three. It knows exactly where you are in the story, which sources you trust, and never reveals what comes next.

---

## Key Features

### Spoiler Tier System
Every universe uses real narrative milestones — not generic "Act 1/2/3" labels. In The Witcher, tiers follow regions like White Orchard → Velen & Novigrad → Skellige. In Elden Ring, it's Limgrave → Liurnia → Altus Plateau and beyond. You set your progress and the system filters everything above it **before** the AI ever sees it.

### Canon Source Disambiguation
Choose exactly which sources count. Playing Witcher 3 but haven't read the books? Only want Frank Herbert's Dune, not the films? The system separates books, games, shows, and films so you get answers from the sources you trust. Adaptations are always clearly flagged.

### Confidence Indicator
Every answer is marked as **LORE VERIFIED** (sourced from curated lore files) or **GENERAL KNOWLEDGE** (answered from the model's training data). You always know how much to trust the response.

### Open Platform
Six curated universes ship with deep, structured lore. But you can ask about *any* universe — the system falls back to general knowledge mode with the same spoiler-aware conversation style.

### Conversation Memory
Follow-up questions carry context from the conversation. Ask "Who is Yennefer?" then "What's her relationship with Geralt?" — it remembers.

### Suggested Follow-ups & Go Deeper
Every answer comes with contextual follow-up suggestions. Hit **Go Deeper** to explore a topic further without crafting a new question.

### Mobile PWA
Built as a Progressive Web App. Install it on your phone and use it while you play.

---

## Curated Universes

| Universe | Sources |
|----------|---------|
| **The Witcher** | Witcher 3, Witcher 1 & 2, Sapkowski novels, Netflix series |
| **Elden Ring** | Base game, Shadow of the Erdtree DLC |
| **Dune** | Frank Herbert novels, Villeneuve films |
| **Lord of the Rings** | Tolkien novels, Jackson films, Rings of Power |
| **Game of Thrones** | ASOIAF books, Game of Thrones show, House of the Dragon |
| **Star Wars** | Original trilogy, Prequels, Sequels, Canon TV series, Legends |
| *Any universe* | General knowledge fallback — ask about anything |

---

## Architecture

### Adding a New Universe
Drop in a config folder under `universes/`. No backend code changes required. Each universe defines its own:
- Display name, accent color, and voice profile
- Spoiler tiers mapped to real story milestones
- Canon sources with labels and default selections
- Structured markdown lore files organized by category

### Three-Layer RAG Pipeline
```
Universe Config → Content Filtering (spoiler + canon) → AI Generation
```

1. **Universe Config** — loads the universe definition, voice profile, and canon rules
2. **Content Filtering** — filters lore files by spoiler tier and selected canon sources. Restricted content is excluded *before* the API call, so the model never sees what it shouldn't reveal
3. **AI Generation** — Claude generates the answer using only the filtered context, in the voice of the world

### Why Filtering Before Generation Matters
The model cannot leak spoilers it was never given. This is a hard architectural guarantee, not a prompt instruction the model might ignore.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **Backend** | FastAPI (Python) |
| **AI Model** | Claude Haiku (Anthropic) — production |
| **Lore Storage** | Structured markdown files with spoiler/canon tags |
| **Config** | Universe-agnostic `config.json` per universe |
| **Hosting** | Vercel (frontend) + Render (backend) |

---

## Project Structure

```
lore-companion/
├── frontend/          # React PWA
│   └── src/
│       ├── components/    # UI screens and shared components
│       └── universes.js   # Universe config registry
├── backend/
│   └── main.py        # FastAPI app, /ask endpoint
└── universes/         # Curated lore databases
    ├── witcher3/
    ├── eldenring/
    ├── dune/
    ├── lotr/
    ├── got/
    └── starwars/
```