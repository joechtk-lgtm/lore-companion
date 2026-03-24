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
      { id: 'game_w3', label: 'WITCHER 3 GAME', desc: 'Wild Hunt + both DLCs. The core experience.' },
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
      { id: 'game_eldenring', label: 'ELDEN RING', desc: 'Base game. Item descriptions, NPC dialogue, environmental lore.' },
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
  dune: {
    id: 'dune',
    title: 'DUNE',
    subtitle: "Arrakis. The spice. The prophecy. The cost of becoming a god.",
    tags: ['Books', 'Films', 'The Imperium'],
    accentColor: '#c4a35a',
    enterLabel: 'ENTER THE IMPERIUM',
    wakeMessage: 'The desert stirs. First calls take a moment to answer\u00a0\u2014 the server is waking from its rest.',
    sources: [
      { id: 'book_dune', label: 'DUNE (FRANK HERBERT)', desc: 'The original 1965 novel. Primary canon. Where everything begins.' },
      { id: 'book_messiah', label: 'DUNE MESSIAH', desc: "Second novel. Paul's reckoning. The cost of the holy war." },
      { id: 'book_children', label: 'CHILDREN OF DUNE', desc: 'Third novel. Leto II and the Golden Path.' },
      { id: 'film_2021', label: 'DUNE: PART ONE (2021)', desc: 'Villeneuve adaptation. Faithful to book 1 part 1.' },
      { id: 'film_2024', label: 'DUNE: PART TWO (2024)', desc: 'Villeneuve adaptation. Book 1 part 2, some changes.' },
    ],
    tiers: [
      { id: 'arrakis_arrival', label: 'ARRIVAL ON ARRAKIS', desc: 'Paul arrives. The spice. The desert.' },
      { id: 'fremen', label: 'AMONG THE FREMEN', desc: 'Paul joins the Fremen. Stilgar. Chani.' },
      { id: 'muadib', label: "MUAD'DIB RISES", desc: "Paul becomes Muad'Dib. The holy war begins." },
      { id: 'dune_complete', label: 'DUNE COMPLETE', desc: 'First book or both films complete.' },
      { id: 'messiah', label: 'DUNE MESSIAH', desc: "The cost of the holy war. Paul's fate." },
      { id: 'everything', label: 'EVERYTHING', desc: 'Children of Dune and beyond. No limits.' },
    ],
    defaultSources: ['film_2021', 'film_2024'],
    defaultTier: 'dune_complete',
  },
}

export function getTierLabel(universe, tierId) {
  const tier = universe.tiers.find(t => t.id === tierId)
  return tier ? tier.label : tierId.toUpperCase()
}
