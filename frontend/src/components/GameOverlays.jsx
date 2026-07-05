import { motion, AnimatePresence } from 'framer-motion';

export function RoundEndOverlay({ result }) {
  return (
    <AnimatePresence>
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div initial={{ y: 10 }} animate={{ y: 0 }} className="card p-6 text-center flex flex-col gap-2">
            <p className="text-sm text-[var(--color-text-muted)] uppercase tracking-wide">Round over</p>
            <p className="text-2xl font-bold capitalize">
              The word was: <span className="text-[var(--color-accent)]">{result.word}</span>
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Next round starting shortly...</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function GameOverOverlay({ result, onPlayAgain }) {
  return (
    <AnimatePresence>
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="card p-8 text-center flex flex-col gap-4 min-w-[300px]">
            <p className="text-sm text-[var(--color-text-muted)] uppercase tracking-wide">Game over</p>
            {result.winner && (
              <p className="text-3xl font-bold">
                🏆 {result.winner.avatar} {result.winner.name} wins!
              </p>
            )}
            <div className="flex flex-col gap-1.5 mt-2">
              {result.leaderboard.map((p, i) => (
                <div key={p.id} className="flex justify-between text-sm px-3">
                  <span>
                    #{i + 1} {p.avatar} {p.name}
                  </span>
                  <span className="font-semibold">{p.score} pts</span>
                </div>
              ))}
            </div>
            <button onClick={onPlayAgain} className="btn-primary rounded-lg px-4 py-2 mt-3 font-semibold">
              Back to Home
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
