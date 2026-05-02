// ============================================================
//  Greendex: Collect the Terpenes — Main Game Page
// ============================================================
import { useReducer, useEffect, useCallback, useRef, useState } from 'react';
import Head from 'next/head';
import { gameReducer, buildInitialState, PHASE, TURN_PHASE } from '../lib/gameEngine';
import { buildAIActions } from '../lib/aiEngine';
import GameBoard from '../components/GameBoard';
import GameLog from '../components/GameLog';
import { GameOverModal } from '../components/Modals';

// ── AI timing ─────────────────────────────────────────────
const AI_ACTION_DELAY_MS = 700;

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
        style={{ height: '100vh', background: '#0d1a0e', overflow: 'hidden' }}
      >
        {/* ── TOP BAR ─────────────────────────────────────── */}
        <header
          className="flex items-center justify-between px-4 py-2 flex-shrink-0"
          style={{
            background: 'linear-gradient(90deg,#0d1a0e,#1a3320,#0d1a0e)',
            borderBottom: '1px solid #2d4a2d',
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
              <p className="text-green-700 text-xs tracking-widest">COLLECT THE TERPENES</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Turn <strong className="text-green-400">{state.turnNumber}</strong></span>
            <span
              className="px-2 py-1 rounded-full font-bold text-xs"
              style={{
                background: state.phase === PHASE.PLAYER_TURN ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                color: state.phase === PHASE.PLAYER_TURN ? '#4ade80' : '#f87171',
                border: `1px solid ${state.phase === PHASE.PLAYER_TURN ? '#22c55e33' : '#ef444433'}`,
              }}
            >
              {state.phase === PHASE.PLAYER_TURN
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
            className="text-xs text-gray-600 hover:text-gray-300 transition-colors px-2 py-1 rounded border border-gray-800 hover:border-gray-600"
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

        {/* ── GAME OVER MODAL ─────────────────────────────── */}
        {isGameOver && (
          <GameOverModal winner={state.winner} onRestart={handleRestart} />
        )}
      </div>
    </>
  );
}
