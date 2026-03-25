import { useState, useRef, useEffect, useCallback } from 'react'
import { getTierLabel } from '../universes'

const API_BASE = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : `http://${window.location.hostname}:8000`)

const QUOTES = {
  witcher3: [
    { text: "Evil is evil. Lesser, greater, middling. If I have to choose between one evil and another, I'd rather not choose at all.", author: 'Geralt of Rivia' },
    { text: "The world doesn't need a hero. It needs a professional.", author: 'Geralt of Rivia' },
    { text: 'People like to invent monsters and monstrosities. Then they seem less monstrous themselves.', author: 'Andrzej Sapkowski' },
    { text: "You can't stop a soldier from being afraid. You can only teach him not to show it.", author: 'Vesemir' },
    { text: "Mistakes are also important to me. I don't cross them out of my life or memory.", author: 'Geralt of Rivia' },
    { text: 'Not all that is black is darkness.', author: 'Dandelion' },
  ],
  eldenring: [
    { text: 'Arise now, ye Tarnished. Ye dead, who yet live.', author: 'Elden Ring' },
    { text: "The Elden Ring. The source of the Erdtree's power. Coveted by all who draw breath.", author: 'Elden Ring' },
    { text: 'I will not become a lord. No, I will put an end to the reign of the Erdtree.', author: 'Ranni the Witch' },
    { text: 'A lord is raised up and brought low. The Erdtree governs all.', author: 'Elden Ring' },
    { text: 'Eternal city, sunken underground. Consigned to the dark since the time of the crucible.', author: 'Elden Ring' },
    { text: 'The stars age, wane, and die. And so do all things.', author: 'Ranni the Witch' },
  ],
  dune: [
    { text: 'I must not fear. Fear is the mind-killer.', author: 'Paul Atreides' },
    { text: 'The spice must flow.', author: 'Dune' },
    { text: 'He who controls the spice controls the universe.', author: 'Baron Harkonnen' },
    { text: 'A beginning is the time for taking the most delicate care that balances are correct.', author: "The Manual of Muad'Dib" },
    { text: "The mystery of life isn't a problem to solve, but a reality to experience.", author: 'Frank Herbert' },
    { text: 'Deep in the human unconscious is a pervasive need for a logical universe that makes sense.', author: 'Frank Herbert' },
  ],
  lotr: [
    { text: 'Even the smallest person can change the course of the future.', author: 'Galadriel' },
    { text: 'All we have to decide is what to do with the time that is given us.', author: 'Gandalf' },
    { text: 'Not all those who wander are lost.', author: 'J.R.R. Tolkien' },
    { text: 'The world is indeed full of peril and in it there are many dark places.', author: 'Haldir' },
    { text: 'I will not say do not weep, for not all tears are an evil.', author: 'Gandalf' },
    { text: 'There is some good in this world, and it\'s worth fighting for.', author: 'Samwise Gamgee' },
  ],
  got: [
    { text: 'When you play the game of thrones, you win or you die.', author: 'Cersei Lannister' },
    { text: 'A mind needs books as a sword needs a whetstone.', author: 'Tyrion Lannister' },
    { text: 'The night is dark and full of terrors.', author: 'Melisandre' },
    { text: 'Words are wind.', author: 'George R.R. Martin' },
    { text: 'Chaos is not a pit. Chaos is a ladder.', author: 'Petyr Baelish' },
    { text: 'Winter is coming.', author: 'House Stark' },
  ],
}

function Diamond({ color = '#c9a84c' }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="inline-block flex-shrink-0">
      <path d="M5 0L10 5L5 10L0 5Z" fill={color} />
    </svg>
  )
}

function LoadingDots() {
  return (
    <div className="flex items-start gap-3 mb-4 answer-fade">
      <div className="flex-1 max-w-[85%]">
        <div className="rounded-[12px] px-4 py-3 bg-[#0e0d0b] border border-[#1e1c14]">
          <div className="dot-pulse">
            <span /><span /><span />
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfidenceIndicator({ confidence, accentColor }) {
  if (!confidence) return null
  const isHigh = confidence === 'high'
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: isHigh ? accentColor : '#5a5540' }}
      />
      <span
        className="font-['Cinzel'] text-[9px] tracking-[0.1em]"
        style={{ color: isHigh ? accentColor : '#5a5540' }}
      >
        {isHigh ? 'LORE VERIFIED' : 'GENERAL KNOWLEDGE'}
      </span>
    </div>
  )
}

function Message({ msg, accentColor, onSuggestionTap, onGoDeeper }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-4 answer-fade">
        <div className="max-w-[80%] rounded-[12px] px-4 py-3 bg-[#1c180c] border border-[#2e2614]">
          <p className="font-['Crimson_Pro'] text-[16px] italic text-[#e8dfc0] leading-relaxed">
            {msg.content}
          </p>
        </div>
      </div>
    )
  }

  if (msg.role === 'error') {
    return (
      <div className="flex items-start gap-3 mb-4 answer-fade">
        <div className="flex-1 max-w-[90%]">
          <div className="rounded-[12px] px-4 py-3 bg-[#0e0d0b] border border-[#2e2614]">
            <p className="font-['Crimson_Pro'] text-[16px] leading-relaxed" style={{ color: accentColor }}>
              {msg.content}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // assistant
  return (
    <div className="mb-4 answer-fade">
      <div className="flex items-start gap-3">
        <div className="flex-1 max-w-[90%]">
          <div className="rounded-[12px] px-4 py-3 bg-[#0e0d0b] border border-[#1e1c14]">
            <p className="font-['Crimson_Pro'] text-[17px] text-[#9a9070] leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </p>

            {msg.spoilerSafe === false && (
              <div className="mt-3 flex items-start gap-2">
                <Diamond color={accentColor} />
                <p className="font-['Crimson_Pro'] text-[14px] italic text-[#5a5540] leading-snug">
                  More lies ahead, beyond your current chapter.
                </p>
              </div>
            )}

            {msg.badges?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {msg.badges.map(badge => (
                  <span
                    key={badge}
                    className="font-['Crimson_Pro'] text-[10px] tracking-[0.1em] border rounded-[20px] px-2 py-0.5 uppercase"
                    style={{ color: accentColor, borderColor: `${accentColor}40` }}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}

            <ConfidenceIndicator confidence={msg.confidence} accentColor={accentColor} />
          </div>

          {/* Go deeper */}
          <button
            onClick={onGoDeeper}
            className="mt-2 ml-1 font-['Crimson_Pro'] text-[13px] italic text-[#5a5540] hover:text-[#9a9070] transition-colors"
          >
            Go deeper →
          </button>
        </div>
      </div>

      {/* Suggestion pills */}
      {msg.suggestions?.length > 0 && (
        <div className="mt-3 ml-0 flex flex-wrap gap-2 max-w-[90%]">
          {msg.suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestionTap(s)}
              className="text-left font-['Crimson_Pro'] text-[14px] italic border rounded-[20px] px-3 py-1.5 transition-all duration-150"
              style={{
                color: '#9a9070',
                borderColor: '#2e2614',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = accentColor
                e.currentTarget.style.color = accentColor
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#2e2614'
                e.currentTarget.style.color = '#9a9070'
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function BottomSheet({ settings, universe, onChangeTier, onChangeCanon, onSwitchUniverse, onResetAll, onClose }) {
  const tierLabel = getTierLabel(universe, settings.spoilerTier)
  const sourcesLabel = settings.canonSources.map(s => {
    const src = universe.sources.find(x => x.id === s)
    return src ? src.label.split(' ')[0] : s
  }).join(' + ')
  const accent = universe.accentColor

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div
        className="sheet-enter bg-[#111009] rounded-t-[24px] border-t border-[#2e2614] px-5 pt-6 pb-10 max-w-[430px] mx-auto w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Close row */}
        <div className="flex items-center justify-between mb-6">
          <span className="font-['Cinzel'] text-[11px] tracking-[0.2em] text-[#5a5540]">SETTINGS</span>
          <button onClick={onClose} className="text-[#5a5540] hover:text-[#9a9070] transition-colors">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-['Crimson_Pro'] text-[15px] text-[#5a5540]">Universe</span>
            <span className="font-['Cinzel'] text-[11px] tracking-[0.1em]" style={{ color: accent }}>
              {universe.title}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-['Crimson_Pro'] text-[15px] text-[#5a5540]">Spoiler tier</span>
            <span className="font-['Cinzel'] text-[11px] tracking-[0.1em]" style={{ color: accent }}>
              {tierLabel}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-['Crimson_Pro'] text-[15px] text-[#5a5540]">Canon sources</span>
            <span className="font-['Cinzel'] text-[11px] tracking-[0.1em]" style={{ color: accent }}>
              {sourcesLabel}
            </span>
          </div>
        </div>

        <div className="h-px bg-[#2e2614] mb-5" />

        {/* Actions */}
        <div className="space-y-2">
          {[
            { label: 'CHANGE SPOILER TIER', action: onChangeTier },
            { label: 'CHANGE CANON SOURCES', action: onChangeCanon },
            { label: 'SWITCH UNIVERSE', action: onSwitchUniverse },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={() => { onClose(); action() }}
              className="w-full py-3.5 rounded-[12px] border border-[#2e2614] font-['Cinzel'] text-[11px] tracking-[0.15em] text-[#5a5540] transition-all duration-150 hover:border-[#5a5540] hover:text-[#9a9070]"
            >
              {label}
            </button>
          ))}

          <button
            onClick={() => { onClose(); onResetAll() }}
            className="w-full py-3.5 rounded-[12px] border border-[#2e2614] font-['Cinzel'] text-[11px] tracking-[0.15em] text-[#3a3520] transition-all duration-150 hover:border-[#5a5540] hover:text-[#5a5540]"
          >
            RESET EVERYTHING
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AskScreen({
  settings,
  universe,
  onChangeTier,
  onChangeCanon,
  onSwitchUniverse,
  onResetAll,
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState(0)
  const [showSheet, setShowSheet] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const accent = universe.accentColor
  const universeQuotes = QUOTES[universe.id] || QUOTES.witcher3
  const quote = useRef(universeQuotes[Math.floor(Math.random() * universeQuotes.length)]).current
  const tierLabel = getTierLabel(universe, settings.spoilerTier)

  // Wake-up message timer
  useEffect(() => {
    if (!loading) {
      setLoadingStage(0)
      return
    }
    const t1 = setTimeout(() => setLoadingStage(1), 8000)
    const t2 = setTimeout(() => setLoadingStage(2), 20000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [loading])

  // Scroll to bottom on new messages
  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
    return () => clearTimeout(timer)
  }, [messages, loading])

  const sendMessage = useCallback(async (questionOverride) => {
    const q = (typeof questionOverride === 'string' ? questionOverride : input).trim()
    if (!q || loading) return

    const history = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }))

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          universe_id: settings.universeId,
          spoiler_tier: settings.spoilerTier,
          canon_sources: settings.canonSources,
          question: q,
          history,
        }),
      })

      if (!res.ok) {
        if (res.status === 429) {
          const data = await res.json().catch(() => ({}))
          const err = new Error(data.detail || 'Rate limit exceeded.')
          err.isRateLimit = true
          throw err
        }
        throw new Error(`Server error: ${res.status}`)
      }
      const data = await res.json()

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          badges: data.canon_badges || [],
          spoilerSafe: data.spoiler_safe,
          suggestions: data.suggestions || [],
          confidence: data.confidence,
        },
      ])
    } catch (err) {
      const isNetworkErr = err instanceof TypeError && err.message.includes('fetch')
      const content = isNetworkErr
        ? 'The world is unreachable. Make sure the server is running.'
        : err.isRateLimit
        ? err.message
        : `Something went wrong: ${err.message}`
      setMessages(prev => [...prev, { role: 'error', content }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, loading, settings, messages])

  function handleGoDeeper() {
    sendMessage('Tell me more about the most interesting part of what you just said.')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="screen-enter flex flex-col h-screen bg-[#0e0d0b]">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-[#1e1c14]">
        {/* Back arrow */}
        <button
          onClick={onSwitchUniverse}
          className="text-[#5a5540] hover:text-[#9a9070] transition-colors p-1 -ml-1"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 3L6 10L13 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Universe + tier pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchUniverse}
            className="font-['Cinzel'] text-[10px] tracking-[0.1em] border rounded-[20px] px-3 py-1 transition-colors"
            style={{ color: accent, borderColor: `${accent}60` }}
          >
            {universe.title.replace('THE ', '')}
          </button>
          <span className="font-['Cinzel'] text-[10px] tracking-[0.1em] text-[#5a5540] border border-[#2e2614] rounded-[20px] px-3 py-1">
            {tierLabel}
          </span>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setShowSheet(true)}
          className="flex flex-col gap-1 p-2 text-[#5a5540] hover:text-[#9a9070] transition-colors"
        >
          <span className="block w-4 h-px bg-current" />
          <span className="block w-4 h-px bg-current" />
          <span className="block w-4 h-px bg-current" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center min-h-full px-4">
            <div className="flex flex-col items-center gap-4 max-w-sm">
              <Diamond color={accent} />
              <blockquote className="font-['Crimson_Pro'] text-[18px] italic text-[#5a5540] text-center leading-relaxed">
                &ldquo;{quote.text}&rdquo;
              </blockquote>
              <Diamond color={accent} />
              <p className="font-['Cinzel'] text-[10px] tracking-[0.15em] text-[#3a3520]">
                — {quote.author}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <Message
                key={i}
                msg={msg}
                accentColor={accent}
                onSuggestionTap={sendMessage}
                onGoDeeper={handleGoDeeper}
              />
            ))}
            {loading && (
              loadingStage === 0 ? (
                <LoadingDots />
              ) : (
                <div className="flex items-start gap-3 mb-4 answer-fade">
                  <div className="flex-1 max-w-[85%]">
                    <div className="rounded-[12px] px-4 py-3 bg-[#0e0d0b] border border-[#1e1c14] flex items-start gap-2">
                      <Diamond color={accent} />
                      <p className="font-['Crimson_Pro'] text-[16px] italic text-[#5a5540] leading-relaxed">
                        {loadingStage === 1
                          ? universe.wakeMessage
                          : 'Still summoning\u2026 this can take up to a minute on first use. Worth the wait.'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div
        className="flex-shrink-0 px-4 py-3 border-t border-[#1e1c14] bg-[#0e0d0b]"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask about the lore..."
            className="flex-1 bg-[#111009] border border-[#2e2614] rounded-[20px] px-4 py-3 font-['Crimson_Pro'] text-[16px] text-[#e8dfc0] placeholder-[#3a3520] outline-none transition-colors disabled:opacity-50"
            style={{ '--focus-border': `${accent}40` }}
            onFocus={e => e.currentTarget.style.borderColor = `${accent}40`}
            onBlur={e => e.currentTarget.style.borderColor = '#2e2614'}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: accent }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 13V3M3 8L8 3L13 8" stroke="#0e0d0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom sheet */}
      {showSheet && (
        <BottomSheet
          settings={settings}
          universe={universe}
          onChangeTier={onChangeTier}
          onChangeCanon={onChangeCanon}
          onSwitchUniverse={onSwitchUniverse}
          onResetAll={onResetAll}
          onClose={() => setShowSheet(false)}
        />
      )}
    </div>
  )
}
