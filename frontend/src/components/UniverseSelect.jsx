import { useState } from 'react'
import { UNIVERSES, getTierLabel } from '../universes'

function Diamond({ color = '#c9a84c' }) {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="inline-block flex-shrink-0">
      <path d="M5 0L10 5L5 10L0 5Z" fill={color} />
    </svg>
  )
}

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
}) {
  const universeList = Object.values(UNIVERSES)
  const [selectedId, setSelectedId] = useState(
    returnShortcut?.universeId || universeList[0].id
  )

  const selected = UNIVERSES[selectedId]
  const accent = selected.accentColor

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
                  <span className="text-[#e8dfc0]">
                    {UNIVERSES[returnShortcut.universeId]?.title.replace('THE ', '')}
                  </span>
                  {' · '}
                  <span style={{ color: UNIVERSES[returnShortcut.universeId]?.accentColor }}>
                    {getTierLabel(UNIVERSES[returnShortcut.universeId], returnShortcut.spoilerTier)}
                  </span>
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
