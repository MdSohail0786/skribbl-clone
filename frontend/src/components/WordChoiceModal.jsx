import { motion, AnimatePresence } from 'framer-motion';

export default function WordChoiceModal({ options, onSelect }) {
  return (
    <AnimatePresence>
      {options && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card p-6 flex flex-col gap-4 items-center"
          >
            <h3 className="text-lg font-bold">Choose a word to draw</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {options.map((word) => (
                <button
                  key={word}
                  onClick={() => onSelect(word)}
                  className="btn-primary rounded-xl px-5 py-3 font-semibold capitalize text-sm"
                >
                  {word}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
