import { useState } from 'react'

function BackArrow({ onClick }) {
  return (
    <button onClick={onClick} className="text-[#5a5540] hover:text-[#9a9070] transition-colors p-1 -ml-1">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M13 3L6 10L13 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

function SourceCard({ src, isSelected, accentColor, onToggle, staggerClass }) {
  return (
    <button
      onClick={onToggle}
      className={`${staggerClass} text-left rounded-[12px] p-4 border transition-all duration-200 cursor-pointer w-full
        ${isSelected
          ? 'bg-[#16130a]'
          : 'bg-[#111009] border-[#2e2614]'
        }
      `}
      style={isSelected ? { borderColor: accentColor } : {}}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-5 h-5 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200"
          style={isSelected
            ? { backgroundColor: accentColor, borderColor: accentColor }
            : { borderColor: '#5a5540', backgroundColor: 'transparent' }
          }
        >
          {isSelected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 3.5L3.5 6.5L9 1" stroke="#0e0d0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <div
            className="font-['Cinzel'] text-[11px] tracking-[0.15em] mb-1"
            style={{ color: accentColor }}
          >
            {src.label}
          </div>
          <p className="font-['Crimson_Pro'] text-[15px] text-[#9a9070] leading-snug">
            {src.desc}
          </p>
        </div>
      </div>
    </button>
  )
}

function SourceGroup({ group, selected, accentColor, onToggle, staggerBase }) {
  const [expanded, setExpanded] = useState(!group.collapsed)

  return (
    <div className={`stagger-${staggerBase}`}>
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="flex items-center gap-2 mb-2 mt-4 w-full"
      >
        <span className="font-['Cinzel'] text-[10px] tracking-[0.18em] text-[#5a5540]">
          {group.label}
        </span>
        <div className="flex-1 h-px bg-[#2e2614]" />
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`text-[#5a5540] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {group.warning && expanded && (
        <div className="flex items-start gap-2 mb-2 ml-1">
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="inline-block flex-shrink-0 mt-1">
            <path d="M5 0L10 5L5 10L0 5Z" fill="#3a3520" />
          </svg>
          <p className="font-['Crimson_Pro'] text-[13px] italic text-[#3a3520] leading-snug">
            {group.warning}
          </p>
        </div>
      )}

      {expanded && (
        <div className="flex flex-col gap-3">
          {group.sources.map((src, i) => (
            <SourceCard
              key={src.id}
              src={src}
              isSelected={selected.has(src.id)}
              accentColor={accentColor}
              onToggle={() => onToggle(src.id)}
              staggerClass={`stagger-${staggerBase + i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CanonSetup({ universe, initialSources, onBack, onContinue }) {
  const { sources, sourceGroups, accentColor, defaultSources } = universe
  const defaultSelected = initialSources
    ? new Set(initialSources)
    : new Set(defaultSources || [])

  const [selected, setSelected] = useState(defaultSelected)

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const canContinue = selected.size > 0
  const hasGroups = sourceGroups && sourceGroups.length > 0

  return (
    <div className="screen-enter flex flex-col min-h-screen px-5 py-10">
      {/* Back + Header */}
      <div className="mb-8">
        <div className="stagger-0 flex items-center gap-3 mb-4">
          <BackArrow onClick={onBack} />
          <span className="font-['Cinzel'] text-[11px] tracking-[0.2em] text-[#5a5540]">
            {universe.title}
          </span>
        </div>
        <h1 className="stagger-1 font-['Cinzel'] text-2xl font-semibold text-[#e8dfc0] leading-tight mb-2">
          Which sources<br />do you know?
        </h1>
        <p className="stagger-2 font-['Crimson_Pro'] text-[17px] text-[#9a9070] leading-relaxed">
          We only tell you what you have already encountered.
        </p>
      </div>

      {/* Cards — grouped or flat */}
      <div className="flex flex-col gap-3 flex-1">
        {hasGroups ? (
          sourceGroups.map((group, gi) => (
            <SourceGroup
              key={group.label}
              group={group}
              selected={selected}
              accentColor={accentColor}
              onToggle={toggle}
              staggerBase={3 + gi * 5}
            />
          ))
        ) : (
          sources.map((src, i) => (
            <SourceCard
              key={src.id}
              src={src}
              isSelected={selected.has(src.id)}
              accentColor={accentColor}
              onToggle={() => toggle(src.id)}
              staggerClass={`stagger-${i + 3}`}
            />
          ))
        )}
      </div>

      {/* Continue */}
      <div className="mt-8 stagger-6">
        <button
          onClick={() => canContinue && onContinue([...selected])}
          disabled={!canContinue}
          className="w-full py-4 rounded-[12px] border font-['Cinzel'] text-[12px] tracking-[0.2em] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: canContinue ? accentColor : '#5a5540', color: canContinue ? accentColor : '#5a5540' }}
          onMouseEnter={e => { if (canContinue) e.currentTarget.style.backgroundColor = `${accentColor}0d` }}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          CONTINUE
        </button>
      </div>
    </div>
  )
}
