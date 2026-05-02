// ============================================================
//  GameBoard — Main visual board layout
// ============================================================
import { useState } from 'react';
import StrainCard from './StrainCard';
import HandCard from './HandCard';
import { CardDetailModal, AttackPanel } from './Modals';
import { CARD_KIND, getTypeColor, getTypeEmoji } from '../data/cards';
import { PHASE, TURN_PHASE, canEvolve, getEvolutionCard } from '../lib/gameEngine';

function KOTrack({ count, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-gray-400 text-xs">{label}</span>
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
            style={{
              borderColor: i < count ? '#ef4444' : '#374151',
              background: i < count ? '#ef444433' : 'transparent',
              boxShadow: i < count ? '0 0 8px #ef4444aa' : 'none',
            }}
          >
            {i < count && <span style={{ fontSize: '0.6rem' }}>💀</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function EnergyDisplay({ energy, maxEnergy, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-gray-400 text-xs">{label}</span>
      <div className="flex gap-1">
        {Array(maxEnergy).fill(0).map((_, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
            style={{
              borderColor: i < energy ? '#eab308' : '#374151',
              background: i < energy ? '#eab30833' : 'transparent',
              boxShadow: i < energy ? '0 0 8px #eab308aa' : 'none',
            }}
          >
            {i < energy && <span style={{ fontSize: '0.55rem' }}>⚡</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function DeckPile({ count, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-16 h-22 rounded-lg border-2 border-green-900 flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#1a2e1a,#0d1a0e)', minHeight: 88 }}
      >
        <span style={{ fontSize: '1.4rem' }}>🌿</span>
        <span className="text-green-400 font-bold text-sm mt-1">{count}</span>
      </div>
      <span className="text-gray-500 text-xs">{label}</span>
    </div>
  );
}

function BenchSlot({ card, isSelectable, isShaking, onClick, onInfoClick, size = 'md' }) {
  return (
    <div className="relative">
      {card ? (
        <>
          <StrainCard
            card={card}
            isShaking={isShaking}
            isSelectable={isSelectable}
            onClick={onClick}
            size={size}
          />
          <button
            onClick={e => { e.stopPropagation(); onInfoClick?.(); }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-gray-500 transition-colors z-10"
            style={{ fontSize: '0.5rem' }}
            title="Card info"
          >
            ℹ
          </button>
        </>
      ) : (
        <div
          className="rounded-xl border-2 border-dashed border-green-900 flex items-center justify-center opacity-30"
          style={{ width: size === 'sm' ? 96 : 128, height: size === 'sm' ? 128 : 176 }}
        >
          <span className="text-green-700" style={{ fontSize: '1.4rem' }}>+</span>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
export default function GameBoard({ state, dispatch }) {
  const [detailCard, setDetailCard] = useState(null);
  const [selectedHandIdx, setSelectedHandIdx] = useState(null);
  const [showAttackPanel, setShowAttackPanel] = useState(false);

  const { player, opponent, phase, turnPhase, shakingCard } = state;
  const isPlayerTurn = phase === PHASE.PLAYER_TURN || phase === PHASE.SELECT_BENCH;
  const isSelectBench = phase === PHASE.SELECT_BENCH;

  // ── Derived flags ──────────────────────────────────────────
  const canPlayCards = isPlayerTurn && !isSelectBench && !player.hasAttacked;
  const canDoAttack = isPlayerTurn && !isSelectBench && !player.hasAttacked && !player.cannotAttack
    && !!player.active && !!opponent.active
    && turnPhase !== TURN_PHASE.DRAW;

  const selectedCard = selectedHandIdx !== null ? player.hand[selectedHandIdx] : null;

  // ── Hand card click logic ──────────────────────────────────
  function handleHandClick(idx) {
    if (!isPlayerTurn || isSelectBench) return;
    if (selectedHandIdx === idx) {
      setSelectedHandIdx(null);
      return;
    }
    setSelectedHandIdx(idx);
  }

  function isHandCardPlayable(card) {
    if (!isPlayerTurn || isSelectBench) return false;
    switch (card.kind) {
      case CARD_KIND.STRAIN:
        if (card.stage === 1) return player.bench.length < 3 || !player.active;
        if (card.stage === 2) {
          // Can evolve active?
          if (canEvolve(player.active, player.hand)) {
            const evo = getEvolutionCard(player.active, player.hand);
            if (evo && evo === card) return true;
          }
          // Can evolve bench?
          for (const bc of player.bench) {
            if (canEvolve(bc, player.hand)) {
              const evo = getEvolutionCard(bc, player.hand);
              if (evo && evo === card) return true;
            }
          }
          return false;
        }
        return false;
      case CARD_KIND.TRAINER: return !player.trainerPlayed;
      case CARD_KIND.GEAR:    return !player.gearPlayed;
      case CARD_KIND.EVENT:   return !player.eventPlayed && !player.cannotPlayEvents;
      default: return false;
    }
  }

  function handlePlaySelected() {
    if (selectedHandIdx === null) return;
    const card = player.hand[selectedHandIdx];

    switch (card.kind) {
      case CARD_KIND.STRAIN:
        if (card.stage === 1) {
          dispatch({ type: 'PLAY_STRAIN', cardIdx: selectedHandIdx, toBench: true });
        } else {
          // Try to evolve active first, then bench
          if (canEvolve(player.active, player.hand) && getEvolutionCard(player.active, player.hand) === card) {
            dispatch({ type: 'EVOLVE_STRAIN', fieldTarget: 'active', handCardIdx: selectedHandIdx });
          } else {
            for (let bi = 0; bi < player.bench.length; bi++) {
              if (canEvolve(player.bench[bi], player.hand) && getEvolutionCard(player.bench[bi], player.hand) === card) {
                dispatch({ type: 'EVOLVE_STRAIN', fieldTarget: bi, handCardIdx: selectedHandIdx });
                break;
              }
            }
          }
        }
        setSelectedHandIdx(null);
        break;

      case CARD_KIND.TRAINER:
        dispatch({ type: 'PLAY_TRAINER', handCardIdx: selectedHandIdx });
        setSelectedHandIdx(null);
        break;

      case CARD_KIND.GEAR:
        // Equip to active by default (Sticky Resin targets opponent active)
        if (card.effect === 'PREVENT_RETREAT') {
          dispatch({ type: 'EQUIP_GEAR', handCardIdx: selectedHandIdx, targetField: 'oppActive' });
        } else {
          dispatch({ type: 'EQUIP_GEAR', handCardIdx: selectedHandIdx, targetField: 'active' });
        }
        setSelectedHandIdx(null);
        break;

      case CARD_KIND.EVENT:
        dispatch({ type: 'PLAY_EVENT', handCardIdx: selectedHandIdx });
        setSelectedHandIdx(null);
        break;
    }
  }

  function handleAttack(atkIdx) {
    dispatch({ type: 'ATTACK', attackIdx: atkIdx });
    setShowAttackPanel(false);
  }

  function handleRetreat() {
    dispatch({ type: 'RETREAT' });
  }

  function handleEndTurn() {
    dispatch({ type: 'END_TURN' });
    setSelectedHandIdx(null);
    setShowAttackPanel(false);
  }

  function handlePromoteBench(benchIdx) {
    dispatch({ type: 'PROMOTE_BENCH', benchIdx });
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="flex h-full gap-3 p-3 overflow-hidden">

      {/* ── MAIN BOARD ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-2 min-w-0 overflow-hidden">

        {/* ── OPPONENT ZONE ─────────────────────────────────── */}
        <div className="flex items-start gap-3 px-2">

          {/* Opponent KO + Deck */}
          <div className="flex flex-col gap-3 items-center">
            <KOTrack count={opponent.koCount} label="OPP KOs" />
            <DeckPile count={opponent.deck.length} label="Deck" />
          </div>

          {/* Opponent bench */}
          <div className="flex gap-2 items-end flex-1 justify-center">
            {[0, 1, 2].map(i => (
              <BenchSlot
                key={i}
                card={opponent.bench[i] || null}
                isShaking={shakingCard && opponent.bench[i]?.instanceId === shakingCard}
                size="sm"
                onInfoClick={() => setDetailCard(opponent.bench[i])}
              />
            ))}
          </div>

          {/* Opponent energy */}
          <div className="flex flex-col gap-2 items-center">
            <EnergyDisplay energy={opponent.energy} maxEnergy={opponent.maxEnergy} label="⚡ OPP" />
            <span className="text-gray-600 text-xs">{opponent.hand.length} cards</span>
          </div>
        </div>

        {/* ── BATTLE ZONE ───────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center gap-8 relative">

          {/* Dividing line */}
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px opacity-20"
            style={{ background: 'linear-gradient(90deg,transparent,#22c55e,transparent)' }}
          />

          {/* Opponent Active */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-gray-500 text-xs font-semibold tracking-widest uppercase">Opponent</span>
            <div className="relative opponent-active-zone rounded-xl p-1">
              {opponent.active ? (
                <>
                  <StrainCard
                    card={opponent.active}
                    isActive
                    isOpponent
                    isShaking={shakingCard === opponent.active.instanceId}
                    size="lg"
                    onClick={() => setDetailCard(opponent.active)}
                    isSelectable
                  />
                  <button
                    onClick={() => setDetailCard(opponent.active)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-gray-500 transition-colors z-10 text-xs"
                  >ℹ</button>
                </>
              ) : (
                <div
                  className="rounded-xl border-2 border-dashed border-red-900/40 flex items-center justify-center opacity-40"
                  style={{ width: 160, height: 224 }}
                >
                  <span className="text-red-700 text-2xl">?</span>
                </div>
              )}
            </div>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="text-2xl font-black tracking-widest text-green-400"
              style={{ textShadow: '0 0 20px rgba(34,197,94,0.6)' }}
            >
              VS
            </div>
            {/* Turn / Phase indicator */}
            <div
              className="px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{
                background: isPlayerTurn ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                border: `1px solid ${isPlayerTurn ? '#22c55e44' : '#ef444444'}`,
              }}
            >
              {isSelectBench ? '⟳ Choose Bench' : isPlayerTurn ? '▶ YOUR TURN' : '⏳ AI Thinking...'}
            </div>
            <div className="text-gray-600 text-xs">Turn {state.turnNumber}</div>
          </div>

          {/* Player Active */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative player-active-zone rounded-xl p-1">
              {player.active ? (
                <>
                  <StrainCard
                    card={player.active}
                    isActive
                    isShaking={shakingCard === player.active.instanceId}
                    size="lg"
                    onClick={() => setDetailCard(player.active)}
                    isSelectable
                  />
                  <button
                    onClick={() => setDetailCard(player.active)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-gray-500 transition-colors z-10 text-xs"
                  >ℹ</button>
                </>
              ) : (
                <div
                  className="rounded-xl border-2 border-dashed border-green-900/40 flex items-center justify-center opacity-40"
                  style={{ width: 160, height: 224 }}
                >
                  <span className="text-green-700 text-2xl">+</span>
                </div>
              )}
            </div>
            <span className="text-gray-500 text-xs font-semibold tracking-widest uppercase">You</span>
          </div>
        </div>

        {/* ── PLAYER BENCH ──────────────────────────────────── */}
        <div className="flex items-end gap-3 px-2">

          {/* Player KO + Deck */}
          <div className="flex flex-col gap-3 items-center">
            <DeckPile count={player.deck.length} label="Deck" />
            <KOTrack count={player.koCount} label="MY KOs" />
          </div>

          {/* Player bench */}
          <div className="flex gap-2 items-start flex-1 justify-center">
            {[0, 1, 2].map(i => (
              <BenchSlot
                key={i}
                card={player.bench[i] || null}
                isShaking={shakingCard && player.bench[i]?.instanceId === shakingCard}
                isSelectable={isSelectBench && !!player.bench[i]}
                onClick={() => isSelectBench && handlePromoteBench(i)}
                onInfoClick={() => setDetailCard(player.bench[i])}
                size="md"
              />
            ))}
          </div>

          {/* Player energy */}
          <div className="flex flex-col gap-2 items-center">
            <EnergyDisplay energy={player.energy} maxEnergy={player.maxEnergy} label="⚡ YOU" />
            {/* Turn actions */}
            {isPlayerTurn && !isSelectBench && (
              <div className="flex flex-col gap-1">
                {turnPhase === TURN_PHASE.DRAW && (
                  <button
                    onClick={() => { dispatch({ type: 'DRAW_CARD' }); dispatch({ type: 'GAIN_ENERGY' }); }}
                    className="px-2 py-1 rounded text-xs font-bold bg-blue-900 hover:bg-blue-700 text-white transition-colors"
                  >
                    🃏 Draw
                  </button>
                )}
                {canDoAttack && !showAttackPanel && (
                  <button
                    onClick={() => setShowAttackPanel(true)}
                    className="px-2 py-1 rounded text-xs font-bold bg-orange-900 hover:bg-orange-700 text-white transition-colors"
                  >
                    ⚔️ Attack
                  </button>
                )}
                {!player.hasRetreated && !player.hasAttacked && player.bench.length > 0 && (
                  <button
                    onClick={handleRetreat}
                    className="px-2 py-1 rounded text-xs font-bold bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                  >
                    ↩️ Retreat
                  </button>
                )}
                <button
                  onClick={handleEndTurn}
                  className="px-2 py-1 rounded text-xs font-bold bg-green-900 hover:bg-green-700 text-white transition-colors"
                >
                  ✅ End Turn
                </button>
              </div>
            )}
            {isSelectBench && (
              <div className="text-green-400 text-xs text-center font-bold animate-pulse">
                Select bench<br/>card to promote
              </div>
            )}
          </div>
        </div>

        {/* ── ATTACK PANEL ──────────────────────────────────── */}
        {showAttackPanel && player.active && (
          <div className="px-2">
            <AttackPanel
              card={player.active}
              energy={player.energy}
              onAttack={handleAttack}
              onCancel={() => setShowAttackPanel(false)}
            />
          </div>
        )}

        {/* ── PLAYER HAND ───────────────────────────────────── */}
        <div
          className="flex gap-2 px-3 py-2 overflow-x-auto"
          style={{ minHeight: 160, background: '#0d1a0ebb', borderTop: '1px solid #2d4a2d' }}
        >
          <div className="flex items-center gap-1 pr-2 border-r border-green-900 flex-shrink-0">
            <span className="text-gray-500 text-xs writing-mode-vertical transform -rotate-90 whitespace-nowrap">
              HAND ({player.hand.length})
            </span>
          </div>

          {player.hand.map((card, idx) => (
            <HandCard
              key={`${card.id}_${idx}`}
              card={card}
              isSelected={selectedHandIdx === idx}
              isPlayable={isHandCardPlayable(card)}
              onClick={() => handleHandClick(idx)}
            />
          ))}

          {/* Play selected card button */}
          {selectedCard && isHandCardPlayable(selectedCard) && (
            <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2 ml-2">
              <button
                onClick={handlePlaySelected}
                className="px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(90deg,#16a34a,#22c55e)' }}
              >
                ▶ Play Card
              </button>
              <button
                onClick={() => setSelectedHandIdx(null)}
                className="text-gray-600 text-xs hover:text-gray-400"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── CARD DETAIL MODAL ─────────────────────────────────── */}
      {detailCard && (
        <CardDetailModal card={detailCard} onClose={() => setDetailCard(null)} />
      )}
    </div>
  );
}
