/** Strips characters that have no place in a chat/guess/name payload. */
function sanitizeText(input = '', maxLength = 200) {
  return String(input)
    .replace(/<[^>]*>/g, '') // strip any HTML tags (basic XSS guard)
    .replace(/[\u0000-\u001F\u007F]/g, '') // strip control chars
    .trim()
    .slice(0, maxLength);
}

/** Normalizes a guess/word for case- and whitespace-insensitive comparison. */
function normalizeWord(word = '') {
  return String(word).trim().toLowerCase().replace(/\s+/g, ' ');
}

function isCloseGuess(guess, word) {
  const g = normalizeWord(guess);
  const w = normalizeWord(word);
  if (g === w) return false; // exact match handled separately
  if (Math.abs(g.length - w.length) > 1) return false;
  let mismatches = 0;
  const maxLen = Math.max(g.length, w.length);
  for (let i = 0; i < maxLen; i += 1) {
    if (g[i] !== w[i]) mismatches += 1;
  }
  return mismatches <= 1;
}

module.exports = { sanitizeText, normalizeWord, isCloseGuess };
