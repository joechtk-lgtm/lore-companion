import { useState, useEffect } from 'react'
import CanonSetup from './components/CanonSetup'
import SpoilerTier from './components/SpoilerTier'
import AskScreen from './components/AskScreen'

const STORAGE_KEY = 'lore-settings'

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function clearSettings() {
  localStorage.removeItem(STORAGE_KEY)
}

export default function App() {
  const [screen, setScreen] = useState('loading')
  const [settings, setSettings] = useState(null)
  const [canonSources, setCanonSources] = useState(['game_w3'])

  useEffect(() => {
    const saved = loadSettings()
    if (saved?.spoilerTier && saved?.canonSources) {
      setSettings(saved)
      setScreen('ask')
    } else {
      setScreen('canon')
    }
  }, [])

  function handleCanonContinue(sources) {
    setCanonSources(sources)
    setScreen('spoiler')
  }

  function handleSpoilerContinue(tier) {
    const newSettings = { canonSources, spoilerTier: tier }
    saveSettings(newSettings)
    setSettings(newSettings)
    setScreen('ask')
  }

  function handleReset() {
    clearSettings()
    setSettings(null)
    setCanonSources(['game_w3'])
    setScreen('canon')
  }

  if (screen === 'loading') return null

  return (
    <div className="min-h-full bg-[#0e0d0b] flex justify-center">
      <div className="w-full max-w-[430px] min-h-full relative bg-[#0e0d0b]">
        {screen === 'canon' && (
          <CanonSetup key="canon" onContinue={handleCanonContinue} />
        )}
        {screen === 'spoiler' && (
          <SpoilerTier key="spoiler" onContinue={handleSpoilerContinue} />
        )}
        {screen === 'ask' && settings && (
          <AskScreen key="ask" settings={settings} onReset={handleReset} />
        )}
      </div>
    </div>
  )
}
