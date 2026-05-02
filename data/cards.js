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
    subtitle: 'Stage 1 · Evolución',
    stage: 1,
    evolvesTo: 'OG_KUSH_S2',
    evolvesFrom: null,
    kind: CARD_KIND.STRAIN,
    type: TYPE.INDICA,
    hp: 180,
    number: '41/64',
    passive: PASSIVE.HEAL_10_END,
    passiveText: 'Regeneración: Cura 10 de Potencia al final de cada turno.',
    attacks: [
      atk('Heavy Hit', 1, 40, 'Inflige daño y añade presión con resina densa.'),
      atk('Resin Burst', 2, 90, 'Explosión de resina que abruma al oponente.', [ATK_EFFECT.RECOIL_10]),
    ],
  },
  OG_KUSH_S2: {
    id: 'OG_KUSH_S2',
    name: 'OG Kush',
    subtitle: 'Stage 2 · Evolución',
    stage: 2,
    evolvesTo: null,
    evolvesFrom: 'OG_KUSH_S1',
    kind: CARD_KIND.STRAIN,
    type: TYPE.INDICA,
    hp: 210,
    number: '49/64',
    passive: PASSIVE.HEAL_20_END,
    passiveText: 'Aceite de la Resina: Cura 20 de Potencia al final de tu turno.',
    attacks: [
      atk('Ultimate Kush', 1, 60, 'Golpe máximo que aplasta al oponente.'),
      atk('Green Domination', 2, 110, 'Inflige 30 daño a todos los Strains en Banca del oponente.',
          [ATK_EFFECT.RECOIL_10, ATK_EFFECT.AOE_30_BENCH]),
    ],
  },

  // ── SOUR DIESEL ─────────────────────────────────────────
  SOUR_DIESEL_S1: {
    id: 'SOUR_DIESEL_S1',
    name: 'Sour Diesel',
    subtitle: 'Stage 1 · Evolución',
    stage: 1,
    evolvesTo: 'SOUR_DIESEL_S2',
    evolvesFrom: null,
    kind: CARD_KIND.STRAIN,
    type: TYPE.SATIVA,
    hp: 170,
    number: '42/64',
    passive: PASSIVE.DRAIN_OPPONENT_ENERGY,
    passiveText: 'Energía: El oponente pierde 1 Energía en su próximo turno cuando este Strain ataca.',
    attacks: [
      atk('Diesel Blast', 1, 50, 'Golpe rápido que quema con intensidad.', [ATK_EFFECT.DRAIN_ENERGY]),
      atk('Turbo Charge', 2, 80, 'Acelera el ritmo y golpea con fuerza brutal.', [ATK_EFFECT.RECOIL_10, ATK_EFFECT.DRAIN_ENERGY]),
    ],
  },
  SOUR_DIESEL_S2: {
    id: 'SOUR_DIESEL_S2',
    name: 'Sour Diesel',
    subtitle: 'Stage 2 · Evolución',
    stage: 2,
    evolvesTo: null,
    evolvesFrom: 'SOUR_DIESEL_S1',
    kind: CARD_KIND.STRAIN,
    type: TYPE.SATIVA,
    hp: 200,
    number: '50/64',
    passive: PASSIVE.EXTRA_ENERGY_GAIN,
    passiveText: 'Aceleración Extrema: Gana 1 Energía adicional al inicio de cada turno.',
    attacks: [
      atk('Diesel Meltdown', 1, 60, 'El oponente no puede robar cartas en su próximo turno.', [ATK_EFFECT.BLOCK_DRAW_1]),
      atk('Nitro Boom', 2, 110, 'Explosión devastadora que ignora todos los efectos del oponente.', [ATK_EFFECT.RECOIL_10, ATK_EFFECT.IGNORE_DEFENSE]),
    ],
  },

  // ── GRANDDADDY PURPLE ───────────────────────────────────
  GDP_S1: {
    id: 'GDP_S1',
    name: 'Granddaddy Purple',
    subtitle: 'Stage 1 · Evolución',
    stage: 1,
    evolvesTo: 'GDP_S2',
    evolvesFrom: null,
    kind: CARD_KIND.STRAIN,
    type: TYPE.INDICA,
    hp: 190,
    number: '43/64',
    passive: PASSIVE.REDUCE_DMG_10,
    passiveText: 'Manto Morado: Los ataques del oponente hacen 10 menos de daño.',
    attacks: [
      atk('Purple Haze', 1, 40, 'Confunde y reduce el enfoque del oponente.'),
      atk('Royal Flush', 2, 90, 'Golpe pesado dirigido a la resistencia morada.', [ATK_EFFECT.RECOIL_10]),
    ],
  },
  GDP_S2: {
    id: 'GDP_S2',
    name: 'Granddaddy Purple',
    subtitle: 'Stage 2 · Evolución',
    stage: 2,
    evolvesTo: null,
    evolvesFrom: 'GDP_S1',
    kind: CARD_KIND.STRAIN,
    type: TYPE.INDICA,
    hp: 220,
    number: '51/64',
    passive: PASSIVE.REDUCE_DMG_10,
    passiveText: 'Nombre Morado: Reduce en 10 el daño recibido. El oponente no puede jugar Eventos.',
    passiveExtra: PASSIVE.BLOCK_EVENTS,
    attacks: [
      atk('Purple Armageddon', 1, 60, 'Confunde y reduce el daño del oponente en 20 este turno.', [ATK_EFFECT.REDUCE_OPPONENT_DMG_20]),
      atk('Galactic Punch', 2, 120, 'Golpe cósmico que atraviesa cualquier defensa.', [ATK_EFFECT.RECOIL_10, ATK_EFFECT.IGNORE_DEFENSE]),
    ],
  },

  // ── BLUE DREAM ──────────────────────────────────────────
  BLUE_DREAM_S1: {
    id: 'BLUE_DREAM_S1',
    name: 'Blue Dream',
    subtitle: 'Stage 1 · Evolución',
    stage: 1,
    evolvesTo: 'BLUE_DREAM_S2',
    evolvesFrom: null,
    kind: CARD_KIND.STRAIN,
    type: TYPE.SATIVA,
    hp: 170,
    number: '44/64',
    passive: PASSIVE.DRAW_1_ON_ENTRY,
    passiveText: 'Sueño Lúcido: Roba 1 carta cuando esta carta entra en juego.',
    attacks: [
      atk('Balanced Flow', 1, 40, 'Golpe equilibrado que te devuelve energía.'),
      atk('Dream Surge', 2, 80, 'Una ola de energía que impacta con fuerza.', [ATK_EFFECT.RECOIL_10]),
    ],
  },
  BLUE_DREAM_S2: {
    id: 'BLUE_DREAM_S2',
    name: 'Blue Dream',
    subtitle: 'Stage 2 · Evolución',
    stage: 2,
    evolvesTo: null,
    evolvesFrom: 'BLUE_DREAM_S1',
    kind: CARD_KIND.STRAIN,
    type: TYPE.SATIVA,
    hp: 200,
    number: '52/64',
    passive: PASSIVE.REDUCE_DMG_20,
    passiveText: 'Nube Eterna: Reduce en 20 el daño recibido de ataques.',
    attacks: [
      atk('Dreamcatcher', 1, 60, 'Atrapa al oponente en un sueño: no puede robar cartas el próximo turno.', [ATK_EFFECT.BLOCK_DRAW_1]),
      atk('Sky High', 2, 110, 'Ataque elevado que golpea y prohíbe al oponente robar 2 cartas.', [ATK_EFFECT.RECOIL_10, ATK_EFFECT.BLOCK_DRAW_1]),
    ],
  },

  // ── GELATO ──────────────────────────────────────────────
  GELATO_S1: {
    id: 'GELATO_S1',
    name: 'Gelato',
    subtitle: 'Stage 1 · Evolución',
    stage: 1,
    evolvesTo: 'GELATO_S2',
    evolvesFrom: null,
    kind: CARD_KIND.STRAIN,
    type: TYPE.HYBRID,
    hp: 175,
    number: '45/64',
    passive: PASSIVE.HEAL_15_ON_ENTRY,
    passiveText: 'Dulce Recuperación: Cura 15 de Potencia cuando esta carta entra en juego.',
    attacks: [
      atk('Gelato Swirl', 1, 50, 'Golpe suave con final crujiente y poderoso.'),
      atk('Ice Cream Blast', 2, 85, 'Congela al oponente con precisión helada.', [ATK_EFFECT.RECOIL_10]),
    ],
  },
  GELATO_S2: {
    id: 'GELATO_S2',
    name: 'Gelato',
    subtitle: 'Stage 2 · Evolución',
    stage: 2,
    evolvesTo: null,
    evolvesFrom: 'GELATO_S1',
    kind: CARD_KIND.STRAIN,
    type: TYPE.HYBRID,
    hp: 210,
    number: '53/64',
    passive: PASSIVE.HEAL_20_END_DRAW,
    passiveText: 'Postre Perfecto: Cura 20 de Potencia al final de tu turno y roba 1 carta.',
    attacks: [
      atk('Gelato Supreme', 1, 60, 'Un golpe cremoso y helado que derrite al oponente.'),
      atk('Frost Bite', 2, 110, 'Congela al oponente: no puede usar habilidades de cartas el próximo turno.', [ATK_EFFECT.RECOIL_10, ATK_EFFECT.BLOCK_ABILITIES]),
    ],
  },

  // ── PINEAPPLE EXPRESS ───────────────────────────────────
  PINEAPPLE_S1: {
    id: 'PINEAPPLE_S1',
    name: 'Pineapple Express',
    subtitle: 'Stage 1 · Evolución',
    stage: 1,
    evolvesTo: 'PINEAPPLE_S2',
    evolvesFrom: null,
    kind: CARD_KIND.STRAIN,
    type: TYPE.HYBRID,
    hp: 160,
    number: '46/64',
    passive: PASSIVE.FREE_RETREAT_ONCE,
    passiveText: 'Retiro Rápido: Puedes retirar este Strain sin pagar Energía una vez por partida.',
    attacks: [
      atk('Tropical Rush', 1, 50, 'Una ráfaga frutal que no te cansa.'),
      atk('Pineapple Blast', 2, 80, 'Explosión tropical que deja cicatrices.', [ATK_EFFECT.RECOIL_10]),
    ],
  },
  PINEAPPLE_S2: {
    id: 'PINEAPPLE_S2',
    name: 'Pineapple Express',
    subtitle: 'Stage 2 · Evolución',
    stage: 2,
    evolvesTo: null,
    evolvesFrom: 'PINEAPPLE_S1',
    kind: CARD_KIND.STRAIN,
    type: TYPE.HYBRID,
    hp: 200,
    number: '54/64',
    passive: PASSIVE.FREE_RETREAT,
    passiveText: 'Viaje Sin Paradas: Este Strain puede retirarse sin pagar Energía en cualquier momento.',
    attacks: [
      atk('Tropical Hurricane', 1, 60, 'Una ráfaga tropical que daña y empuja al oponente.'),
      atk('Express Impact', 2, 110, 'Ataque rápido e imparable que ignora efectos de defensa.', [ATK_EFFECT.RECOIL_10, ATK_EFFECT.IGNORE_DEFENSE]),
    ],
  },

  // ── NORTHERN LIGHTS ─────────────────────────────────────
  N_LIGHTS_S1: {
    id: 'N_LIGHTS_S1',
    name: 'Northern Lights',
    subtitle: 'Stage 1 · Evolución',
    stage: 1,
    evolvesTo: 'N_LIGHTS_S2',
    evolvesFrom: null,
    kind: CARD_KIND.STRAIN,
    type: TYPE.INDICA,
    hp: 180,
    number: '47/64',
    passive: PASSIVE.REDUCE_DMG_10,
    passiveText: 'Luz del Norte: Los ataques del oponente hacen 10 menos de daño.',
    attacks: [
      atk('Aurora Beam', 1, 40, 'Rayo helado que atraviesa la oscuridad.'),
      atk('Night Collapse', 2, 90, 'Oscuridad nocturna que debilita al oponente.', [ATK_EFFECT.RECOIL_10]),
    ],
  },
  N_LIGHTS_S2: {
    id: 'N_LIGHTS_S2',
    name: 'Northern Lights',
    subtitle: 'Stage 2 · Evolución',
    stage: 2,
    evolvesTo: null,
    evolvesFrom: 'N_LIGHTS_S1',
    kind: CARD_KIND.STRAIN,
    type: TYPE.INDICA,
    hp: 210,
    number: '55/64',
    passive: PASSIVE.BENCH_AOE_10_PASSIVE,
    passiveText: 'Luz del Ártico: Reduce en 10 el daño recibido y hace 10 daño al Banco del oponente al inicio del turno.',
    attacks: [
      atk('Aurora Boreal', 1, 60, 'Luz mística que reduce el daño y paraliza al oponente.'),
      atk('Polar Night', 2, 110, 'Oscuridad total: el oponente no puede atacar el próximo turno.', [ATK_EFFECT.RECOIL_10, ATK_EFFECT.BLOCK_OPPONENT_ATTACK]),
    ],
  },

  // ── WEDDING CAKE ────────────────────────────────────────
  WEDDING_S1: {
    id: 'WEDDING_S1',
    name: 'Wedding Cake',
    subtitle: 'Stage 1 · Evolución',
    stage: 1,
    evolvesTo: 'WEDDING_S2',
    evolvesFrom: null,
    kind: CARD_KIND.STRAIN,
    type: TYPE.SATIVA,
    hp: 185,
    number: '48/64',
    passive: PASSIVE.OPPONENT_DISCARD_ON_ENTRY,
    passiveText: 'Corte Perfecto: El oponente descarta 1 carta de su mano cuando este Strain entra en juego.',
    attacks: [
      atk('Sweet Slice', 1, 40, 'Golpe dulce que aplica presión acumulada.'),
      atk('Crunch', 2, 85, 'Golpe aplastante que aplica daño en capas.', [ATK_EFFECT.RECOIL_10]),
    ],
  },
  WEDDING_S2: {
    id: 'WEDDING_S2',
    name: 'Wedding Cake',
    subtitle: 'Stage 2 · Evolución',
    stage: 2,
    evolvesTo: null,
    evolvesFrom: 'WEDDING_S1',
    kind: CARD_KIND.STRAIN,
    type: TYPE.SATIVA,
    hp: 210,
    number: '56/64',
    passive: PASSIVE.OPPONENT_DISCARD_ON_ENTRY,
    passiveText: 'Recepción Perfecta: Cuando este Strain entra en Banca, el oponente descarta 1 carta.',
    attacks: [
      atk('Cake Catastrophe', 1, 60, 'Ataque dulce que inflige daño y aplasta al oponente.'),
      atk('Sugar Crush', 2, 110, 'Golpe azucarado que fuerza al oponente a descartar 1 carta.', [ATK_EFFECT.RECOIL_10, ATK_EFFECT.OPPONENT_DISCARD]),
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
    subtitle: 'Entrenador',
    kind: CARD_KIND.TRAINER,
    number: '57/64',
    effect: 'DRAIN_OPPONENT_ENERGY',
    description: 'El oponente pierde 1 Energía. Si tiene 2, pierde ambas.',
  },
  CONTROLLED_GROWTH: {
    id: 'CONTROLLED_GROWTH',
    name: 'Controlled Growth',
    subtitle: 'Entrenador',
    kind: CARD_KIND.TRAINER,
    number: '58/64',
    effect: 'ENTRY_PROTECT_ALL',
    description: 'Hasta el final de este turno, tus Strains solo pueden recibir máximo 50 daño.',
  },
  RECALL: {
    id: 'RECALL',
    name: 'Recall',
    subtitle: 'Entrenador',
    kind: CARD_KIND.TRAINER,
    number: '59/64',
    effect: 'RECALL_ACTIVE',
    description: 'Retira tu Strain Activo a tu Banca (no cuenta como KO). No puedes atacar este turno.',
  },
  HAND_RESET: {
    id: 'HAND_RESET',
    name: 'Hand Reset',
    subtitle: 'Entrenador',
    kind: CARD_KIND.TRAINER,
    number: '60/64',
    effect: 'HAND_RESET',
    description: 'Ambos jugadores descartan su mano y roban 3 cartas nuevas.',
  },

  // ── GEAR ────────────────────────────────────────────────
  ROOT_SHIELD: {
    id: 'ROOT_SHIELD',
    name: 'Root Shield',
    subtitle: 'Equipo',
    kind: CARD_KIND.GEAR,
    number: '61/64',
    effect: 'REDUCE_DMG_10',
    description: 'El Strain equipado recibe 10 menos de daño de los ataques del oponente.',
  },
  ENERGY_CAPACITOR: {
    id: 'ENERGY_CAPACITOR',
    name: 'Energy Capacitor',
    subtitle: 'Equipo',
    kind: CARD_KIND.GEAR,
    number: '62/64',
    effect: 'MAX_ENERGY_3',
    description: 'Puedes almacenar hasta 3 Energías en lugar de 2.',
  },
  STICKY_RESIN: {
    id: 'STICKY_RESIN',
    name: 'Sticky Resin',
    subtitle: 'Equipo',
    kind: CARD_KIND.GEAR,
    number: '63/64',
    effect: 'PREVENT_RETREAT',
    targetOpponent: true,
    description: 'Equipa al Strain Activo del oponente. No puede retirarse del Campo Activo (excepto siendo KO).',
  },

  // ── EVENTS ──────────────────────────────────────────────
  SYSTEM_OVERLOAD: {
    id: 'SYSTEM_OVERLOAD',
    name: 'System Overload',
    subtitle: 'Evento',
    kind: CARD_KIND.EVENT,
    number: '64/64',
    effect: 'SYSTEM_OVERLOAD',
    description: 'Ningún jugador puede usar habilidades ni efectos de cartas el próximo turno. Solo se pueden usar ataques.',
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
    case TYPE.INDICA: return '#9333ea';
    case TYPE.SATIVA: return '#eab308';
    case TYPE.HYBRID: return '#22c55e';
    default: return '#6b7280';
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
