import { useState, useEffect } from 'react'
import { UNIVERSES, getTierLabel } from './universes'
import UniverseSelect from './components/UniverseSelect'
import CanonSetup from './components/CanonSetup'
import SpoilerTier from './components/SpoilerTier'
import AskScreen from './components/AskScreen'

const STORE_KEY = 'lore-store'

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? JSON.parse(raw) : { universes: {} }
  } catch {
    return { universes: {} }
  }
}

function saveUniverseSettings(universeId, { canonSources, spoilerTier }) {
  const store = loadStore()
  store.lastUniverse = universeId
  store.universes = store.universes || {}
  store.universes[universeId] = { canonSources, spoilerTier }
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

function clearAll() {
  localStorage.removeItem(STORE_KEY)
}

export default function App() {
  const [screen, setScreen] = useState('loading')
  // universe being configured / active
  const [universeId, setUniverseId] = useState('witcher3')
  // temp state during canon setup
  const [pendingSources, setPendingSources] = useState([])
  // active settings for ask screen
  const [settings, setSettings] = useState(null)
  // 'setup' | 'change-tier' | 'change-canon'
  const [navMode, setNavMode] = useState('setup')
  // returning user shortcut data
  const [returnShortcut, setReturnShortcut] = useState(null)

  useEffect(() => {
    const store = loadStore()
    const lastId = store.lastUniverse
    const lastSaved = lastId && store.universes?.[lastId]
    if (lastSaved?.canonSources && lastSaved?.spoilerTier) {
      setReturnShortcut({
        universeId: lastId,
        ...lastSaved,
      })
    }
    setScreen('universe')
  }, [])

  // Keep shortcut in sync with active settings
  useEffect(() => {
    if (settings) setReturnShortcut(settings)
  }, [settings])

  // ── Universe Select ────────────────────────────────────────────

  function handleUniverseSetPreferences(id) {
    setUniverseId(id)
    const universe = UNIVERSES[id]
    setPendingSources(universe.defaultSources)
    setNavMode('setup')
    setScreen('canon')
  }

  function handleUniverseSkipSetup(id) {
    const universe = UNIVERSES[id]
    const newSettings = {
      universeId: id,
      canonSources: universe.sources.map(s => s.id),
      spoilerTier: 'everything',
    }
    saveUniverseSettings(id, newSettings)
    setSettings(newSettings)
    setScreen('ask')
  }

  function handleReturnShortcut() {
    setSettings(returnShortcut)
    setScreen('ask')
  }

  // ── Canon Setup ────────────────────────────────────────────────

  function handleCanonBack() {
    if (navMode === 'change-canon') {
      setScreen('ask')
    } else {
      setScreen('universe')
    }
  }

  function handleCanonContinue(sources) {
    if (navMode === 'change-canon') {
      const updated = { ...settings, canonSources: sources }
      saveUniverseSettings(settings.universeId, updated)
      setSettings(updated)
      setScreen('ask')
    } else {
      setPendingSources(sources)
      setScreen('spoiler')
    }
  }

  // ── Spoiler Tier ───────────────────────────────────────────────

  function handleSpoilerBack() {
    if (navMode === 'change-tier') {
      setScreen('ask')
    } else {
      setScreen('canon')
    }
  }

  function handleSpoilerContinue(tier) {
    if (navMode === 'change-tier') {
      const updated = { ...settings, spoilerTier: tier }
      saveUniverseSettings(settings.universeId, updated)
      setSettings(updated)
      setScreen('ask')
    } else {
      const newSettings = {
        universeId,
        canonSources: pendingSources,
        spoilerTier: tier,
      }
      saveUniverseSettings(universeId, newSettings)
      setSettings(newSettings)
      setScreen('ask')
    }
  }

  // ── Ask Screen ─────────────────────────────────────────────────

  function handleChangeTier() {
    setNavMode('change-tier')
    setScreen('spoiler')
  }

  function handleChangeCanon() {
    setNavMode('change-canon')
    setScreen('canon')
  }

  function handleSwitchUniverse() {
    setScreen('universe')
  }

  function handleResetAll() {
    clearAll()
    setSettings(null)
    setReturnShortcut(null)
    setScreen('universe')
  }

  // ── Render ─────────────────────────────────────────────────────

  if (screen === 'loading') return null

  const activeUniverse = settings ? UNIVERSES[settings.universeId] : null

  return (
    <div className="min-h-full bg-[#0e0d0b] flex justify-center">
      <div className="w-full max-w-[430px] min-h-full relative bg-[#0e0d0b]">

        {screen === 'universe' && (
          <UniverseSelect
            key="universe"
            returnShortcut={returnShortcut}
            onReturnShortcut={handleReturnShortcut}
            onSetPreferences={handleUniverseSetPreferences}
            onSkipSetup={handleUniverseSkipSetup}
          />
        )}

        {screen === 'canon' && (
          <CanonSetup
            key={`canon-${navMode}`}
            universe={UNIVERSES[navMode === 'change-canon' ? settings.universeId : universeId]}
            initialSources={navMode === 'change-canon' ? settings.canonSources : null}
            onBack={handleCanonBack}
            onContinue={handleCanonContinue}
          />
        )}

        {screen === 'spoiler' && (
          <SpoilerTier
            key={`spoiler-${navMode}`}
            universe={UNIVERSES[navMode === 'change-tier' ? settings.universeId : universeId]}
            initialTier={navMode === 'change-tier' ? settings.spoilerTier : null}
            onBack={handleSpoilerBack}
            onContinue={handleSpoilerContinue}
          />
        )}

        {screen === 'ask' && settings && activeUniverse && (
          <AskScreen
            key={'ask-' + settings.universeId}
            settings={settings}
            universe={activeUniverse}
            onChangeTier={handleChangeTier}
            onChangeCanon={handleChangeCanon}
            onSwitchUniverse={handleSwitchUniverse}
            onResetAll={handleResetAll}
          />
        )}

      </div>
    </div>
  )
}
