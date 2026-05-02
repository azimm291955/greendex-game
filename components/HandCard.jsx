// ============================================================
//  HandCard — A card in the player's hand
// ============================================================
import { getTypeColor, getTypeEmoji, CARD_KIND } from '../data/cards';

const KIND_COLORS = {
  [CARD_KIND.STRAIN]:  '#22c55e',
  [CARD_KIND.TRAINER]: '#3b82f6',
  [CARD_KIND.GEAR]:    '#f59e0b',
  [CARD_KIND.EVENT]:   '#ec4899',
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
        isPlayable ? 'cursor-pointer hover:scale-110 hover:-translate-y-2' : 'opacity-60 cursor-not-allowed',
        isSelected ? 'ring-2 ring-white ring-offset-1 scale-110 -translate-y-3' : '',
      ].join(' ')}
      style={{
        background: `linear-gradient(160deg, #1a2e1a 0%, ${accentColor}22 100%)`,
        borderColor: isSelected ? '#fff' : accentColor,
        boxShadow: isSelected ? `0 0 20px ${accentColor}88` : `0 0 6px ${accentColor}44`,
      }}
    >
      {/* Top: name + cost */}
      <div
        className="px-1.5 py-1 flex items-center justify-between"
        style={{ background: `${accentColor}33` }}
      >
        <span className="text-white font-bold leading-tight" style={{ fontSize: '0.55rem' }}>
          {card.name}
        </span>
        {isStrain && (
          <span className="text-gray-300" style={{ fontSize: '0.5rem' }}>
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
          <span className="text-gray-400" style={{ fontSize: '0.5rem' }}>
            {card.type?.charAt(0).toUpperCase() + card.type?.slice(1)} · {card.hp} HP
          </span>
        )}
        {!isStrain && (
          <span className="text-gray-400 text-center px-1 leading-tight" style={{ fontSize: '0.45rem' }}>
            {card.subtitle}
          </span>
        )}
      </div>

      {/* Bottom: attacks or description */}
      <div className="px-1.5 pb-1 pt-0.5" style={{ background: `${accentColor}11` }}>
        {isStrain ? (
          <div className="space-y-0.5">
            {(card.attacks || []).map((atk, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-gray-300 truncate" style={{ fontSize: '0.45rem' }}>
                  {'⚡'.repeat(atk.energy)} {atk.name}
                </span>
                <span className="text-yellow-400 font-bold" style={{ fontSize: '0.45rem' }}>
                  {atk.damage}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 leading-tight" style={{ fontSize: '0.44rem' }}>
            {card.description?.slice(0, 60)}{card.description?.length > 60 ? '…' : ''}
          </p>
        )}
      </div>

      {/* Playable badge */}
      {isPlayable && (
        <div
          className="absolute top-0 right-0 w-2 h-2 rounded-full"
          style={{ background: '#22c55e', margin: '3px' }}
        />
      )}
    </div>
  );
}
