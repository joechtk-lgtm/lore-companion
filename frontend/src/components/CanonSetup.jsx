import { useState } from 'react'

const SOURCES = [
  {
    id: 'game_w3',
    label: 'WITCHER 3 GAME',
    desc: 'Wild Hunt + both DLCs. The core experience.',
    required: true,
  },
  {
    id: 'game_w1w2',
    label: 'WITCHER 1 + 2 GAMES',
    desc: 'Adds backstory. Safe to include alongside W3.',
  },
  {
    id: 'books_sapkowski',
    label: 'SAPKOWSKI BOOKS',
    desc: 'Original canon. Where everything begins.',
  },
  {
    id: 'netflix',
    label: 'NETFLIX SERIES',
    desc: 'Adaptation only. Will be clearly labeled when referenced.',
  },
]

export default function CanonSetup({ onContinue }) {
  const [selected, setSelected] = useState(new Set(['game_w3']))

  function toggle(id) {
    if (id === 'game_w3') return
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="screen-enter flex flex-col min-h-screen px-5 py-10">
      {/* Header */}
      <div className="mb-8">
        <div
          className="stagger-0 font-['Cinzel'] text-[11px] tracking-[0.2em] text-[#5a5540] mb-4"
        >
          LORE
        </div>
        <h1
          className="stagger-1 font-['Cinzel'] text-2xl font-semibold text-[#e8dfc0] leading-tight mb-2"
        >
          Which sources<br />do you know?
        </h1>
        <p className="stagger-2 font-['Crimson_Pro'] text-[17px] text-[#9a9070] leading-relaxed">
          We only tell you what you have already encountered.
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3 flex-1">
        {SOURCES.map((src, i) => {
          const isSelected = selected.has(src.id)
          return (
            <button
              key={src.id}
              onClick={() => toggle(src.id)}
              className={`stagger-${i + 3} text-left rounded-[12px] p-4 border transition-all duration-200 cursor-pointer w-full
                ${isSelected
                  ? 'bg-[#16130a] border-[#c9a84c]'
                  : 'bg-[#111009] border-[#2e2614]'
                }
              `}
            >
              <div className="flex items-start gap-3">
                {/* Check circle */}
                <div className={`w-5 h-5 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200
                  ${isSelected
                    ? 'bg-[#c9a84c] border-[#c9a84c]'
                    : 'border-[#5a5540] bg-transparent'
                  }
                `}>
                  {isSelected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 3.5L3.5 6.5L9 1" stroke="#0e0d0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-['Cinzel'] text-[11px] tracking-[0.15em] text-[#c9a84c] mb-1">
                    {src.label}
                  </div>
                  <p className="font-['Crimson_Pro'] text-[15px] text-[#9a9070] leading-snug">
                    {src.desc}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Continue */}
      <div className="mt-8 stagger-6">
        <button
          onClick={() => onContinue([...selected])}
          className="w-full py-4 rounded-[12px] border border-[#c9a84c] font-['Cinzel'] text-[12px] tracking-[0.2em] text-[#c9a84c] transition-all duration-150 hover:bg-[#c9a84c]/5"
        >
          CONTINUE
        </button>
      </div>
    </div>
  )
}
