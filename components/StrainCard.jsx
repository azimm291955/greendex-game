// ============================================================
//  StrainCard — A Strain on the playing field (Active or Bench)
// ============================================================
import { getTypeColor, getTypeLabel, getTypeEmoji, CARD_KIND } from '../data/cards';
import { hpPercent, hpColor } from '../lib/gameEngine';

export default function StrainCard({
  card,
  isActive = false,
  isShaking = false,
  isSelectable = false,
  isOpponent = false,
  onClick,
  size = 'md',   // 'sm' | 'md' | 'lg'
}) {
  if (!card) return null;

  const pct = hpPercent(card);
  const barColor = hpColor(pct);
  const typeColor = getTypeColor(card.type);

  const sizeClasses = {
    sm: 'w-24 h-32 text-xs',
    md: 'w-32 h-44',
    lg: 'w-40 h-56',
  };

  return (
    <div
      onClick={isSelectable ? onClick : undefined}
      className={[
        'relative rounded-xl overflow-hidden border-2 flex flex-col select-none transition-all duration-200',
        sizeClasses[size],
        isSelectable ? 'card-selectable cursor-pointer hover:scale-105' : '',
        isShaking ? 'animate-shake' : '',
        isActive ? 'ring-2 ring-offset-1 ring-offset-transparent' : 'opacity-90',
      ].join(' ')}
      style={{
        background: `linear-gradient(160deg, #1a2e1a 0%, ${typeColor}22 100%)`,
        borderColor: typeColor,
        boxShadow: isActive ? `0 0 16px ${typeColor}66` : undefined,
      }}
    >
      {/* Header: name + type */}
      <div
        className="flex items-center justify-between px-2 py-1"
        style={{ background: `${typeColor}33` }}
      >
        <span className="font-bold text-white truncate" style={{ fontSize: '0.6rem' }}>
          {card.name}
        </span>
        <span style={{ fontSize: '0.65rem' }}>{getTypeEmoji(card.type)}</span>
      </div>

      {/* Art / icon area */}
      <div
        className="flex-1 flex items-center justify-center relative"
        style={{ background: `${typeColor}11` }}
      >
        {/* Big type emoji as art placeholder */}
        <span style={{ fontSize: size === 'lg' ? '2.5rem' : size === 'md' ? '2rem' : '1.4rem', opacity: 0.7 }}>
          {getTypeEmoji(card.type)}
        </span>

        {/* Stage badge */}
        <span
          className="absolute top-1 left-1 text-white rounded px-1"
          style={{ fontSize: '0.5rem', background: `${typeColor}aa` }}
        >
          S{card.stage}
        </span>

        {/* Gear badge */}
        {card.gear && (
          <span
            className="absolute top-1 right-1 text-white rounded px-1"
            style={{ fontSize: '0.5rem', background: '#92400e' }}
            title={card.gear.name}
          >
            🔧
          </span>
        )}

        {/* Entry protection badge */}
        {card.entryProtection && (
          <span
            className="absolute bottom-1 right-1 text-white rounded px-1"
            style={{ fontSize: '0.5rem', background: '#1d4ed8aa' }}
            title="Entry Protection: max 50 damage this turn"
          >
            🛡
          </span>
        )}
      </div>

      {/* HP Bar */}
      <div className="px-2 pb-1 pt-0.5">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-gray-400" style={{ fontSize: '0.5rem' }}>HP</span>
          <span className="font-bold" style={{ fontSize: '0.55rem', color: barColor }}>
            {card.currentHp}/{card.hp}
          </span>
        </div>
        <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: '#1a2e1a' }}>
          <div
            className="hp-bar rounded-full"
            style={{ width: `${pct}%`, height: '100%', background: barColor }}
          />
        </div>
      </div>

      {/* Attacks (small labels) */}
      {size !== 'sm' && (
        <div className="px-2 pb-1 space-y-0.5">
          {(card.attacks || []).map((atk, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-gray-300 truncate" style={{ fontSize: '0.5rem' }}>
                {'⚡'.repeat(atk.energy)} {atk.name}
              </span>
              <span className="text-yellow-300 font-bold" style={{ fontSize: '0.5rem' }}>
                {atk.damage}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Facedown overlay for opponent's card if needed */}
      {isOpponent && false && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
          <span style={{ fontSize: '2rem' }}>🌿</span>
        </div>
      )}
    </div>
  );
}
