// ============================================================
//  Modals — Victory/Defeat screen + Card Detail + Attack Panel
//  All imports MUST be at the top of the file in ES modules
// ============================================================
import { getTypeColor, getTypeEmoji, getTypeLabel } from '../data/cards';
import { hpPercent, hpColor } from '../lib/gameEngine';

// ── Victory / Defeat Modal ───────────────────────────────────
export function GameOverModal({ winner, onRestart }) {
  const isVictory = winner === 'player';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className="rounded-2xl border-2 p-8 flex flex-col items-center gap-6 text-center max-w-md w-full mx-4 animate-slide-in"
        style={{
          background: isVictory
            ? 'linear-gradient(160deg, #064e3b, #065f46, #047857)'
            : 'linear-gradient(160deg, #450a0a, #7f1d1d, #991b1b)',
          borderColor: isVictory ? '#22c55e' : '#ef4444',
          boxShadow: isVictory
            ? '0 0 60px rgba(34,197,94,0.4)'
            : '0 0 60px rgba(239,68,68,0.4)',
        }}
      >
        <div style={{ fontSize: '4rem' }}>
          {isVictory ? '🏆' : '💀'}
        </div>

        <div>
          <h1
            className="text-4xl font-black tracking-wider mb-2"
            style={{ color: isVictory ? '#4ade80' : '#f87171' }}
          >
            {isVictory ? 'VICTORY!' : 'DEFEAT!'}
          </h1>
          <p className="text-gray-300 text-lg">
            {isVictory
              ? 'You dominated the Greendex battlefield!'
              : 'The opponent out-terped you. Train harder!'}
          </p>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-3 rounded-xl font-bold text-lg tracking-wide transition-all hover:scale-105 active:scale-95"
          style={{
            background: isVictory
              ? 'linear-gradient(90deg, #16a34a, #22c55e)'
              : 'linear-gradient(90deg, #dc2626, #ef4444)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          🔄 Play Again
        </button>
      </div>
    </div>
  );
}

// ── Card Detail Modal ────────────────────────────────────────
export function CardDetailModal({ card, onClose }) {
  if (!card) return null;

  const typeColor = getTypeColor(card.type);
  const pct = card.currentHp != null ? hpPercent(card) : 100;
  const barColor = hpColor(pct);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="rounded-2xl border-2 p-6 flex flex-col gap-4 max-w-sm w-full mx-4 animate-slide-in overflow-y-auto"
        style={{
          background: `linear-gradient(160deg, #1a2e1a, ${typeColor}22)`,
          borderColor: typeColor,
          boxShadow: `0 0 40px ${typeColor}44`,
          maxHeight: '90vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white">{card.name}</h2>
            <p className="text-slate-300 text-sm">{card.subtitle}</p>
          </div>
          <span style={{ fontSize: '2.5rem' }}>{getTypeEmoji(card.type)}</span>
        </div>

        {/* Type + HP */}
        {card.hp && (
          <div className="flex items-center gap-3">
            <span
              className="px-2 py-0.5 rounded-full text-white text-xs font-bold flex-shrink-0"
              style={{ background: typeColor }}
            >
              {getTypeLabel(card.type)}
            </span>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">HP</span>
                <span className="font-bold" style={{ color: barColor }}>
                  {card.currentHp ?? card.hp} / {card.hp}
                </span>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: '#0d1a0e' }}>
                <div
                  className="hp-bar rounded-full"
                  style={{ width: `${pct}%`, height: '100%', background: barColor }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Passive */}
        {card.passiveText && (
          <div
            className="rounded-lg p-3 border"
            style={{ background: `${typeColor}15`, borderColor: `${typeColor}44` }}
          >
            <p className="text-xs font-bold text-gray-200 mb-1">✨ Passive Ability</p>
            <p className="text-xs text-gray-300">{card.passiveText}</p>
          </div>
        )}

        {/* Attacks */}
        {card.attacks && card.attacks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Attacks</p>
            {card.attacks.map((atk, i) => (
              <div
                key={i}
                className="rounded-lg p-3 border"
                style={{ background: '#ffffff08', borderColor: '#ffffff15' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-bold text-sm">{atk.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 text-xs">{'⚡'.repeat(atk.energy)}</span>
                    <span className="text-orange-400 font-black">{atk.damage}</span>
                  </div>
                </div>
                <p className="text-slate-300 text-xs">{atk.description}</p>
                {atk.effects && atk.effects.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {atk.effects.map(e => (
                      <span key={e} className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">
                        {e.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Description (support cards) */}
        {card.description && (
          <p className="text-sm text-gray-300 leading-relaxed">{card.description}</p>
        )}

        {/* Gear equipped */}
        {card.gear && (
          <div className="rounded-lg p-2 border border-yellow-800 bg-yellow-900/20">
            <p className="text-yellow-400 text-xs font-bold">🔧 Equipped: {card.gear.name}</p>
            <p className="text-slate-300 text-xs">{card.gear.description}</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="text-gray-500 text-sm hover:text-gray-300 transition-colors text-center pt-1"
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
}

// ── Attack Selection Panel ───────────────────────────────────
export function AttackPanel({ card, energy, onAttack, onCancel }) {
  if (!card) return null;

  const typeColor = getTypeColor(card.type);

  return (
    <div
      className="rounded-xl border-2 p-4 flex flex-col gap-3 animate-slide-in"
      style={{
        background: `linear-gradient(160deg, #1a2e1a, ${typeColor}22)`,
        borderColor: typeColor,
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm">{card.name} — Choose Attack</h3>
        <span className="text-yellow-400 text-sm">⚡ {energy} available</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(card.attacks || []).map((atk, i) => {
          const canAfford = energy >= atk.energy;
          return (
            <button
              key={i}
              disabled={!canAfford}
              onClick={() => canAfford && onAttack(i)}
              className={[
                'flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
                canAfford
                  ? 'hover:scale-[1.02] hover:border-white cursor-pointer'
                  : 'opacity-40 cursor-not-allowed',
              ].join(' ')}
              style={{
                background: canAfford ? `${typeColor}22` : '#ffffff08',
                borderColor: canAfford ? `${typeColor}88` : '#ffffff15',
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-sm">{atk.name}</span>
                  {atk.effects && atk.effects.includes('recoil10') && (
                    <span className="text-red-400 text-xs">(recoil 10)</span>
                  )}
                </div>
                <p className="text-slate-300 text-xs leading-snug">{atk.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-yellow-400 font-bold">{'⚡'.repeat(atk.energy)}</span>
                <span className="text-orange-400 font-black text-lg">{atk.damage}</span>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onCancel}
        className="text-gray-500 text-xs hover:text-gray-300 transition-colors text-center"
      >
        ← Cancel
      </button>
    </div>
  );
}
