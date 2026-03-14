import { useState, useRef, useEffect, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : `http://${window.location.hostname}:8000`)

const QUOTES = [
  {
    text: 'Evil is evil. Lesser, greater, middling. If I have to choose between one evil and another, I\'d rather not choose at all.',
    author: 'Geralt of Rivia',
  },
  {
    text: 'The world doesn\'t need a hero. It needs a professional.',
    author: 'Geralt of Rivia',
  },
  {
    text: 'People like to invent monsters and monstrosities. Then they seem less monstrous themselves.',
    author: 'Andrzej Sapkowski',
  },
  {
    text: 'You can\'t stop a soldier from being afraid. You can only teach him not to show it.',
    author: 'Vesemir',
  },
  {
    text: 'Not all that is black is darkness.',
    author: 'Dandelion',
  },
  {
    text: 'Mistakes are also important to me. I don\'t cross them out of my life or memory.',
    author: 'Geralt of Rivia',
  },
]

const TIER_LABELS = {
  white_orchard: 'WHITE ORCHARD',
  velen_novigrad: 'VELEN',
  skellige: 'SKELLIGE',
  main_complete: 'MAIN QUEST',
  everything: 'EVERYTHING',
}

const SOURCE_LABELS = {
  game_w3: 'W3',
  game_w1w2: 'W1+W2',
  books_sapkowski: 'BOOKS',
  netflix: 'NETFLIX',
}

function canonSourcesLabel(sources) {
  if (!sources?.length) return 'W3'
  return sources.map(s => SOURCE_LABELS[s] || s).join(' + ')
}

function Diamond() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="inline-block">
      <path d="M5 0L10 5L5 10L0 5Z" fill="#c9a84c" />
    </svg>
  )
}

function BottomSheet({ settings, onReset, onClose }) {
  const tierLabel = TIER_LABELS[settings.spoilerTier] || settings.spoilerTier
  const sourcesLabel = canonSourcesLabel(settings.canonSources)

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
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-['Crimson_Pro'] text-[15px] text-[#5a5540]">Spoiler tier</span>
            <span className="font-['Cinzel'] text-[11px] tracking-[0.1em] text-[#c9a84c]">{tierLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-['Crimson_Pro'] text-[15px] text-[#5a5540]">Canon sources</span>
            <span className="font-['Cinzel'] text-[11px] tracking-[0.1em] text-[#c9a84c]">{sourcesLabel}</span>
          </div>
        </div>

        <div className="h-px bg-[#2e2614] mb-6" />

        {/* Reset */}
        <button
          onClick={onReset}
          className="w-full py-4 rounded-[12px] border border-[#2e2614] font-['Cinzel'] text-[12px] tracking-[0.15em] text-[#5a5540] transition-all duration-150 hover:border-[#c9a84c] hover:text-[#c9a84c]"
        >
          RESET AND START OVER
        </button>
      </div>
    </div>
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

function Message({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-4 answer-fade">
        <div
          className="max-w-[80%] rounded-[12px] px-4 py-3 bg-[#1c180c] border border-[#2e2614]"
        >
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
            <p className="font-['Crimson_Pro'] text-[16px] text-[#c9a84c] leading-relaxed">
              {msg.content}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // assistant
  return (
    <div className="flex items-start gap-3 mb-4 answer-fade">
      <div className="flex-1 max-w-[90%]">
        <div className="rounded-[12px] px-4 py-3 bg-[#0e0d0b] border border-[#1e1c14]">
          <p className="font-['Crimson_Pro'] text-[17px] text-[#9a9070] leading-relaxed whitespace-pre-wrap">
            {msg.content}
          </p>

          {/* Spoiler note */}
          {msg.spoilerSafe === false && (
            <div className="mt-3 flex items-start gap-2">
              <Diamond />
              <p className="font-['Crimson_Pro'] text-[14px] italic text-[#5a5540] leading-snug">
                More lies ahead, beyond your current chapter.
              </p>
            </div>
          )}

          {/* Canon badges */}
          {msg.badges?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {msg.badges.map(badge => (
                <span
                  key={badge}
                  className="font-['Crimson_Pro'] text-[10px] tracking-[0.1em] text-[#c9a84c] border border-[#c9a84c]/40 rounded-[20px] px-2 py-0.5 uppercase"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AskScreen({ settings, onReset }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSheet, setShowSheet] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const quote = useRef(QUOTES[Math.floor(Math.random() * QUOTES.length)]).current

  const tierLabel = TIER_LABELS[settings.spoilerTier] || settings.spoilerTier
  const sourcesLabel = canonSourcesLabel(settings.canonSources)

  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
    return () => clearTimeout(timer)
  }, [messages, loading])

  const sendMessage = useCallback(async () => {
    const q = input.trim()
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
          universe_id: 'witcher3',
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
        },
      ])
    } catch (err) {
      const isNetworkErr = err instanceof TypeError && err.message.includes('fetch')
      const content = isNetworkErr
        ? 'The Continent is unreachable. Make sure the server is running.'
        : err.isRateLimit
        ? err.message
        : `Something went wrong: ${err.message}`
      setMessages(prev => [
        ...prev,
        { role: 'error', content },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, loading, settings, messages])

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
        <span className="font-['Cinzel'] text-lg text-[#c9a84c] tracking-[0.1em]">LORE</span>

        <div className="flex items-center gap-2">
          <span className="font-['Cinzel'] text-[10px] tracking-[0.1em] text-[#5a5540] border border-[#2e2614] rounded-[20px] px-3 py-1">
            {tierLabel}
          </span>
          <span className="font-['Cinzel'] text-[10px] tracking-[0.1em] text-[#5a5540] border border-[#2e2614] rounded-[20px] px-3 py-1">
            {sourcesLabel}
          </span>
          <button
            onClick={() => setShowSheet(true)}
            className="ml-1 flex flex-col gap-1 p-2 text-[#5a5540] hover:text-[#9a9070] transition-colors"
          >
            <span className="block w-4 h-px bg-current" />
            <span className="block w-4 h-px bg-current" />
            <span className="block w-4 h-px bg-current" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && !loading ? (
          /* Empty state quote */
          <div className="flex flex-col items-center justify-center min-h-full px-4">
            <div className="flex flex-col items-center gap-4 max-w-sm">
              <Diamond />
              <blockquote className="font-['Crimson_Pro'] text-[18px] italic text-[#5a5540] text-center leading-relaxed">
                &ldquo;{quote.text}&rdquo;
              </blockquote>
              <Diamond />
              <p className="font-['Cinzel'] text-[10px] tracking-[0.15em] text-[#3a3520]">
                — {quote.author}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
            {loading && <LoadingDots />}
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
            placeholder="Ask about the Continent..."
            className="flex-1 bg-[#111009] border border-[#2e2614] rounded-[20px] px-4 py-3 font-['Crimson_Pro'] text-[16px] text-[#e8dfc0] placeholder-[#3a3520] outline-none focus:border-[#c9a84c]/40 transition-colors disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full bg-[#c9a84c] flex items-center justify-center flex-shrink-0 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#d9b85c]"
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
          onReset={() => { setShowSheet(false); onReset() }}
          onClose={() => setShowSheet(false)}
        />
      )}
    </div>
  )
}
