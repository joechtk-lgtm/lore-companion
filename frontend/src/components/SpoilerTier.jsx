import { useState } from 'react'

const TIERS = [
  {
    id: 'white_orchard',
    label: 'WHITE ORCHARD',
    desc: 'Just started. Before Velen.',
  },
  {
    id: 'velen_novigrad',
    label: 'VELEN + NOVIGRAD',
    desc: "Searching for Ciri's trail.",
  },
  {
    id: 'skellige',
    label: 'SKELLIGE + KAER MORHEN',
    desc: 'Ciri found. Wild Hunt closing in.',
  },
  {
    id: 'main_complete',
    label: 'MAIN STORY COMPLETE',
    desc: 'Before the DLCs.',
  },
  {
    id: 'everything',
    label: 'EVERYTHING',
    desc: 'Both DLCs complete. No limits.',
  },
]

export default function SpoilerTier({ onContinue }) {
  const [selected, setSelected] = useState('velen_novigrad')

  return (
    <div className="screen-enter flex flex-col min-h-screen px-5 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="stagger-0 font-['Cinzel'] text-[11px] tracking-[0.2em] text-[#5a5540] mb-4">
          LORE
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
        {TIERS.map((tier, i) => {
          const isSelected = selected === tier.id
          return (
            <button
              key={tier.id}
              onClick={() => setSelected(tier.id)}
              className={`stagger-${i + 3} text-left rounded-[12px] p-4 border transition-all duration-200 w-full
                ${isSelected
                  ? 'bg-[#16130a] border-[#c9a84c]'
                  : 'bg-[#111009] border-[#2e2614]'
                }
              `}
            >
              <div className="flex items-start gap-3">
                {/* Radio dot */}
                <div className={`w-5 h-5 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200
                  ${isSelected
                    ? 'border-[#c9a84c]'
                    : 'border-[#5a5540]'
                  }
                `}>
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#c9a84c]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-['Cinzel'] text-[11px] tracking-[0.15em] text-[#c9a84c] mb-1">
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
          className="w-full py-4 rounded-[12px] bg-[#c9a84c] font-['Cinzel'] text-[12px] tracking-[0.2em] text-[#0e0d0b] transition-all duration-150 hover:bg-[#d9b85c]"
        >
          ENTER THE CONTINENT
        </button>
      </div>
    </div>
  )
}
