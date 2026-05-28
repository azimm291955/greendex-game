// ============================================================
//  HandCard — A card in the player's hand
// ============================================================
import { getTypeColor, getTypeEmoji, CARD_KIND } from '../data/cards';

const KIND_COLORS = {
  [CARD_KIND.STRAIN]:  '#4ade80',
  [CARD_KIND.TRAINER]: '#60a5fa',
  [CARD_KIND.GEAR]:    '#fbbf24',
  [CARD_KIND.EVENT]:   '#f472b6',
};

const KIND_EMOJI = {
  [CARD_KIND.STRAIN]:  null,          // use type emoji
  [CARD_KIND.TRAINER]: '📋',
  [CARD_KIND.GEAR]:    '🔧',
  [CARD_KIND.EVENT]:   '⚡',
};

export default function HandCard({ card, isSelected, isPlayable, onClick }) {
  if (!card) return null;

  const isStrain = card.kind === CARD_KIND.STRAIN;
  const accentColor = isStrain ? getTypeColor(card.type) : KIND_COLORS[card.kind];
  const icon = KIND_EMOJI[card.kind] ?? getTypeEmoji(card.type);

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={[
        'relative rounded-xl border-2 flex flex-col overflow-hidden select-none',
        'transition-all duration-150 card-hover',
        'w-24 h-36 flex-shrink-0',
        isPlayable ? 'cursor-pointer hover:scale-110 hover:-translate-y-2' : 'opacity-40 grayscale cursor-not-allowed',
        isSelected ? 'ring-2 ring-white ring-offset-1 scale-110 -translate-y-3' : '',
      ].join(' ')}
      style={{
        background: `linear-gradient(160deg, ${accentColor}3a 0%, #0a1810 70%)`,
        borderColor: isSelected ? '#fff' : accentColor,
        boxShadow: isSelected
          ? `0 0 22px ${accentColor}cc`
          : isPlayable ? `0 0 10px ${accentColor}77` : '0 2px 8px rgba(0,0,0,0.5)',
      }}
    >
      {/* Top: name + cost */}
      <div
        className="px-1.5 py-1 flex items-center justify-between"
        style={{ background: `${accentColor}5c`, borderBottom: `1px solid ${accentColor}` }}
      >
        <span className="text-white font-bold leading-tight" style={{ fontSize: '0.55rem', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
          {card.name}
        </span>
        {isStrain && (
          <span className="font-black rounded px-1" style={{ fontSize: '0.5rem', background: accentColor, color: '#07120a' }}>
            S{card.stage}
          </span>
        )}
      </div>

      {/* Art area */}
      <div
        className="flex-1 flex flex-col items-center justify-center gap-0.5"
        style={{ background: `${accentColor}0d` }}
      >
        <span style={{ fontSize: '1.8rem' }}>{icon}</span>
        {isStrain && (
          <span className="text-slate-200 font-semibold" style={{ fontSize: '0.5rem' }}>
            {card.type?.charAt(0).toUpperCase() + card.type?.slice(1)} · {card.hp} HP
          </span>
        )}
        {!isStrain && (
          <span className="text-slate-300 text-center px-1 leading-tight" style={{ fontSize: '0.45rem' }}>
            {card.subtitle}
          </span>
        )}
      </div>

      {/* Bottom: attacks or description */}
      <div className="px-1.5 pb-1 pt-0.5" style={{ background: `${accentColor}22` }}>
        {isStrain ? (
          <div className="space-y-0.5">
            {(card.attacks || []).map((atk, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-slate-200 truncate" style={{ fontSize: '0.45rem' }}>
                  {'⚡'.repeat(atk.energy)} {atk.name}
                </span>
                <span className="text-amber-300 font-black" style={{ fontSize: '0.46rem' }}>
                  {atk.damage}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-300 leading-tight" style={{ fontSize: '0.44rem' }}>
            {card.description?.slice(0, 60)}{card.description?.length > 60 ? '…' : ''}
          </p>
        )}
      </div>

      {/* Playable badge */}
      {isPlayable && (
        <div
          className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full"
          style={{ background: '#4ade80', margin: '3px', boxShadow: '0 0 8px #4ade80' }}
        />
      )}
    </div>
  );
}
