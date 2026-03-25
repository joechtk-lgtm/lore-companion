import { useState } from 'react'
import { UNIVERSES, getTierLabel } from '../universes'

function Diamond({ color = '#c9a84c' }) {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="inline-block flex-shrink-0">
      <path d="M5 0L10 5L5 10L0 5Z" fill={color} />
    </svg>
  )
}

function UniverseCard({ universe, isSelected, onClick }) {
  const accent = universe.accentColor
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-[14px] p-4 border transition-all duration-200 w-full
        ${isSelected
          ? 'bg-[#16130a] border-current'
          : 'bg-[#111009] border-[#2e2614]'
        }
      `}
      style={isSelected ? { borderColor: accent } : {}}
    >
      <div
        className="font-['Cinzel'] text-[10px] tracking-[0.18em] mb-2"
        style={{ color: accent }}
      >
        {universe.title}
      </div>
      <p className="font-['Crimson_Pro'] text-[13px] italic text-[#5a5540] leading-snug mb-3">
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
          Choose your<br />world.
        </h1>
        <p className="stagger-2 font-['Crimson_Pro'] text-[17px] text-[#9a9070] leading-relaxed">
          Every universe has its own lore, its own rules.
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
      <div className="stagger-3 grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {universeList.map((u, i) => (
          <div key={u.id} className={universeList.length % 2 !== 0 && i === universeList.length - 1 ? 'sm:col-span-2' : ''}>
            <UniverseCard
              universe={u}
              isSelected={selectedId === u.id}
              onClick={() => setSelectedId(u.id)}
            />
          </div>
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
