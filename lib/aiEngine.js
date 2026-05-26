// ============================================================
//  GREENDEX — Heuristic AI Engine
//  Runs the opponent's full turn as a sequence of dispatches
// ============================================================
import { CARD_KIND, PASSIVE } from '../data/cards';
import { PHASE, TURN_PHASE, canEvolve, getEvolutionCard } from './gameEngine';

// ────────────────────────────────────────────────────────────
//  AI turn orchestrator
//  Returns an array of action objects to dispatch sequentially
// ────────────────────────────────────────────────────────────
export function buildAIActions(state) {
  const actions = [];
  if (state.phase !== PHASE.OPPONENT_TURN) return actions;

  const opp = state.opponent;
  const player = state.player;

  // ── 1. DRAW PHASE ────────────────────────────────────────
  actions.push({ type: 'DRAW_CARD' });

  // ── 2. ENERGY PHASE ─────────────────────────────────────
  actions.push({ type: 'GAIN_ENERGY' });

  // ── 3. PLAY PHASE ────────────────────────────────────────

  // 3a. Play Stage-1 Strains to empty bench slots
  const handWithIdx = opp.hand.map((c, i) => ({ c, i }));
  const s1sInHand = handWithIdx.filter(({ c }) => c.kind === CARD_KIND.STRAIN && c.stage === 1);

  let benchLen = opp.bench.length;
  for (const { i } of s1sInHand) {
    if (benchLen >= 3) break;
    if (!opp.active) {
      // Will be auto-promoted to active inside reducer
      actions.push({ type: 'PLAY_STRAIN', cardIdx: i, toBench: false });
    } else {
      actions.push({ type: 'PLAY_STRAIN', cardIdx: i, toBench: true });
    }
    benchLen++;
  }

  // 3b. Evolve one Strain (rules: only one evolution per turn — active takes priority)
  let evolved = false;
  if (!evolved && opp.active) {
    const evoCard = getEvolutionCard(opp.active, opp.hand);
    if (evoCard) {
      const evoIdx = opp.hand.indexOf(evoCard);
      if (evoIdx !== -1) {
        actions.push({ type: 'EVOLVE_STRAIN', fieldTarget: 'active', handCardIdx: evoIdx });
        evolved = true;
      }
    }
  }

  // 3c. Evolve a bench card only if active was not evolved this turn
  if (!evolved) {
    for (let bi = 0; bi < opp.bench.length; bi++) {
      if (evolved) break;
      const bc = opp.bench[bi];
      const evoCard = getEvolutionCard(bc, opp.hand);
      if (evoCard) {
        const evoIdx = opp.hand.indexOf(evoCard);
        if (evoIdx !== -1) {
          actions.push({ type: 'EVOLVE_STRAIN', fieldTarget: bi, handCardIdx: evoIdx });
          evolved = true;
        }
      }
    }
  }

  // 3d. Equip Gear to active (if no gear)
  if (opp.active && !opp.active.gear && !opp.gearPlayed) {
    const gearWithIdx = opp.hand.map((c, i) => ({ c, i })).filter(({ c }) => c.kind === CARD_KIND.GEAR);
    if (gearWithIdx.length > 0) {
      const { c: gc, i: gi } = gearWithIdx[0];
      if (gc.effect === 'PREVENT_RETREAT' && player.active) {
        // Sticky Resin targets opponent's (player's) active
        actions.push({ type: 'EQUIP_GEAR', handCardIdx: gi, targetField: 'oppActive' });
      } else if (gc.effect !== 'PREVENT_RETREAT') {
        actions.push({ type: 'EQUIP_GEAR', handCardIdx: gi, targetField: 'active' });
      }
    }
  }

  // 3e. Play a Trainer (prefer Energy Drain if player has 2 energy)
  if (!opp.trainerPlayed) {
    const trainersWithIdx = opp.hand.map((c, i) => ({ c, i })).filter(({ c }) => c.kind === CARD_KIND.TRAINER);
    if (trainersWithIdx.length > 0) {
      // Prioritize Energy Drain if player has energy
      const drainEntry = trainersWithIdx.find(({ c }) => c.effect === 'DRAIN_OPPONENT_ENERGY');
      const chosen = (drainEntry && player.energy >= 1) ? drainEntry : trainersWithIdx[0];
      actions.push({ type: 'PLAY_TRAINER', handCardIdx: chosen.i });
    }
  }

  // 3f. Play Event if available
  if (!opp.eventPlayed && !opp.cannotPlayEvents) {
    const eventsWithIdx = opp.hand.map((c, i) => ({ c, i })).filter(({ c }) => c.kind === CARD_KIND.EVENT);
    if (eventsWithIdx.length > 0) {
      actions.push({ type: 'PLAY_EVENT', handCardIdx: eventsWithIdx[0].i });
    }
  }

  // ── 4. ATTACK PHASE ──────────────────────────────────────
  if (opp.active && player.active && !opp.hasAttacked && !opp.cannotAttack) {
    const bestAtkIdx = chooseBestAttack(opp, player);
    if (bestAtkIdx !== -1) {
      actions.push({ type: 'ATTACK', attackIdx: bestAtkIdx });
    }
  }

  // ── 5. END TURN ──────────────────────────────────────────
  actions.push({ type: 'END_TURN' });

  return actions;
}

// ────────────────────────────────────────────────────────────
//  Choose best attack the AI can afford
// ────────────────────────────────────────────────────────────
function chooseBestAttack(opp, player) {
  if (!opp.active || !opp.active.attacks) return -1;
  const attacks = opp.active.attacks;

  // Rank: highest affordable damage wins
  let bestIdx = -1;
  let bestDmg = -1;

  for (let i = 0; i < attacks.length; i++) {
    const atk = attacks[i];
    if (opp.energy >= atk.energy) {
      const effectiveDmg = atk.damage + (wouldHaveTypeAdv(opp.active, player.active) ? 10 : 0);
      if (effectiveDmg > bestDmg) {
        bestDmg = effectiveDmg;
        bestIdx = i;
      }
    }
  }

  return bestIdx;
}

// ────────────────────────────────────────────────────────────
//  Type advantage check
// ────────────────────────────────────────────────────────────
function wouldHaveTypeAdv(attacker, defender) {
  if (!attacker || !defender) return false;
  const adv = {
    indica: 'sativa',
    sativa: 'hybrid',
    hybrid: 'indica',
  };
  return adv[attacker.type] === defender.type;
}
