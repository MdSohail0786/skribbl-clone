const Word = require('../models/Word');
const { isDbConnected } = require('../config/database');
const fallbackBank = require('../constants/wordBank');
const gameConfig = require('../constants/gameConfig');

function flattenFallback(category) {
  if (category && category !== 'all' && fallbackBank[category]) {
    return fallbackBank[category].map((w) => ({ word: w, category }));
  }
  return Object.entries(fallbackBank).flatMap(([cat, words]) =>
    words.map((w) => ({ word: w, category: cat }))
  );
}

function sampleUnique(pool, count) {
  const copy = [...pool];
  const picked = [];
  while (picked.length < count && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    picked.push(copy.splice(idx, 1)[0]);
  }
  return picked;
}

/**
 * Returns `count` random word options for the drawer to choose from.
 * Falls back to the static word bank if MongoDB isn't connected,
 * so the game is always playable even before Atlas is configured.
 */
async function getWordOptions(category = 'all', count = gameConfig.WORD_CHOICES) {
  if (isDbConnected()) {
    try {
      const query = category && category !== 'all' ? { category } : {};
      const docs = await Word.aggregate([{ $match: query }, { $sample: { size: count } }]);
      if (docs.length >= count) {
        return docs.map((d) => d.word);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[wordService] Mongo sample failed, using fallback bank:', err.message);
    }
  }
  const pool = flattenFallback(category);
  return sampleUnique(pool, count).map((w) => w.word);
}

module.exports = { getWordOptions };
