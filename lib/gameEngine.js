// ============================================================
//  GREENDEX — Game Engine (pure reducer + helpers)
// ============================================================
import {
  CARD_KIND, TYPE_ADVANTAGE, PASSIVE, ATK_EFFECT,
  createFieldCard, shuffle, hasTypeAdvantage,
  PLAYER_DECK_DEF, OPPONENT_DECK_DEF,
} from '../data/cards';

// ────────────────────────────────────────────────────────────
//  STATE SHAPE
// ────────────────────────────────────────────────────────────
export const PHASE = {
  SETUP:          'setup',
  PLAYER_TURN:    'playerTurn',
  OPPONENT_TURN:  'opponentTurn',
  GAME_OVER:      'gameOver',
  SELECT_BENCH:   'selectBench',   // player must pick a bench card to promote
};

export const TURN_PHASE = {
  DRAW:   'draw',
  PLAY:   'play',
  ATTACK: 'attack',
  END:    'end',
};

function makeSide() {
  return {
    deck: [],
    hand: [],
    active: null,          // FieldCard | null
    bench: [],             // FieldCard[]  (max 3)
    graveyard: [],
    energy: 0,
    maxEnergy: 2,
    koCount: 0,
    // turn-scoped flags
    trainerPlayed: false,
    gearPlayed: false,
    eventPlayed: false,
    hasAttacked: false,
    hasRetreated: false,
    hasEvolved: false,
    // cross-turn status effects
    cannotDraw: false,
    cannotAttack: false,
    cannotPlayEvents: false,
    systemOverloadActive: false,
    energyPenaltyNextTurn: 0,
    controlledGrowthActive: false,   // max 50 dmg until end of turn
  };
}

export function buildInitialState() {
  const playerDeck = shuffle(PLAYER_DECK_DEF.map(c => ({ ...c })));
  const oppDeck    = shuffle(OPPONENT_DECK_DEF.map(c => ({ ...c })));

  // Draw opening hands
  const playerHand = playerDeck.splice(0, 5);
  const oppHand    = oppDeck.splice(0, 5);

  // Auto-place first Stage-1 strain from hand as Active
  const pActiveIdx = playerHand.findIndex(c => c.kind === CARD_KIND.STRAIN && c.stage === 1);
  const oActiveIdx = oppHand.findIndex(c => c.kind === CARD_KIND.STRAIN && c.stage === 1);

  const player = makeSide();
  const opponent = makeSide();

  player.deck = playerDeck;
  player.hand = playerHand;
  opponent.deck = oppDeck;
  opponent.hand = oppHand;

  if (pActiveIdx !== -1) {
    const [card] = player.hand.splice(pActiveIdx, 1);
    player.active = createFieldCard(card);
    player.active.entryProtection = false; // start-of-game placement
  }
  if (oActiveIdx !== -1) {
    const [card] = opponent.hand.splice(oActiveIdx, 1);
    opponent.active = createFieldCard(card);
    opponent.active.entryProtection = false;
  }

  return {
    phase: PHASE.PLAYER_TURN,
    turnPhase: TURN_PHASE.DRAW,
    turnNumber: 1,
    player,
    opponent,
    log: ['⚔️ Battle Start! Your turn — Draw Phase.'],
    winner: null,
    pendingPromotion: null,   // 'player' | 'opponent' when active is KO'd and bench exists
    shakingCard: null,        // instanceId currently shaking
  };
}

// ────────────────────────────────────────────────────────────
//  REDUCER  (dispatched from UI or AI)
// ────────────────────────────────────────────────────────────
export function gameReducer(state, action) {
  switch (action.type) {

    case 'DRAW_CARD':       return handleDraw(state);
    case 'GAIN_ENERGY':     return handleGainEnergy(state);
    case 'PLAY_STRAIN':     return handlePlayStrain(state, action);
    case 'EVOLVE_STRAIN':   return handleEvolve(state, action);
    case 'PLAY_TRAINER':    return handleTrainer(state, action);
    case 'EQUIP_GEAR':      return handleGear(state, action);
    case 'PLAY_EVENT':      return handleEvent(state, action);
    case 'ATTACK':          return handleAttack(state, action);
    case 'RETREAT':         return handleRetreat(state, action);
    case 'PROMOTE_BENCH':   return handlePromote(state, action);
    case 'END_TURN':        return handleEndTurn(state);
    case 'ADD_LOG':         return { ...state, log: [...state.log, action.message] };
    case 'CLEAR_SHAKE':     return { ...state, shakingCard: null };

    default: return state;
  }
}

// ────────────────────────────────────────────────────────────
//  HELPERS
// ────────────────────────────────────────────────────────────
function activeSide(state) {
  return state.phase === PHASE.PLAYER_TURN ? 'player' : 'opponent';
}
function passiveSide(state) {
  return state.phase === PHASE.PLAYER_TURN ? 'opponent' : 'player';
}

function log(state, msg) {
  return { ...state, log: [msg, ...state.log].slice(0, 80) };
}

function cloneSide(side) {
  return {
    ...side,
    deck: [...side.deck],
    hand: [...side.hand],
    bench: side.bench.map(c => ({ ...c })),
    active: side.active ? { ...side.active } : null,
    graveyard: [...side.graveyard],
  };
}

function applyDamageToCard(card, rawDamage, defenderSide, ignoreDefense = false) {
  if (!card) return [card, rawDamage];

  let dmg = rawDamage;

  if (!ignoreDefense) {
    // Passive damage reduction
    const passive = card.passive;
    if (passive === PASSIVE.REDUCE_DMG_10 || passive === PASSIVE.BENCH_AOE_10_PASSIVE) dmg -= 10;
    if (passive === PASSIVE.REDUCE_DMG_20) dmg -= 20;

    // Gear: Root Shield
    if (card.gear?.effect === 'REDUCE_DMG_10') dmg -= 10;

    // Controlled growth: cap at 50 on any one hit
    if (defenderSide.controlledGrowthActive) dmg = Math.min(dmg, 50);

    // Entry protection: cap at 50 on first turn
    if (card.entryProtection) dmg = Math.min(dmg, 50);
  }

  dmg = Math.max(0, dmg);
  const newHp = Math.max(0, card.currentHp - dmg);
  return [{ ...card, currentHp: newHp }, dmg];
}

function checkKO(state, sideName) {
  const side = state[sideName];
  if (!side.active || side.active.currentHp > 0) return state;

  const scorerName = sideName === 'player' ? 'opponent' : 'player';
  const scorer = cloneSide(state[scorerName]);
  scorer.koCount += 1;

  const dead = { ...side.active };
  const updatedSide = cloneSide(side);
  updatedSide.graveyard = [dead, ...updatedSide.graveyard];
  updatedSide.active = null;

  let newState = {
    ...state,
    [sideName]: updatedSide,
    [scorerName]: scorer,
  };
  newState = log(newState, `💀 ${dead.name} was KO'd! ${scorerName.toUpperCase()} scores a KO! (${scorer.koCount}/3)`);
  newState = checkWinConditions(newState);
  if (newState.phase === PHASE.GAME_OVER) return newState;

  // If bench has cards, flag for promotion
  if (updatedSide.bench.length > 0) {
    if (sideName === 'player') {
      newState = { ...newState, phase: PHASE.SELECT_BENCH };
    } else {
      // AI auto-promotes first bench card
      newState = autoPromote(newState, 'opponent');
    }
  } else {
    // No bench — opponent wins by elimination
    newState = { ...newState, phase: PHASE.GAME_OVER, winner: scorerName };
    newState = log(newState, `🏆 ${scorerName.toUpperCase()} wins by elimination!`);
  }
  return newState;
}

function autoPromote(state, sideName) {
  const side = cloneSide(state[sideName]);
  if (side.bench.length === 0) return state;
  const [promoted, ...rest] = side.bench;
  const fc = { ...promoted, entryProtection: true, turnsInPlay: 0 };
  side.active = fc;
  side.bench = rest;
  const newState = { ...state, [sideName]: side };
  return log(newState, `🔄 ${sideName.toUpperCase()}'s ${promoted.name} promoted to Active!`);
}

function checkWinConditions(state) {
  if (state.player.koCount >= 3) {
    return { ...state, phase: PHASE.GAME_OVER, winner: 'player' };
  }
  if (state.opponent.koCount >= 3) {
    return { ...state, phase: PHASE.GAME_OVER, winner: 'opponent' };
  }
  // Elimination: no active and no bench
  if (!state.player.active && state.player.bench.length === 0) {
    return { ...state, phase: PHASE.GAME_OVER, winner: 'opponent' };
  }
  if (!state.opponent.active && state.opponent.bench.length === 0) {
    return { ...state, phase: PHASE.GAME_OVER, winner: 'player' };
  }
  return state;
}

// ────────────────────────────────────────────────────────────
//  ACTION HANDLERS
// ────────────────────────────────────────────────────────────

function handleDraw(state) {
  const sn = activeSide(state);
  const side = cloneSide(state[sn]);

  if (side.cannotDraw) {
    side.cannotDraw = false;
    const newState = { ...state, [sn]: side, turnPhase: TURN_PHASE.PLAY };
    return log(newState, `🚫 ${sn.toUpperCase()} cannot draw this turn (effect)!`);
  }

  if (side.deck.length === 0) {
    // deck out = skip draw, game continues (per rules: players do NOT lose for empty deck)
    const newState = { ...state, [sn]: side, turnPhase: TURN_PHASE.PLAY };
    return log(newState, `📭 ${sn.toUpperCase()} has no cards left — skipping draw.`);
  }

  const [drawn, ...rest] = side.deck;
  side.hand = [...side.hand, drawn];
  side.deck = rest;

  const newState = { ...state, [sn]: side, turnPhase: TURN_PHASE.PLAY };
  return log(newState, `🃏 ${sn.toUpperCase()} draws a card. (${rest.length} left in deck)`);
}

function handleGainEnergy(state) {
  const sn = activeSide(state);
  const side = cloneSide(state[sn]);

  // Penalty from last turn
  if (side.energyPenaltyNextTurn > 0) {
    side.energy = Math.max(0, side.energy - side.energyPenaltyNextTurn);
    side.energyPenaltyNextTurn = 0;
  }

  // Extra energy from Sour Diesel S2 passive
  let gain = 1;
  if (side.active?.passive === PASSIVE.EXTRA_ENERGY_GAIN) gain = 2;

  side.energy = Math.min(side.maxEnergy, side.energy + gain);

  const newState = { ...state, [sn]: side };
  return log(newState, `⚡ ${sn.toUpperCase()} gains ${gain} Energy. Pool: ${side.energy}/${side.maxEnergy}`);
}

function handlePlayStrain(state, { cardIdx, toBench }) {
  const sn = activeSide(state);
  const side = cloneSide(state[sn]);

  if (side.hand[cardIdx]?.kind !== CARD_KIND.STRAIN) return state;
  const card = side.hand[cardIdx];
  if (card.stage !== 1) return state; // can't play stage 2 directly
  if (side.bench.length >= 3) return state; // bench full

  const fc = createFieldCard(card);
  let newState = { ...state };

  // Entry passives
  if (card.passive === PASSIVE.DRAW_1_ON_ENTRY && side.deck.length > 0) {
    const [drawn, ...rest] = side.deck;
    side.hand = [...side.hand, drawn];
    side.deck = rest;
    newState = log({ ...newState, [sn]: side }, `✨ ${card.name}'s Sueño Lúcido: ${sn.toUpperCase()} draws 1 card!`);
  }

  if (card.passive === PASSIVE.HEAL_15_ON_ENTRY) {
    fc.currentHp = Math.min(fc.hp, fc.currentHp + 15);
    newState = log({ ...newState, [sn]: side }, `💚 ${card.name}'s Dulce Recuperación: healed 15 HP!`);
  }

  if (card.passive === PASSIVE.OPPONENT_DISCARD_ON_ENTRY) {
    const ps = cloneSide(state[passiveSide(state)]);
    if (ps.hand.length > 0) {
      ps.hand = ps.hand.slice(0, -1);
      newState = log({ ...newState, [passiveSide(state)]: ps },
        `🃏 ${card.name}'s Corte Perfecto: ${passiveSide(state).toUpperCase()} discards 1 card!`);
    }
  }

  const freshSide = cloneSide(newState[sn]);
  freshSide.hand = freshSide.hand.filter((_, i) => i !== cardIdx);
  freshSide.bench = [...freshSide.bench, fc];

  // If no active, promote directly
  if (!freshSide.active) {
    freshSide.active = { ...fc, entryProtection: false };
    freshSide.bench = freshSide.bench.filter(c => c.instanceId !== fc.instanceId);
    newState = log({ ...newState, [sn]: freshSide }, `🌿 ${sn.toUpperCase()} plays ${card.name} as Active Strain!`);
  } else {
    newState = log({ ...newState, [sn]: freshSide }, `🌿 ${sn.toUpperCase()} plays ${card.name} to Bench!`);
  }

  return newState;
}

function handleEvolve(state, { fieldTarget, handCardIdx }) {
  // fieldTarget: 'active' | benchIdx (number)
  // handCardIdx: index in hand of the Stage-2 card
  const sn = activeSide(state);
  const side = cloneSide(state[sn]);

  // Rules: only one evolution allowed per turn
  if (side.hasEvolved) return state;

  const s2Card = side.hand[handCardIdx];
  if (!s2Card || s2Card.kind !== CARD_KIND.STRAIN || s2Card.stage !== 2) return state;

  let base;
  if (fieldTarget === 'active') {
    base = side.active;
  } else {
    base = side.bench[fieldTarget];
  }
  if (!base) return state;
  if (base.id !== s2Card.evolvesFrom) return state;
  if (base.turnsInPlay < 1) return state; // must have been in play 1 turn

  const evolved = {
    ...createFieldCard(s2Card),
    instanceId: base.instanceId,
    currentHp: Math.min(s2Card.hp, base.currentHp + (s2Card.hp - base.hp)),
    gear: base.gear,
    turnsInPlay: base.turnsInPlay,
    entryProtection: false,
    freeRetreatUsed: base.freeRetreatUsed,
  };

  side.hand = side.hand.filter((_, i) => i !== handCardIdx);
  side.hasEvolved = true;

  if (fieldTarget === 'active') {
    side.active = evolved;
  } else {
    side.bench = side.bench.map((c, i) => i === fieldTarget ? evolved : c);
  }

  const newState = { ...state, [sn]: side };
  return log(newState, `⬆️ ${sn.toUpperCase()} evolves ${s2Card.evolvesFrom.replace(/_/g,' ')} → ${s2Card.name} ${s2Card.subtitle}!`);
}

function handleTrainer(state, { handCardIdx }) {
  const sn = activeSide(state);
  const side = cloneSide(state[sn]);
  const ps = passiveSide(state);
  const oppSide = cloneSide(state[ps]);

  if (side.trainerPlayed) return state;
  const card = side.hand[handCardIdx];
  if (!card || card.kind !== CARD_KIND.TRAINER) return state;
  if (sn === 'player' && state.player.systemOverloadActive) return state;

  side.hand = side.hand.filter((_, i) => i !== handCardIdx);
  side.graveyard = [card, ...side.graveyard];
  side.trainerPlayed = true;

  let newState = { ...state, [sn]: side };

  switch (card.effect) {
    case 'DRAIN_OPPONENT_ENERGY': {
      const lost = oppSide.energy >= 2 ? oppSide.energy : 1;
      oppSide.energy = Math.max(0, oppSide.energy - (oppSide.energy >= 2 ? oppSide.energy : 1));
      newState = { ...newState, [sn]: cloneSide(newState[sn]), [ps]: oppSide };
      newState = log(newState, `🔋 Energy Drain! ${ps.toUpperCase()} loses ${lost} Energy!`);
      break;
    }
    case 'ENTRY_PROTECT_ALL': {
      const s = cloneSide(newState[sn]);
      s.controlledGrowthActive = true;
      newState = { ...newState, [sn]: s };
      newState = log(newState, `🛡️ Controlled Growth! ${sn.toUpperCase()}'s Strains take max 50 damage this turn!`);
      break;
    }
    case 'RECALL': {
      const s = cloneSide(newState[sn]);
      if (s.active && s.bench.length < 3) {
        const recalled = { ...s.active, turnsInPlay: s.active.turnsInPlay };
        s.bench = [...s.bench, recalled];
        s.active = null;
        s.hasRetreated = true;
        s.hasAttacked = true; // can't attack after recall
        newState = { ...newState, [sn]: s };
        newState = log(newState, `↩️ Recall! ${sn.toUpperCase()}'s ${recalled.name} returns to Bench!`);
        if (!s.active && s.bench.length > 0) {
          if (sn === 'player') {
            newState = { ...newState, phase: PHASE.SELECT_BENCH };
          } else {
            newState = autoPromote(newState, sn);
          }
        }
      }
      break;
    }
    case 'HAND_RESET': {
      const sideA = cloneSide(newState[sn]);
      const sideB = cloneSide(newState[ps]);
      sideA.graveyard = [...sideA.graveyard, ...sideA.hand];
      sideB.graveyard = [...sideB.graveyard, ...sideB.hand];
      sideA.hand = sideA.deck.splice(0, 3);
      sideB.hand = sideB.deck.splice(0, 3);
      newState = { ...newState, [sn]: sideA, [ps]: sideB };
      newState = log(newState, `🔄 Hand Reset! Both players draw 3 new cards!`);
      break;
    }
  }

  return newState;
}

function handleGear(state, { handCardIdx, targetField, targetBenchIdx }) {
  // targetField: 'active' | 'bench' | 'oppActive'
  const sn = activeSide(state);
  const ps = passiveSide(state);
  const side = cloneSide(state[sn]);

  if (side.gearPlayed) return state;
  const card = side.hand[handCardIdx];
  if (!card || card.kind !== CARD_KIND.GEAR) return state;
  if (sn === 'player' && state.player.systemOverloadActive) return state;

  side.hand = side.hand.filter((_, i) => i !== handCardIdx);
  side.gearPlayed = true;

  let newState = { ...state, [sn]: side };

  if (card.effect === 'PREVENT_RETREAT' && targetField === 'oppActive') {
    const oppSide = cloneSide(state[ps]);
    if (oppSide.active) {
      oppSide.active = { ...oppSide.active, cannotRetreat: true, gear: card };
      newState = { ...newState, [ps]: oppSide };
      newState = log(newState, `🍯 Sticky Resin! ${ps.toUpperCase()}'s ${oppSide.active.name} cannot retreat!`);
    }
    return newState;
  }

  // Equip to own strain
  let target = null;
  if (targetField === 'active') {
    target = cloneSide(newState[sn]).active;
  } else if (targetField === 'bench') {
    target = cloneSide(newState[sn]).bench[targetBenchIdx];
  }
  if (!target || target.gear) return state; // already has gear

  const updated = { ...target, gear: card };
  if (card.effect === 'MAX_ENERGY_3') {
    const s = cloneSide(newState[sn]);
    s.maxEnergy = 3;
    updated.gear = card;
    if (targetField === 'active') s.active = updated;
    else s.bench = s.bench.map((c, i) => i === targetBenchIdx ? updated : c);
    newState = { ...newState, [sn]: s };
    newState = log(newState, `⚡ Energy Capacitor equipped to ${updated.name}! Max energy → 3!`);
  } else {
    const s = cloneSide(newState[sn]);
    if (targetField === 'active') s.active = updated;
    else s.bench = s.bench.map((c, i) => i === targetBenchIdx ? updated : c);
    newState = { ...newState, [sn]: s };
    newState = log(newState, `🛡️ ${card.name} equipped to ${updated.name}!`);
  }

  return newState;
}

function handleEvent(state, { handCardIdx }) {
  const sn = activeSide(state);
  const ps = passiveSide(state);
  const side = cloneSide(state[sn]);

  if (side.eventPlayed) return state;
  const card = side.hand[handCardIdx];
  if (!card || card.kind !== CARD_KIND.EVENT) return state;
  if (state[sn].cannotPlayEvents) return state;
  if (sn === 'player' && state.player.systemOverloadActive) return state;

  side.hand = side.hand.filter((_, i) => i !== handCardIdx);
  side.graveyard = [card, ...side.graveyard];
  side.eventPlayed = true;

  let newState = { ...state, [sn]: side };

  if (card.effect === 'SYSTEM_OVERLOAD') {
    const sideA = cloneSide(newState[sn]);
    const sideB = cloneSide(newState[ps]);
    sideA.systemOverloadActive = true;
    sideB.systemOverloadActive = true;
    newState = { ...newState, [sn]: sideA, [ps]: sideB };
    newState = log(newState, `⚠️ System Overload! No abilities or effects next turn — attacks only!`);
  }

  return newState;
}

export function handleAttack(state, { attackIdx }) {
  const sn = activeSide(state);
  const ps = passiveSide(state);

  if (state.turnPhase !== TURN_PHASE.ATTACK && state.turnPhase !== TURN_PHASE.PLAY) return state;
  const side = cloneSide(state[sn]);
  const oppSide = cloneSide(state[ps]);

  if (side.hasAttacked || side.cannotAttack) return state;
  if (!side.active) return state;
  if (!oppSide.active) return state;

  const atk = side.active.attacks[attackIdx];
  if (!atk) return state;
  if (side.energy < atk.energy) return state;

  // Spend energy
  side.energy -= atk.energy;

  // Base damage
  let dmg = atk.damage;

  // Type advantage
  if (hasTypeAdvantage(side.active.type, oppSide.active.type)) {
    dmg += 10;
  }

  const ignoreDefense = atk.effects?.includes(ATK_EFFECT.IGNORE_DEFENSE) ?? false;

  // Apply damage to opponent's active
  const [newOppActive, actualDmg] = applyDamageToCard(oppSide.active, dmg, oppSide, ignoreDefense);
  oppSide.active = newOppActive;

  // AOE 30 bench damage (Green Domination)
  if (atk.effects?.includes(ATK_EFFECT.AOE_30_BENCH)) {
    oppSide.bench = oppSide.bench.map(bc => {
      const [newBc] = applyDamageToCard(bc, 30, oppSide, ignoreDefense);
      return newBc;
    });
  }

  // Recoil damage to self
  if (atk.effects?.includes(ATK_EFFECT.RECOIL_10)) {
    side.active = { ...side.active, currentHp: Math.max(0, side.active.currentHp - 10) };
  }

  // Attack effects
  if (atk.effects?.includes(ATK_EFFECT.DRAIN_ENERGY)) {
    oppSide.energyPenaltyNextTurn = Math.max(oppSide.energyPenaltyNextTurn, 1);
  }
  if (atk.effects?.includes(ATK_EFFECT.BLOCK_DRAW_1)) {
    oppSide.cannotDraw = true;
  }
  if (atk.effects?.includes(ATK_EFFECT.BLOCK_OPPONENT_ATTACK)) {
    oppSide.cannotAttack = true;
  }
  if (atk.effects?.includes(ATK_EFFECT.BLOCK_ABILITIES)) {
    oppSide.systemOverloadActive = true;
  }
  if (atk.effects?.includes(ATK_EFFECT.OPPONENT_DISCARD)) {
    if (oppSide.hand.length > 0) oppSide.hand = oppSide.hand.slice(0, -1);
  }
  if (atk.effects?.includes(ATK_EFFECT.REDUCE_OPPONENT_DMG_20)) {
    side.controlledGrowthActive = true; // repurpose for self-defense
  }

  // Mark attacked
  side.hasAttacked = true;

  let newState = {
    ...state,
    [sn]: side,
    [ps]: oppSide,
    turnPhase: TURN_PHASE.END,
    shakingCard: oppSide.active ? oppSide.active.instanceId : null,
  };

  const advantage = hasTypeAdvantage(side.active.type, newState[ps].active?.type)
    ? ' ⚡ Type Advantage!'
    : '';
  newState = log(newState,
    `💥 ${side.active.name} used ${atk.name} for ${actualDmg} damage!${advantage}` +
    (atk.effects?.includes(ATK_EFFECT.RECOIL_10) ? ' (10 recoil)' : '')
  );

  // Check KO
  if (oppSide.active && oppSide.active.currentHp <= 0) {
    newState = checkKO(newState, ps);
  }
  if (side.active && side.active.currentHp <= 0) {
    newState = checkKO(newState, sn);
  }
  // Check bench KOs from AOE
  if (atk.effects?.includes(ATK_EFFECT.AOE_30_BENCH)) {
    const freshOpp = cloneSide(newState[ps]);
    const aliveBench = [];
    for (const bc of freshOpp.bench) {
      if (bc.currentHp <= 0) {
        const scorer = cloneSide(newState[sn]);
        scorer.koCount += 1;
        freshOpp.graveyard = [bc, ...freshOpp.graveyard];
        newState = { ...newState, [sn]: scorer, [ps]: freshOpp };
        newState = log(newState, `💀 ${bc.name} on Bench was KO'd! ${sn.toUpperCase()} scores a KO! (${scorer.koCount}/3)`);
        newState = checkWinConditions(newState);
      } else {
        aliveBench.push(bc);
      }
    }
    freshOpp.bench = aliveBench;
    newState = { ...newState, [ps]: { ...newState[ps], bench: aliveBench } };
  }

  return newState;
}

function handleRetreat(state) {
  const sn = activeSide(state);
  const side = cloneSide(state[sn]);

  if (side.hasAttacked || side.hasRetreated) return state;
  if (!side.active) return state;
  if (side.bench.length === 0) return state;
  if (side.active.cannotRetreat) {
    return log(state, `🍯 ${side.active.name} is stuck with Sticky Resin — can't retreat!`);
  }

  const hasFreeRetreat = side.active.passive === PASSIVE.FREE_RETREAT ||
    (side.active.passive === PASSIVE.FREE_RETREAT_ONCE && !side.active.freeRetreatUsed);
  const cost = hasFreeRetreat ? 0 : 1;

  if (side.energy < cost) return log(state, `⚡ Not enough Energy to retreat! (Need ${cost})`);

  if (hasFreeRetreat && side.active.passive === PASSIVE.FREE_RETREAT_ONCE) {
    side.active = { ...side.active, freeRetreatUsed: true };
  }

  side.energy -= cost;
  side.hasRetreated = true;

  const retreated = { ...side.active };
  side.bench = [...side.bench, retreated];
  side.active = null;

  let newState = { ...state, [sn]: side };
  newState = log(newState, `↩️ ${retreated.name} retreated to Bench! (Cost: ${cost} Energy)`);

  if (sn === 'player') {
    return { ...newState, phase: PHASE.SELECT_BENCH };
  } else {
    return autoPromote(newState, sn);
  }
}

function handlePromote(state, { benchIdx }) {
  if (state.phase !== PHASE.SELECT_BENCH) return state;

  const side = cloneSide(state.player);
  if (benchIdx < 0 || benchIdx >= side.bench.length) return state;

  const promoted = side.bench[benchIdx];
  side.active = { ...promoted, entryProtection: true, turnsInPlay: 0 };
  side.bench = side.bench.filter((_, i) => i !== benchIdx);

  // Entry passives on promotion
  let newState = { ...state, player: side, phase: PHASE.PLAYER_TURN };
  if (promoted.passive === PASSIVE.DRAW_1_ON_ENTRY && side.deck.length > 0) {
    const freshSide = cloneSide(newState.player);
    const [drawn, ...rest] = freshSide.deck;
    freshSide.hand = [...freshSide.hand, drawn];
    freshSide.deck = rest;
    newState = { ...newState, player: freshSide };
    newState = log(newState, `✨ ${promoted.name}'s Sueño Lúcido: Player draws 1 card!`);
  }
  newState = log(newState, `🔄 ${promoted.name} promoted to Active!`);
  return newState;
}

function handleEndTurn(state) {
  const sn = activeSide(state);
  const ps = passiveSide(state);
  const side = cloneSide(state[sn]);

  // Apply end-of-turn passives
  if (side.active) {
    // Healing
    if (side.active.passive === PASSIVE.HEAL_10_END) {
      side.active.currentHp = Math.min(side.active.hp, side.active.currentHp + 10);
    }
    if (side.active.passive === PASSIVE.HEAL_20_END || side.active.passive === PASSIVE.HEAL_20_END_DRAW) {
      side.active.currentHp = Math.min(side.active.hp, side.active.currentHp + 20);
    }
    // Draw 1 (Gelato S2)
    if (side.active.passive === PASSIVE.HEAL_20_END_DRAW && side.deck.length > 0) {
      const [drawn, ...rest] = side.deck;
      side.hand = [...side.hand, drawn];
      side.deck = rest;
    }
    // Northern Lights S2: AOE 10 to opponent bench
    if (side.active.passive === PASSIVE.BENCH_AOE_10_PASSIVE) {
      const oppSide = cloneSide(state[ps]);
      oppSide.bench = oppSide.bench.map(bc => ({
        ...bc, currentHp: Math.max(0, bc.currentHp - 10),
      }));
      // (we'll update ps in the state below)
    }
    // Increment turns in play for active
    side.active = { ...side.active, turnsInPlay: side.active.turnsInPlay + 1, entryProtection: false };
  }

  // Increment turnsInPlay for bench cards
  side.bench = side.bench.map(c => ({ ...c, turnsInPlay: c.turnsInPlay + 1, entryProtection: false }));

  // Reset turn flags
  side.trainerPlayed = false;
  side.gearPlayed = false;
  side.eventPlayed = false;
  side.hasAttacked = false;
  side.hasRetreated = false;
  side.hasEvolved = false;
  side.controlledGrowthActive = false;
  side.cannotAttack = false;
  side.systemOverloadActive = false;

  // Handle opponent's GDP S2 event block
  const oppSide = cloneSide(state[ps]);
  if (side.active?.passive === PASSIVE.BLOCK_EVENTS || side.active?.passiveExtra === PASSIVE.BLOCK_EVENTS) {
    oppSide.cannotPlayEvents = true;
  } else {
    oppSide.cannotPlayEvents = false;
  }

  // Apply Northern Lights S2 bench AOE
  if (side.active?.passive === PASSIVE.BENCH_AOE_10_PASSIVE) {
    oppSide.bench = oppSide.bench.map(bc => ({
      ...bc, currentHp: Math.max(0, bc.currentHp - 10),
    }));
  }

  const nextPhase = sn === 'player' ? PHASE.OPPONENT_TURN : PHASE.PLAYER_TURN;
  const nextTurnNumber = sn === 'opponent' ? state.turnNumber + 1 : state.turnNumber;

  let newState = {
    ...state,
    [sn]: side,
    [ps]: oppSide,
    phase: nextPhase,
    turnPhase: TURN_PHASE.DRAW,
    turnNumber: nextTurnNumber,
    shakingCard: null,
  };
  newState = log(newState, `───── Turn ${nextTurnNumber} — ${ps.toUpperCase()}'s turn begins ─────`);

  newState = checkWinConditions(newState);
  return newState;
}

// ────────────────────────────────────────────────────────────
//  EXPORTED UTILITY SELECTORS
// ────────────────────────────────────────────────────────────

export function canEvolve(fieldCard, hand) {
  if (!fieldCard) return false;
  if (fieldCard.turnsInPlay < 1) return false;
  return hand.some(c => c.kind === CARD_KIND.STRAIN && c.stage === 2 && c.evolvesFrom === fieldCard.id);
}

export function getEvolutionCard(fieldCard, hand) {
  if (!fieldCard) return null;
  return hand.find(c => c.kind === CARD_KIND.STRAIN && c.stage === 2 && c.evolvesFrom === fieldCard.id) || null;
}

export function canAttack(state) {
  const sn = activeSide(state);
  const side = state[sn];
  const opp = state[passiveSide(state)];
  return !side.hasAttacked && !side.cannotAttack && !!side.active && !!opp.active;
}

export function hpPercent(card) {
  if (!card) return 0;
  return Math.max(0, Math.min(100, (card.currentHp / card.hp) * 100));
}

export function hpColor(pct) {
  if (pct > 60) return '#22c55e';
  if (pct > 30) return '#eab308';
  return '#ef4444';
}
