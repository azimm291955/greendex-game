// ============================================================
//  GameLog — Scrollable action log sidebar
// ============================================================
import { useEffect, useRef } from 'react';

function logColor(msg) {
  if (msg.includes('KO') || msg.includes('defeated') || msg.includes('💀')) return '#ef4444';
  if (msg.includes('wins') || msg.includes('Victory') || msg.includes('🏆')) return '#f59e0b';
  if (msg.includes('draws') || msg.includes('🃏')) return '#60a5fa';
  if (msg.includes('Energy') || msg.includes('⚡')) return '#facc15';
  if (msg.includes('Attack') || msg.includes('💥') || msg.includes('damage')) return '#fb923c';
  if (msg.includes('Shield') || msg.includes('🛡') || msg.includes('Resin')) return '#34d399';
  if (msg.includes('evolves') || msg.includes('⬆️')) return '#a78bfa';
  if (msg.includes('turn begins') || msg.includes('─────')) return '#6b7280';
  return '#d1d5db';
}

export default function GameLog({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-board-bg rounded-xl border border-board-border overflow-hidden">
      <div
        className="px-3 py-2 flex items-center gap-2 border-b border-board-border"
        style={{ background: '#1a2e1a' }}
      >
        <span style={{ fontSize: '1rem' }}>📜</span>
        <span className="text-green-400 font-bold text-sm tracking-wide">Battle Log</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 text-xs">
        {[...messages].reverse().map((msg, i) => (
          <div
            key={i}
            className="animate-slide-in leading-relaxed"
            style={{ color: logColor(msg), opacity: i === 0 ? 1 : Math.max(0.35, 1 - i * 0.03) }}
          >
            {msg}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
