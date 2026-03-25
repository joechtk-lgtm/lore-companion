import { useState, useRef } from 'react'
import { UNIVERSES, getTierLabel } from '../universes'

function Diamond({ color = '#c9a84c' }) {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="inline-block flex-shrink-0">
      <path d="M5 0L10 5L5 10L0 5Z" fill={color} />
    </svg>
  )
}

const POPULAR_UNIVERSES = [
  { name: "Cyberpunk 2077", type: "Game" },
  { name: "Baldur's Gate 3", type: "Game" },
  { name: "Final Fantasy VII", type: "Game" },
  { name: "Mass Effect", type: "Game" },
  { name: "Red Dead Redemption 2", type: "Game" },
  { name: "Dark Souls", type: "Game" },
  { name: "Halo", type: "Game" },
  { name: "The Last of Us", type: "Game" },
  { name: "Horizon Zero Dawn", type: "Game" },
  { name: "God of War", type: "Game" },
  { name: "Breaking Bad", type: "TV Series" },
  { name: "Succession", type: "TV Series" },
  { name: "The Sopranos", type: "TV Series" },
  { name: "Severance", type: "TV Series" },
  { name: "Arcane", type: "TV Series" },
  { name: "Westworld", type: "TV Series" },
  { name: "The Boys", type: "TV Series" },
  { name: "Peaky Blinders", type: "TV Series" },
  { name: "Shogun", type: "TV Series" },
  { name: "Harry Potter", type: "Book & Film" },
  { name: "His Dark Materials", type: "Book" },
  { name: "Wheel of Time", type: "Book & TV" },
  { name: "Foundation", type: "Book & TV" },
  { name: "Mistborn", type: "Book" },
  { name: "Stormlight Archive", type: "Book" },
  { name: "Star Wars", type: "Film & TV" },
  { name: "Marvel Cinematic Universe", type: "Film & TV" },
  { name: "The Matrix", type: "Film" },
  { name: "Blade Runner", type: "Film" },
  { name: "Interstellar", type: "Film" },
  { name: "Alien", type: "Film" },
]

const UNIVERSE_ICONS = {
  witcher3: (color) => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      {/* Ears */}
      <rect x="4" y="0" width="7" height="10" fill={color}/>
      <rect x="21" y="0" width="7" height="10" fill={color}/>
      {/* Head */}
      <rect x="4" y="7" width="24" height="14" fill={color}/>
      {/* Snout */}
      <rect x="9" y="19" width="14" height="8" fill={color}/>
      {/* Eyes */}
      <rect x="8" y="11" width="5" height="5" fill="rgba(0,0,0,0.55)"/>
      <rect x="19" y="11" width="5" height="5" fill="rgba(0,0,0,0.55)"/>
    </svg>
  ),
  eldenring: (color) => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      {/* Trunk */}
      <rect x="14" y="18" width="4" height="14" fill={color}/>
      {/* Top spire */}
      <rect x="15" y="0" width="2" height="10" fill={color}/>
      {/* Main foliage */}
      <rect x="10" y="8" width="12" height="12" fill={color}/>
      {/* Left drooping branch */}
      <rect x="2" y="15" width="10" height="3" fill={color}/>
      <rect x="2" y="18" width="5" height="3" fill={color}/>
      {/* Right drooping branch */}
      <rect x="20" y="15" width="10" height="3" fill={color}/>
      <rect x="25" y="18" width="5" height="3" fill={color}/>
    </svg>
  ),
  dune: (color) => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      {/* Worm body segments in an arc */}
      <rect x="0" y="20" width="8" height="7" fill={color}/>
      <rect x="6" y="13" width="8" height="7" fill={color}/>
      <rect x="12" y="8" width="8" height="7" fill={color}/>
      <rect x="18" y="13" width="8" height="7" fill={color}/>
      <rect x="24" y="20" width="8" height="7" fill={color}/>
      {/* Sand surface line */}
      <rect x="0" y="27" width="32" height="2" fill={`${color}55`}/>
    </svg>
  ),
  lotr: (color) => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      {/* Ring — top and bottom */}
      <rect x="9" y="2" width="14" height="5" fill={color}/>
      <rect x="9" y="25" width="14" height="5" fill={color}/>
      {/* Ring — left and right */}
      <rect x="2" y="9" width="5" height="14" fill={color}/>
      <rect x="25" y="9" width="5" height="14" fill={color}/>
      {/* Ring — four corners */}
      <rect x="5" y="5" width="6" height="6" fill={color}/>
      <rect x="21" y="5" width="6" height="6" fill={color}/>
      <rect x="5" y="21" width="6" height="6" fill={color}/>
      <rect x="21" y="21" width="6" height="6" fill={color}/>
    </svg>
  ),
  got: (color) => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      {/* Crown base band */}
      <rect x="2" y="19" width="28" height="9" fill={color}/>
      {/* Left prong */}
      <rect x="4" y="8" width="6" height="13" fill={color}/>
      {/* Center prong (tallest) */}
      <rect x="13" y="3" width="6" height="18" fill={color}/>
      {/* Right prong */}
      <rect x="22" y="8" width="6" height="13" fill={color}/>
    </svg>
  ),
}

function UniverseCard({ universe, isSelected, onClick }) {
  const accent = universe.accentColor
  const icon = UNIVERSE_ICONS[universe.id]
  return (
    <button
      onClick={onClick}
      className={`relative text-left rounded-[14px] p-5 border transition-all duration-200 w-full
        ${isSelected
          ? 'bg-[#16130a] border-current'
          : 'bg-[#111009] border-[#2e2614]'
        }
      `}
      style={isSelected ? { borderColor: accent } : {}}
    >
      {icon && (
        <div className="absolute top-4 right-4 opacity-35 pointer-events-none">
          {icon(accent)}
        </div>
      )}
      <div
        className="font-['Cinzel'] text-[10px] tracking-[0.18em] mb-2 pr-10"
        style={{ color: accent }}
      >
        {universe.title}
      </div>
      <p className="font-['Crimson_Pro'] text-[13px] italic text-[#5a5540] leading-snug mb-3 pr-10">
        {universe.subtitle}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {universe.tags.map(tag => (
          <span
            key={tag}
            className="font-['Cinzel'] text-[9px] tracking-[0.1em] border rounded-[20px] px-2 py-0.5"
            style={{ color: accent, borderColor: `${accent}40` }}
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  )
}

export default function UniverseSelect({
  returnShortcut,
  onReturnShortcut,
  onSetPreferences,
  onSkipSetup,
  onOpenUniverse,
}) {
  const universeList = Object.values(UNIVERSES)
  const [selectedId, setSelectedId] = useState(
    (returnShortcut && !returnShortcut.isCustom && returnShortcut.universeId) || universeList[0].id
  )
  const [query, setQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const searchRef = useRef(null)

  const selected = UNIVERSES[selectedId]
  const accent = selected.accentColor

  const filteredSuggestions = query.length > 0
    ? POPULAR_UNIVERSES.filter(u => u.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : []
  const exactMatch = filteredSuggestions.some(u => u.name.toLowerCase() === query.toLowerCase())
  const showCustomEntry = query.length > 0 && !exactMatch

  // Returning user shortcut helpers
  const rcUniverse = returnShortcut ? UNIVERSES[returnShortcut.universeId] : null
  const rcIsCustom = returnShortcut ? (returnShortcut.isCustom || !rcUniverse) : false
  const rcName = rcIsCustom ? returnShortcut?.universeName : rcUniverse?.title.replace('THE ', '')
  const rcTierLabel = rcIsCustom ? 'General knowledge' : (rcUniverse ? getTierLabel(rcUniverse, returnShortcut?.spoilerTier) : '')
  const rcAccent = rcIsCustom ? '#7a7a6a' : rcUniverse?.accentColor

  return (
    <div className="screen-enter flex flex-col min-h-screen px-5 py-10">

      {/* Header */}
      <div className="mb-8">
        <div className="stagger-0 font-['Cinzel'] text-[11px] tracking-[0.2em] text-[#5a5540] mb-4">
          LORE COMPANION
        </div>
        <h1 className="stagger-1 font-['Cinzel'] text-2xl font-semibold text-[#e8dfc0] leading-tight mb-2">
          Choose your world.
        </h1>
        <p className="stagger-2 font-['Crimson_Pro'] text-[17px] italic text-[#5a5540] leading-relaxed">
          Select a universe to explore its lore, characters, and history.
        </p>
      </div>

      {/* Returning user shortcut */}
      {returnShortcut && (
        <div className="stagger-2 mb-6">
          <button
            onClick={onReturnShortcut}
            className="w-full text-left rounded-[14px] p-4 border border-[#2e2614] bg-[#111009] hover:border-[#5a5540] transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-['Cinzel'] text-[10px] tracking-[0.15em] text-[#5a5540] mb-1">
                  WELCOME BACK
                </div>
                <div className="font-['Crimson_Pro'] text-[15px] text-[#9a9070]">
                  Continue as{' '}
                  <span className="text-[#e8dfc0]">{rcName}</span>
                  {' · '}
                  <span style={{ color: rcAccent }}>{rcTierLabel}</span>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-[#5a5540]">
                <path d="M3 8H13M8 3L13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
          <p className="font-['Crimson_Pro'] text-[13px] italic text-[#3a3520] text-center mt-3">
            or choose a different world
          </p>
        </div>
      )}

      {/* Universe cards */}
      <div className="stagger-3 flex flex-col gap-3 mb-8">
        {universeList.map(u => (
          <UniverseCard
            key={u.id}
            universe={u}
            isSelected={selectedId === u.id}
            onClick={() => setSelectedId(u.id)}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="stagger-4 flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-[#2e2614]" />
        <span className="font-['Crimson_Pro'] text-[13px] italic text-[#3a3520]">or explore any universe</span>
        <div className="flex-1 h-px bg-[#2e2614]" />
      </div>

      {/* Open universe card */}
      <div className="stagger-4 rounded-[14px] bg-[#111009] border border-[#2e2614] p-5 mb-8">
        <div className="font-['Cinzel'] text-[10px] tracking-[0.18em] text-[#5a5540] mb-3">
          EXPLORE ANY UNIVERSE
        </div>

        {/* Search input + autocomplete dropdown */}
        <div className="relative mb-3">
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setDropdownOpen(true) }}
            onFocus={e => {
              setDropdownOpen(true)
              e.currentTarget.style.borderColor = '#7a7a6a40'
            }}
            onBlur={e => {
              setTimeout(() => setDropdownOpen(false), 150)
              e.currentTarget.style.borderColor = '#2e2614'
            }}
            placeholder="Search a universe..."
            className="w-full bg-[#0e0d0b] border border-[#2e2614] rounded-[10px] px-4 py-3 font-['Crimson_Pro'] text-[16px] italic text-[#e8dfc0] placeholder-[#3a3520] outline-none transition-colors"
          />

          {dropdownOpen && query.length > 0 && (filteredSuggestions.length > 0 || showCustomEntry) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#16130a] border border-[#2e2614] rounded-[10px] z-10 overflow-hidden">
              {filteredSuggestions.map(u => (
                <button
                  key={u.name}
                  onMouseDown={e => { e.preventDefault(); setQuery(u.name); setDropdownOpen(false) }}
                  className="w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-[#1c180c] transition-colors"
                >
                  <span className="font-['Crimson_Pro'] text-[15px] italic text-[#9a9070]">{u.name}</span>
                  <span className="font-['Cinzel'] text-[9px] tracking-[0.1em] text-[#3a3520]">{u.type}</span>
                </button>
              ))}
              {showCustomEntry && (
                <button
                  onMouseDown={e => { e.preventDefault(); setDropdownOpen(false) }}
                  className="w-full text-left px-4 py-2.5 flex items-center justify-between border-t border-[#1e1c14] hover:bg-[#1c180c] transition-colors"
                >
                  <span className="font-['Crimson_Pro'] text-[15px] italic text-[#9a9070]">{query}</span>
                  <span className="font-['Cinzel'] text-[9px] tracking-[0.1em] text-[#3a3520]">CUSTOM</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Warning — shown when input has content */}
        {query.trim() && (
          <div className="flex items-start gap-2 mb-3">
            <Diamond color="#3a3520" />
            <p className="font-['Crimson_Pro'] text-[13px] italic text-[#3a3520] leading-snug">
              General knowledge mode. This universe is not in our verified library. Answers draw from AI training data. Spoiler protection is best effort, not guaranteed.
            </p>
          </div>
        )}

        {/* CTA */}
        <button
          disabled={!query.trim()}
          onClick={() => query.trim() && onOpenUniverse(query.trim())}
          className="w-full py-3.5 rounded-[12px] border font-['Cinzel'] text-[11px] tracking-[0.2em] transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            borderColor: query.trim() ? '#7a7a6a' : '#2e2614',
            color: query.trim() ? '#9a9080' : '#3a3520',
          }}
        >
          {query.trim() ? `ENTER ${query.toUpperCase()} →` : 'SEARCH A UNIVERSE FIRST'}
        </button>
      </div>

      {/* Action buttons */}
      <div className="mt-auto space-y-3 stagger-5">
        <button
          onClick={() => onSetPreferences(selectedId)}
          className="w-full py-4 rounded-[12px] border font-['Cinzel'] text-[12px] tracking-[0.2em] transition-all duration-150"
          style={{
            borderColor: accent,
            color: accent,
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = `${accent}0d`}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          SET MY PREFERENCES
        </button>

        <button
          onClick={() => onSkipSetup(selectedId)}
          className="w-full py-3 rounded-[12px] border border-[#2e2614] font-['Cinzel'] text-[11px] tracking-[0.15em] text-[#5a5540] transition-all duration-150 hover:border-[#5a5540] hover:text-[#9a9070]"
        >
          I KNOW EVERYTHING, JUST ASK
        </button>
      </div>

    </div>
  )
}
