// ============================================================
//  GREENDEX — Complete Card Database
//  Based on the official Greendex Rulebook (64 cards)
// ============================================================

export const TYPE = { INDICA: 'indica', SATIVA: 'sativa', HYBRID: 'hybrid' };
export const CARD_KIND = { STRAIN: 'strain', TRAINER: 'trainer', GEAR: 'gear', EVENT: 'event' };

// Type advantage wheel: Indica > Sativa > Hybrid > Indica
export const TYPE_ADVANTAGE = {
  [TYPE.INDICA]: TYPE.SATIVA,   // Indica beats Sativa
  [TYPE.SATIVA]: TYPE.HYBRID,   // Sativa beats Hybrid
  [TYPE.HYBRID]: TYPE.INDICA,   // Hybrid beats Indica
};

// ── Passive effect keys ─────────────────────────────────────
export const PASSIVE = {
  HEAL_10_END: 'heal10End',             // OG Kush S1
  HEAL_20_END: 'heal20End',             // OG Kush S2
  DRAIN_OPPONENT_ENERGY: 'drainOpponentEnergy',  // Sour Diesel S1 — on attack
  EXTRA_ENERGY_GAIN: 'extraEnergyGain', // Sour Diesel S2
  REDUCE_DMG_10: 'reduceDmg10',         // GDP S1 / N.Lights S1 & S2
  REDUCE_DMG_20: 'reduceDmg20',         // GDP S2 / Blue Dream S2
  BLOCK_EVENTS: 'blockEvents',          // GDP S2
  DRAW_1_ON_ENTRY: 'draw1OnEntry',      // Blue Dream S1
  DRAW_1_END: 'draw1End',              // Gelato S2
  HEAL_15_ON_ENTRY: 'heal15OnEntry',    // Gelato S1
  HEAL_20_END_DRAW: 'heal20EndDraw',    // Gelato S2 (heal20 + draw1)
  FREE_RETREAT_ONCE: 'freeRetreatOnce',  // Pineapple Express S1
  FREE_RETREAT: 'freeRetreat',          // Pineapple Express S2
  AOE_10_BENCH: 'aoe10Bench',           // OG Kush S2 — on attack (Green Domination)
  BENCH_AOE_10_PASSIVE: 'benchAoe10Passive', // Northern Lights S2 — reduce incoming + deal 10 to bench
  OPPONENT_DISCARD_ON_ENTRY: 'opponentDiscardOnEntry', // Wedding Cake S1 + S2
  BLOCK_DRAW: 'blockDraw',             // Sour Diesel S2 — on attack (Diesel Meltdown)
};

// ── Attack effect keys ──────────────────────────────────────
export const ATK_EFFECT = {
  RECOIL_10: 'recoil10',
  AOE_30_BENCH: 'aoe30Bench',         // Green Domination
  DRAIN_ENERGY: 'drainEnergy',        // on Sour Diesel S1 attack
  BLOCK_DRAW_1: 'blockDraw1',         // Diesel Meltdown / Dreamcatcher / Sky High
  IGNORE_DEFENSE: 'ignoreDefense',    // Nitro Boom / Express Impact
  REDUCE_OPPONENT_DMG_20: 'reduceOpponentDmg20', // Purple Armageddon
  BLOCK_OPPONENT_ATTACK: 'blockOpponentAttack', // Polar Night
  BLOCK_ABILITIES: 'blockAbilities',  // Frost Bite
  OPPONENT_DISCARD: 'opponentDiscard', // Sugar Crush
  HEAL_SELF_20_DRAW: 'healSelf20Draw', // Postre Perfecto (passive, not attack)
};

// ── Helper: create attack ───────────────────────────────────
function atk(name, energy, damage, description, effects = []) {
  return { name, energy, damage, description, effects };
}

// ── Helper: create field-ready card clone ───────────────────
let _uidCounter = 0;
export function createFieldCard(cardDef) {
  return {
    ...cardDef,
    instanceId: `${cardDef.id}_${Date.now()}_${_uidCounter++}`,
    currentHp: cardDef.hp,
    turnsInPlay: 0,
    gear: null,
    entryProtection: true,   // max 50 damage on first turn
    freeRetreatUsed: false,
    // Status effects
    cannotRetreat: false,
    opponentCannotDraw: false,
    opponentCannotPlayEvents: false,
    opponentDmgReduced: 0,
    isAnimatingHit: false,
  };
}

// ── Helper: shuffle array ───────────────────────────────────
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ────────────────────────────────────────────────────────────
//  STRAIN CARDS
// ────────────────────────────────────────────────────────────

export const STRAINS = {
  // ── OG KUSH ─────────────────────────────────────────────
  OG_KUSH_S1: {
    id: 'OG_KUSH_S1',
    name: 'OG Kush',
    subtitle: 'Stage 1 · Evolution',
    stage: 1,
    evolvesTo: 'OG_KUSH_S2',
    evolvesFrom: null,
    kind: CARD_KIND.STRAIN,
    type: TYPE.INDICA,
    hp: 180,
    number: '41/64',
    passive: PASSIVE.HEAL_10_END,
    passiveText: 'Regeneration: Restore 10 Potency at the end of each turn.',
    attacks: [
      atk('Heavy Hit', 1, 40, 'Deals damage and applies pressure with dense resin.'),
      atk('Resin Burst', 2, 90, 'A resin explosion that overwhelms the opponent.', [ATK_EFFECT.RECOIL_10]),
    ],
  },
  OG_KUSH_S2: {
    id: 'OG_KUSH_S2',
    name: 'OG Kush',
    subtitle: 'Stage 2 · Evolution',
    stage: 2,
    evolvesTo: null,
    evolvesFrom: 'OG_KUSH_S1',
    kind: CARD_KIND.STRAIN,
    type: TYPE.INDICA,
    hp: 210,
    number: '49/64',
    passive: PASSIVE.HEAL_20_END,
    passiveText: 'Resin Oil: Restore 20 Potency at the end of your turn.',
    attacks: [
      atk('Ultimate Kush', 1, 60, 'A max strike that crushes the opponent.'),
      atk('Green Domination', 2, 110, 'Deals 30 damage to all Strains on the opponent\'s Bench.',
          [ATK_EFFECT.RECOIL_10, ATK_EFFECT.AOE_30_BENCH]),
    ],
  },

  // ── SOUR DIESEL ─────────────────────────────────────────
  SOUR_DIESEL_S1: {
    id: 'SOUR_DIESEL_S1',
    name: 'Sour Diesel',
    subtitle: 'Stage 1 · Evolution',
    stage: 1,
    evolvesTo: 'SOUR_DIESEL_S2',
    evolvesFrom: null,
    kind: CARD_KIND.STRAIN,
    type: TYPE.SATIVA,
    hp: 170,
    number: '42/64',
    passive: PASSIVE.DRAIN_OPPONENT_ENERGY,
    passiveText: 'Fuel Drain: When this Strain attacks, the opponent loses 1 Trichome on their next turn.',
    attacks: [
      atk('Diesel Blast', 1, 50, 'A fast hit that burns with intensity.', [ATK_EFFECT.DRAIN_ENERGY]),
      atk('Turbo Charge', 2, 80, 'Accelerates the pace and strikes with brutal force.', [ATK_EFFECT.RECOIL_10, ATK_EFFECT.DRAIN_ENERGY]),
    ],
  },
  SOUR_DIESEL_S2: {
    id: 'SOUR_DIESEL_S2',
    name: 'Sour Diesel',
    subtitle: 'Stage 2 · Evolution',
    stage: 2,
    evolvesTo: null,
    evolvesFrom: 'SOUR_DIESEL_S1',
    kind: CARD_KIND.STRAIN,
    type: TYPE.SATIVA,
    hp: 200,
    number: '50/64',
    passive: PASSIVE.EXTRA_ENERGY_GAIN,
    passiveText: 'Extreme Acceleration: Gain 1 additional Trichome at the start of each turn.',
    attacks: [
      atk('Diesel Meltdown', 1, 60, 'The opponent cannot draw cards on their next turn.', [ATK_EFFECT.BLOCK_DRAW_1]),
      atk('Nitro Boom', 2, 110, 'A devastating explosion that ignores all of the opponent\'s defense effects.', [ATK_EFFECT.RECOIL_10, ATK_EFFECT.IGNORE_DEFENSE]),
    ],
  },

  // ── GRANDDADDY PURPLE ───────────────────────────────────
  GDP_S1: {
    id: 'GDP_S1',
    name: 'Granddaddy Purple',
    subtitle: 'Stage 1 · Evolution',
    stage: 1,
    evolvesTo: 'GDP_S2',
    evolvesFrom: null,
    kind: CARD_KIND.STRAIN,
    type: TYPE.INDICA,
    hp: 190,
    number: '43/64',
    passive: PASSIVE.REDUCE_DMG_10,
    passiveText: 'Purple Mantle: The opponent\'s attacks deal 10 less damage.',
    attacks: [
      atk('Purple Haze', 1, 40, 'Confuses and reduces the opponent\'s focus.'),
      atk('Royal Flush', 2, 90, 'A heavy hit aimed at the purple resistance.', [ATK_EFFECT.RECOIL_10]),
    ],
  },
  GDP_S2: {
    id: 'GDP_S2',
    name: 'Granddaddy Purple',
    subtitle: 'Stage 2 · Evolution',
    stage: 2,
    evolvesTo: null,
    evolvesFrom: 'GDP_S1',
    kind: CARD_KIND.STRAIN,
    type: TYPE.INDICA,
    hp: 220,
    number: '51/64',
    passive: PASSIVE.REDUCE_DMG_10,
    passiveText: 'Purple Reign: Reduce incoming damage by 10. The opponent cannot play Events.',
    passiveExtra: PASSIVE.BLOCK_EVENTS,
    attacks: [
      atk('Purple Armageddon', 1, 60, 'Confuses and reduces the opponent\'s damage by 20 this turn.', [ATK_EFFECT.REDUCE_OPPONENT_DMG_20]),
      atk('Galactic Punch', 2, 120, 'A cosmic punch that breaks through any defense.', [ATK_EFFECT.RECOIL_10, ATK_EFFECT.IGNORE_DEFENSE]),
    ],
  },

  // ── BLUE DREAM ──────────────────────────────────────────
  BLUE_DREAM_S1: {
    id: 'BLUE_DREAM_S1',
    name: 'Blue Dream',
    subtitle: 'Stage 1 · Evolution',
    stage: 1,
    evolvesTo: 'BLUE_DREAM_S2',
    evolvesFrom: null,
    kind: CARD_KIND.STRAIN,
    type: TYPE.SATIVA,
    hp: 170,
    number: '44/64',
    passive: PASSIVE.DRAW_1_ON_ENTRY,
    passiveText: 'Lucid Dream: Draw 1 card when this card enters play.',
    attacks: [
      atk('Balanced Flow', 1, 40, 'A balanced hit that restores your energy.'),
      atk('Dream Surge', 2, 80, 'A wave of energy that hits with force.', [ATK_EFFECT.RECOIL_10]),
    ],
  },
  BLUE_DREAM_S2: {
    id: 'BLUE_DREAM_S2',
    name: 'Blue Dream',
    subtitle: 'Stage 2 · Evolution',
    stage: 2,
    evolvesTo: null,
    evolvesFrom: 'BLUE_DREAM_S1',
    kind: CARD_KIND.STRAIN,
    type: TYPE.SATIVA,
    hp: 200,
    number: '52/64',
    passive: PASSIVE.REDUCE_DMG_20,
    passiveText: 'Eternal Cloud: Reduce damage received from attacks by 20.',
    attacks: [
      atk('Dreamcatcher', 1, 60, 'Traps the opponent in a dream — they cannot draw cards next turn.', [ATK_EFFECT.BLOCK_DRAW_1]),
      atk('Sky High', 2, 110, 'A high-flying attack that hits and prevents the opponent from drawing next turn.', [ATK_EFFECT.RECOIL_10, ATK_EFFECT.BLOCK_DRAW_1]),
    ],
  },

  // ── GELATO ──────────────────────────────────────────────
  GELATO_S1: {
    id: 'GELATO_S1',
    name: 'Gelato',
    subtitle: 'Stage 1 · Evolution',
    stage: 1,
    evolvesTo: 'GELATO_S2',
    evolvesFrom: null,
    kind: CARD_KIND.STRAIN,
    type: TYPE.HYBRID,
    hp: 175,
    number: '45/64',
    passive: PASSIVE.HEAL_15_ON_ENTRY,
    passiveText: 'Sweet Recovery: Restore 15 Potency when this card enters play.',
    attacks: [
      atk('Gelato Swirl', 1, 50, 'A smooth hit with a crisp and powerful finish.'),
      atk('Ice Cream Blast', 2, 85, 'Freezes the opponent with icy precision.', [ATK_EFFECT.RECOIL_10]),
    ],
  },
  GELATO_S2: {
    id: 'GELATO_S2',
    name: 'Gelato',
    subtitle: 'Stage 2 · Evolution',
    stage: 2,
    evolvesTo: null,
    evolvesFrom: 'GELATO_S1',
    kind: CARD_KIND.STRAIN,
    type: TYPE.HYBRID,
    hp: 210,
    number: '53/64',
    passive: PASSIVE.HEAL_20_END_DRAW,
    passiveText: 'Perfect Dessert: Restore 20 Potency at the end of your turn and draw 1 card.',
    attacks: [
      atk('Gelato Supreme', 1, 60, 'A creamy, frozen hit that melts the opponent.'),
      atk('Frost Bite', 2, 110, 'Freezes the opponent — they cannot use card abilities next turn.', [ATK_EFFECT.RECOIL_10, ATK_EFFECT.BLOCK_ABILITIES]),
    ],
  },

  // ── PINEAPPLE EXPRESS ───────────────────────────────────
  PINEAPPLE_S1: {
    id: 'PINEAPPLE_S1',
    name: 'Pineapple Express',
    subtitle: 'Stage 1 · Evolution',
    stage: 1,
    evolvesTo: 'PINEAPPLE_S2',
    evolvesFrom: null,
    kind: CARD_KIND.STRAIN,
    type: TYPE.HYBRID,
    hp: 160,
    number: '46/64',
    passive: PASSIVE.FREE_RETREAT_ONCE,
    passiveText: 'Quick Retreat: You may retreat this Strain without paying a Trichome once per game.',
    attacks: [
      atk('Tropical Rush', 1, 50, 'A fruity burst that doesn\'t wear you out.'),
      atk('Pineapple Blast', 2, 80, 'A tropical explosion that leaves its mark.', [ATK_EFFECT.RECOIL_10]),
    ],
  },
  PINEAPPLE_S2: {
    id: 'PINEAPPLE_S2',
    name: 'Pineapple Express',
    subtitle: 'Stage 2 · Evolution',
    stage: 2,
    evolvesTo: null,
    evolvesFrom: 'PINEAPPLE_S1',
    kind: CARD_KIND.STRAIN,
    type: TYPE.HYBRID,
    hp: 200,
    number: '54/64',
    passive: PASSIVE.FREE_RETREAT,
    passiveText: 'Nonstop Trip: This Strain may retreat without paying a Trichome at any time.',
    attacks: [
      atk('Tropical Hurricane', 1, 60, 'A tropical burst that damages and pushes the opponent back.'),
      atk('Express Impact', 2, 110, 'A fast, unstoppable attack that ignores defense effects.', [ATK_EFFECT.RECOIL_10, ATK_EFFECT.IGNORE_DEFENSE]),
    ],
  },

  // ── NORTHERN LIGHTS ─────────────────────────────────────
  N_LIGHTS_S1: {
    id: 'N_LIGHTS_S1',
    name: 'Northern Lights',
    subtitle: 'Stage 1 · Evolution',
    stage: 1,
    evolvesTo: 'N_LIGHTS_S2',
    evolvesFrom: null,
    kind: CARD_KIND.STRAIN,
    type: TYPE.INDICA,
    hp: 180,
    number: '47/64',
    passive: PASSIVE.REDUCE_DMG_10,
    passiveText: 'Northern Light: The opponent\'s attacks deal 10 less damage.',
    attacks: [
      atk('Aurora Beam', 1, 40, 'A frozen beam that pierces the darkness.'),
      atk('Night Collapse', 2, 90, 'Nightfall that weakens the opponent.', [ATK_EFFECT.RECOIL_10]),
    ],
  },
  N_LIGHTS_S2: {
    id: 'N_LIGHTS_S2',
    name: 'Northern Lights',
    subtitle: 'Stage 2 · Evolution',
    stage: 2,
    evolvesTo: null,
    evolvesFrom: 'N_LIGHTS_S1',
    kind: CARD_KIND.STRAIN,
    type: TYPE.INDICA,
    hp: 210,
    number: '55/64',
    passive: PASSIVE.BENCH_AOE_10_PASSIVE,
    passiveText: 'Arctic Light: Reduce incoming damage by 10 and deal 10 damage to the opponent\'s Bench at the start of your turn.',
    attacks: [
      atk('Aurora Borealis', 1, 60, 'Mystic light that reduces damage and paralyzes the opponent.'),
      atk('Polar Night', 2, 110, 'Total darkness — the opponent cannot attack next turn.', [ATK_EFFECT.RECOIL_10, ATK_EFFECT.BLOCK_OPPONENT_ATTACK]),
    ],
  },

  // ── WEDDING CAKE ────────────────────────────────────────
  WEDDING_S1: {
    id: 'WEDDING_S1',
    name: 'Wedding Cake',
    subtitle: 'Stage 1 · Evolution',
    stage: 1,
    evolvesTo: 'WEDDING_S2',
    evolvesFrom: null,
    kind: CARD_KIND.STRAIN,
    type: TYPE.SATIVA,
    hp: 185,
    number: '48/64',
    passive: PASSIVE.OPPONENT_DISCARD_ON_ENTRY,
    passiveText: 'Perfect Cut: The opponent discards 1 card from their hand when this Strain enters play.',
    attacks: [
      atk('Sweet Slice', 1, 40, 'A sweet hit that applies mounting pressure.'),
      atk('Crunch', 2, 85, 'A crushing hit that deals layered damage.', [ATK_EFFECT.RECOIL_10]),
    ],
  },
  WEDDING_S2: {
    id: 'WEDDING_S2',
    name: 'Wedding Cake',
    subtitle: 'Stage 2 · Evolution',
    stage: 2,
    evolvesTo: null,
    evolvesFrom: 'WEDDING_S1',
    kind: CARD_KIND.STRAIN,
    type: TYPE.SATIVA,
    hp: 210,
    number: '56/64',
    passive: PASSIVE.OPPONENT_DISCARD_ON_ENTRY,
    passiveText: 'Perfect Reception: When this Strain enters the Bench, the opponent discards 1 card.',
    attacks: [
      atk('Cake Catastrophe', 1, 60, 'A sweet attack that deals damage and crushes the opponent.'),
      atk('Sugar Crush', 2, 110, 'A sugary hit that forces the opponent to discard 1 card.', [ATK_EFFECT.RECOIL_10, ATK_EFFECT.OPPONENT_DISCARD]),
    ],
  },
};

// ────────────────────────────────────────────────────────────
//  SUPPORT CARDS  (Trainer / Gear / Event)
// ────────────────────────────────────────────────────────────

export const SUPPORT_CARDS = {
  // ── TRAINERS ────────────────────────────────────────────
  ENERGY_DRAIN: {
    id: 'ENERGY_DRAIN',
    name: 'Energy Drain',
    subtitle: 'Trainer',
    kind: CARD_KIND.TRAINER,
    number: '57/64',
    effect: 'DRAIN_OPPONENT_ENERGY',
    description: 'The opponent loses 1 Trichome. If they have 2, they lose both.',
  },
  CONTROLLED_GROWTH: {
    id: 'CONTROLLED_GROWTH',
    name: 'Controlled Growth',
    subtitle: 'Trainer',
    kind: CARD_KIND.TRAINER,
    number: '58/64',
    effect: 'ENTRY_PROTECT_ALL',
    description: 'Until the end of this turn, your Strains can receive a maximum of 50 damage.',
  },
  RECALL: {
    id: 'RECALL',
    name: 'Recall',
    subtitle: 'Trainer',
    kind: CARD_KIND.TRAINER,
    number: '59/64',
    effect: 'RECALL_ACTIVE',
    description: 'Return your Active Strain to your Bench (does not count as a KO). You cannot attack this turn.',
  },
  HAND_RESET: {
    id: 'HAND_RESET',
    name: 'Hand Reset',
    subtitle: 'Trainer',
    kind: CARD_KIND.TRAINER,
    number: '60/64',
    effect: 'HAND_RESET',
    description: 'Both players discard their hand and draw 3 new cards.',
  },

  // ── GEAR ────────────────────────────────────────────────
  ROOT_SHIELD: {
    id: 'ROOT_SHIELD',
    name: 'Root Shield',
    subtitle: 'Gear',
    kind: CARD_KIND.GEAR,
    number: '61/64',
    effect: 'REDUCE_DMG_10',
    description: 'The equipped Strain receives 10 less damage from the opponent\'s attacks.',
  },
  ENERGY_CAPACITOR: {
    id: 'ENERGY_CAPACITOR',
    name: 'Energy Capacitor',
    subtitle: 'Gear',
    kind: CARD_KIND.GEAR,
    number: '62/64',
    effect: 'MAX_ENERGY_3',
    description: 'You may store up to 3 Trichomes instead of 2.',
  },
  STICKY_RESIN: {
    id: 'STICKY_RESIN',
    name: 'Sticky Resin',
    subtitle: 'Gear',
    kind: CARD_KIND.GEAR,
    number: '63/64',
    effect: 'PREVENT_RETREAT',
    targetOpponent: true,
    description: 'Equip to the opponent\'s Active Strain. It cannot retreat from the Active position (except by being KO\'d).',
  },

  // ── EVENTS ──────────────────────────────────────────────
  SYSTEM_OVERLOAD: {
    id: 'SYSTEM_OVERLOAD',
    name: 'System Overload',
    subtitle: 'Event',
    kind: CARD_KIND.EVENT,
    number: '64/64',
    effect: 'SYSTEM_OVERLOAD',
    description: 'Neither player may use abilities or card effects next turn. Only attacks may be used.',
  },
};

// ────────────────────────────────────────────────────────────
//  PRE-BUILT DECKS  (20 cards each)
// ────────────────────────────────────────────────────────────

function copies(cardDef, n) {
  return Array(n).fill(null).map(() => ({ ...cardDef }));
}

export const PLAYER_DECK_DEF = [
  ...copies(STRAINS.OG_KUSH_S1, 2),
  ...copies(STRAINS.OG_KUSH_S2, 1),
  ...copies(STRAINS.BLUE_DREAM_S1, 2),
  ...copies(STRAINS.BLUE_DREAM_S2, 1),
  ...copies(STRAINS.GDP_S1, 2),
  ...copies(STRAINS.GDP_S2, 1),
  ...copies(STRAINS.GELATO_S1, 2),
  ...copies(STRAINS.GELATO_S2, 1),
  ...copies(STRAINS.N_LIGHTS_S1, 1),
  ...copies(SUPPORT_CARDS.ENERGY_DRAIN, 2),
  ...copies(SUPPORT_CARDS.ROOT_SHIELD, 2),
  ...copies(SUPPORT_CARDS.HAND_RESET, 2),
  ...copies(SUPPORT_CARDS.CONTROLLED_GROWTH, 1),
];  // 20 cards

export const OPPONENT_DECK_DEF = [
  ...copies(STRAINS.SOUR_DIESEL_S1, 2),
  ...copies(STRAINS.SOUR_DIESEL_S2, 1),
  ...copies(STRAINS.WEDDING_S1, 2),
  ...copies(STRAINS.WEDDING_S2, 1),
  ...copies(STRAINS.PINEAPPLE_S1, 2),
  ...copies(STRAINS.PINEAPPLE_S2, 1),
  ...copies(STRAINS.N_LIGHTS_S1, 2),
  ...copies(STRAINS.N_LIGHTS_S2, 1),
  ...copies(STRAINS.GDP_S1, 1),
  ...copies(SUPPORT_CARDS.ENERGY_DRAIN, 2),
  ...copies(SUPPORT_CARDS.ROOT_SHIELD, 2),
  ...copies(SUPPORT_CARDS.STICKY_RESIN, 1),
  ...copies(SUPPORT_CARDS.SYSTEM_OVERLOAD, 1),
];  // 20 cards

// ────────────────────────────────────────────────────────────
//  UTILITY
// ────────────────────────────────────────────────────────────

export function hasTypeAdvantage(attackerType, defenderType) {
  return TYPE_ADVANTAGE[attackerType] === defenderType;
}

export function getTypeColor(type) {
  switch (type) {
    case TYPE.INDICA: return '#b66bff'; // brighter purple for contrast on dark board
    case TYPE.SATIVA: return '#fbbf24'; // brighter amber
    case TYPE.HYBRID: return '#4ade80'; // brighter green
    default: return '#9ca3af';
  }
}

export function getTypeLabel(type) {
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : '';
}

export function getTypeBg(type) {
  switch (type) {
    case TYPE.INDICA: return 'type-indica';
    case TYPE.SATIVA: return 'type-sativa';
    case TYPE.HYBRID: return 'type-hybrid';
    default: return 'bg-gray-600';
  }
}

export function getTypeEmoji(type) {
  switch (type) {
    case TYPE.INDICA: return '🍇';
    case TYPE.SATIVA: return '☀️';
    case TYPE.HYBRID: return '🌿';
    default: return '🌱';
  }
}
