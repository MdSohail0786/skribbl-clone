import { motion } from 'framer-motion';

export default function PlayerList({ players = [], hostId, currentPlayerId }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="card p-4 flex flex-col gap-2 h-full overflow-y-auto">
      <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
        Players ({players.length})
      </h3>
      {sorted.map((p, idx) => (
        <motion.div
          key={p.id}
          layout
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: p.connected ? 1 : 0.4, y: 0 }}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
            p.id === currentPlayerId ? 'bg-[var(--color-surface-hover)]' : ''
          } ${p.isDrawer ? 'ring-1 ring-[var(--color-accent)]' : ''}`}
        >
          <span className="text-xl">{p.avatar}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-sm font-medium truncate">
              {idx === 0 && p.score > 0 && <span title="Leader">👑</span>}
              <span className="truncate">{p.name}</span>
              {p.id === hostId && <span className="text-[10px] text-[var(--color-accent)]">HOST</span>}
              {p.isDrawer && <span className="text-[10px] text-[var(--color-primary)]">✏️ drawing</span>}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">{p.score} pts</div>
          </div>
          {p.hasGuessedCorrectly && <span title="Guessed correctly">✅</span>}
          {!p.connected && <span title="Disconnected" className="text-xs text-[var(--color-danger)]">offline</span>}
          {p.isReady && !p.isDrawer && <span title="Ready" className="text-xs text-[var(--color-success)]">●</span>}
        </motion.div>
      ))}
    </div>
  );
}
