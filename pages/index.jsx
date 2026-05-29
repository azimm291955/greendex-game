// ============================================================
//  Greendex: Collect the Terpenes — Main Game Page
// ============================================================
import { useReducer, useEffect, useCallback, useRef, useState } from 'react';
import Head from 'next/head';
import { gameReducer, buildInitialState, PHASE, TURN_PHASE } from '../lib/gameEngine';
import { buildAIActions } from '../lib/aiEngine';
import GameBoard from '../components/GameBoard';
import GameLog from '../components/GameLog';
import { GameOverModal, CoinFlipModal } from '../components/Modals';

// ── AI timing ─────────────────────────────────────────────
const AI_ACTION_DELAY_MS = 700;
// Delay before auto-ending the player's turn after an attack, so the
// hit/shake animation has time to play.
const AUTO_END_TURN_DELAY_MS = 850;

export default function GreendexGame() {
  const [state, dispatch] = useReducer(gameReducer, null, buildInitialState);
  const aiQueueRef = useRef([]);
  const aiTimerRef = useRef(null);
  const [aiRunning, setAiRunning] = useState(false);

  // ── Build + run AI action queue ─────────────────────────
  const runNextAIAction = useCallback(() => {
    if (aiQueueRef.current.length === 0) {
      setAiRunning(false);
      return;
    }
    const action = aiQueueRef.current.shift();
    dispatch(action);
    // Schedule next action
    aiTimerRef.current = setTimeout(runNextAIAction, AI_ACTION_DELAY_MS);
  }, []);

  useEffect(() => {
    if (state.phase !== PHASE.OPPONENT_TURN || aiRunning) return;

    // Small initial delay so player can see the board update
    const startDelay = setTimeout(() => {
      const actions = buildAIActions(state);
      aiQueueRef.current = actions;
      setAiRunning(true);
      runNextAIAction();
    }, 500);

    return () => clearTimeout(startDelay);
  }, [state.phase, state.turnNumber]); // re-run when a new opponent turn starts

  // Cleanup AI timer on unmount
  useEffect(() => () => clearTimeout(aiTimerRef.current), []);

  // ── Shake animation cleanup ──────────────────────────────
  useEffect(() => {
    if (!state.shakingCard) return;
    const t = setTimeout(() => dispatch({ type: 'CLEAR_SHAKE' }), 500);
    return () => clearTimeout(t);
  }, [state.shakingCard]);

  // ── Auto-end the player's turn after attacking ───────────
  // The reducer flags pendingAutoEndTurn when the player attacks. We wait a
  // beat so the hit animation can play, then switch to the opponent. If the
  // attack instead sent us to SELECT_BENCH (e.g. recoil self-KO), this waits
  // until the player has promoted and we're back on PLAYER_TURN.
  useEffect(() => {
    if (!state.pendingAutoEndTurn || state.phase !== PHASE.PLAYER_TURN) return;
    const t = setTimeout(() => dispatch({ type: 'END_TURN' }), AUTO_END_TURN_DELAY_MS);
    return () => clearTimeout(t);
  }, [state.pendingAutoEndTurn, state.phase]);

  // ── Resolve the opening coin flip ────────────────────────
  function handleCoinFlipComplete(result) {
    dispatch({ type: 'RESOLVE_COIN_FLIP', result });
  }

  // ── Restart ─────────────────────────────────────────────
  function handleRestart() {
    clearTimeout(aiTimerRef.current);
    aiQueueRef.current = [];
    setAiRunning(false);
    dispatch({ type: '__RESET__' });
    // Reinitialize by replacing reducer with fresh state
    window.location.reload();
  }

  const isGameOver = state.phase === PHASE.GAME_OVER;
  const isCoinFlip = state.phase === PHASE.COIN_FLIP;

  return (
    <>
      <Head>
        <title>Greendex: Collect the Terpenes</title>
        <meta name="description" content="A single-player trading card game about cannabis strains and terpenes." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div
        className="flex flex-col"
        style={{ height: '100vh', background: 'radial-gradient(ellipse at 50% 0%, #0c2114 0%, #05100a 60%)', overflow: 'hidden' }}
      >
        {/* ── TOP BAR ─────────────────────────────────────── */}
        <header
          className="flex items-center justify-between px-4 py-2 flex-shrink-0"
          style={{
            background: 'linear-gradient(90deg,#06120a,#16401f,#06120a)',
            borderBottom: '2px solid #3f6b3f',
          }}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '1.5rem' }}>🌿</span>
            <div>
              <h1
                className="font-black text-lg leading-tight tracking-wide"
                style={{
                  background: 'linear-gradient(90deg,#4ade80,#22c55e,#86efac)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                GREENDEX
              </h1>
              <p className="text-emerald-400 text-xs tracking-widest font-semibold">COLLECT THE TERPENES</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-300">
            <span>Turn <strong className="text-emerald-300">{state.turnNumber}</strong></span>
            <span
              className="px-2 py-1 rounded-full font-bold text-xs"
              style={{
                background: (state.phase === PHASE.PLAYER_TURN || state.phase === PHASE.SETUP) ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                color: (state.phase === PHASE.PLAYER_TURN || state.phase === PHASE.SETUP) ? '#4ade80' : '#f87171',
                border: `1px solid ${(state.phase === PHASE.PLAYER_TURN || state.phase === PHASE.SETUP) ? '#22c55e33' : '#ef444433'}`,
              }}
            >
              {state.phase === PHASE.COIN_FLIP
                ? '🪙 Coin Flip'
                : state.phase === PHASE.SETUP
                ? '🌱 Setup'
                : state.phase === PHASE.PLAYER_TURN
                ? '▶ Your Turn'
                : state.phase === PHASE.OPPONENT_TURN
                ? '⏳ AI Turn'
                : state.phase === PHASE.SELECT_BENCH
                ? '⟳ Promote Bench'
                : '🏁 Game Over'}
            </span>
          </div>

          <button
            onClick={handleRestart}
            className="text-xs text-slate-300 hover:text-white transition-colors px-2 py-1 rounded border border-slate-600 hover:border-emerald-400"
          >
            🔄 Restart
          </button>
        </header>

        {/* ── MAIN CONTENT ────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Game Board */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <GameBoard state={state} dispatch={dispatch} />
          </div>

          {/* Game Log sidebar */}
          <div
            className="flex-shrink-0 overflow-hidden"
            style={{ width: 220 }}
          >
            <div className="h-full p-2">
              <GameLog messages={state.log} />
            </div>
          </div>
        </div>

        {/* ── COIN FLIP MODAL ─────────────────────────────── */}
        {isCoinFlip && (
          <CoinFlipModal onComplete={handleCoinFlipComplete} />
        )}

        {/* ── GAME OVER MODAL ─────────────────────────────── */}
        {isGameOver && (
          <GameOverModal winner={state.winner} onRestart={handleRestart} />
        )}
      </div>
    </>
  );
}
