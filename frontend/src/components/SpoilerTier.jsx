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

export default function SpoilerTier({ universe, initialTier, onBack, onContinue }) {
  const { tiers, accentColor, enterLabel } = universe
  const [selected, setSelected] = useState(initialTier || tiers[1]?.id || tiers[0].id)

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
          How far have<br />you played?
        </h1>
        <p className="stagger-2 font-['Crimson_Pro'] text-[17px] text-[#9a9070] leading-relaxed">
          We will never reveal what lies ahead of you.
        </p>
      </div>

      {/* Tier cards */}
      <div className="flex flex-col gap-3 flex-1">
        {tiers.map((tier, i) => {
          const isSelected = selected === tier.id
          return (
            <button
              key={tier.id}
              onClick={() => setSelected(tier.id)}
              className={`stagger-${i + 3} text-left rounded-[12px] p-4 border transition-all duration-200 w-full
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
                    ? { borderColor: accentColor }
                    : { borderColor: '#5a5540' }
                  }
                >
                  {isSelected && (
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className="font-['Cinzel'] text-[11px] tracking-[0.15em] mb-1"
                    style={{ color: accentColor }}
                  >
                    {tier.label}
                  </div>
                  <p className="font-['Crimson_Pro'] text-[15px] text-[#9a9070] leading-snug">
                    {tier.desc}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Enter button */}
      <div className="mt-8 stagger-6">
        <button
          onClick={() => onContinue(selected)}
          className="w-full py-4 rounded-[12px] font-['Cinzel'] text-[12px] tracking-[0.2em] transition-all duration-150"
          style={{ backgroundColor: accentColor, color: '#0e0d0b' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {enterLabel}
        </button>
      </div>
    </div>
  )
}
