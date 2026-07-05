require('dotenv').config();

/**
 * Centralised, validated environment configuration.
 * Every other module should read config from here rather than
 * touching process.env directly, so defaults live in exactly one place.
 */
const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_ORIGIN: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  MONGODB_URI: process.env.MONGODB_URI || '',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  DEFAULT_MAX_PLAYERS: parseInt(process.env.DEFAULT_MAX_PLAYERS, 10) || 8,
  DEFAULT_ROUNDS: parseInt(process.env.DEFAULT_ROUNDS, 10) || 3,
  DEFAULT_DRAW_TIME: parseInt(process.env.DEFAULT_DRAW_TIME, 10) || 80,
};

module.exports = env;
