export const UNIVERSES = {
  witcher3: {
    id: 'witcher3',
    title: 'THE WITCHER 3',
    subtitle: 'The Continent. The Wild Hunt. The Shattering of Lives.',
    tags: ['Characters', 'Factions', 'Lore'],
    accentColor: '#c9a84c',
    enterLabel: 'ENTER THE CONTINENT',
    wakeMessage: 'The Continent stirs. First calls take a moment to answer\u00a0\u2014 the server is waking from its rest.',
    sources: [
      { id: 'game_w3', label: 'WITCHER 3 GAME', desc: 'Wild Hunt + both DLCs. The core experience.', required: true },
      { id: 'game_w1w2', label: 'WITCHER 1 + 2 GAMES', desc: 'Adds backstory. Safe to include alongside W3.' },
      { id: 'books_sapkowski', label: 'SAPKOWSKI BOOKS', desc: 'Original canon. Where everything begins.' },
      { id: 'netflix', label: 'NETFLIX SERIES', desc: 'Adaptation only. Will be clearly labeled when referenced.' },
    ],
    tiers: [
      { id: 'white_orchard', label: 'WHITE ORCHARD', desc: 'Just started. Before Velen.' },
      { id: 'velen_novigrad', label: 'VELEN + NOVIGRAD', desc: "Searching for Ciri's trail." },
      { id: 'skellige', label: 'SKELLIGE + KAER MORHEN', desc: 'Ciri found. Wild Hunt closing in.' },
      { id: 'main_complete', label: 'MAIN STORY COMPLETE', desc: 'Before the DLCs.' },
      { id: 'everything', label: 'EVERYTHING', desc: 'Both DLCs complete. No limits.' },
    ],
    defaultSources: ['game_w3'],
    defaultTier: 'velen_novigrad',
  },
  eldenring: {
    id: 'eldenring',
    title: 'ELDEN RING',
    subtitle: 'The Lands Between. The Shattering. The Erdtree.',
    tags: ['Characters', 'Lore', 'The Shattering'],
    accentColor: '#c4a882',
    enterLabel: 'ENTER THE LANDS BETWEEN',
    wakeMessage: 'The Lands Between stirs. First calls take a moment to answer\u00a0\u2014 the server is waking from its rest.',
    sources: [
      { id: 'game_eldenring', label: 'ELDEN RING', desc: 'Base game. Item descriptions, NPC dialogue, environmental lore.', required: true },
      { id: 'dlc_shadowoftherdtree', label: 'SHADOW OF THE ERDTREE', desc: "DLC. The Land of Shadow and Miquella's fate." },
    ],
    tiers: [
      { id: 'limgrave', label: 'LIMGRAVE', desc: 'Just started. First steps in the Lands Between.' },
      { id: 'liurnia', label: 'LIURNIA + CAELID', desc: 'Past Stormveil. The academy and the rot.' },
      { id: 'altus', label: 'ALTUS PLATEAU + LEYNDELL', desc: 'Approaching the capital. Two shardbearers defeated.' },
      { id: 'mountaintops', label: 'MOUNTAINTOPS + FARUM AZULA', desc: 'The forge. The fall of the Erdtree.' },
      { id: 'main_complete', label: 'MAIN GAME COMPLETE', desc: 'Any ending achieved. Before Shadow of the Erdtree.' },
      { id: 'everything', label: 'EVERYTHING', desc: 'Shadow of the Erdtree complete. No limits.' },
    ],
    defaultSources: ['game_eldenring'],
    defaultTier: 'limgrave',
  },
}

export function getTierLabel(universe, tierId) {
  const tier = universe.tiers.find(t => t.id === tierId)
  return tier ? tier.label : tierId.toUpperCase()
}
