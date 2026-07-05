const mongoose = require('mongoose');
const env = require('./env');

let isConnected = false;

/**
 * Connects to MongoDB Atlas if a URI is provided.
 * The game is designed to run fully (rooms, drawing, chat, scoring)
 * without a database — Mongo is only used for the persistent word
 * bank and optional game-history logging. This keeps local dev and
 * the 72-hour submission unblocked even before Atlas is provisioned.
 */
async function connectDatabase() {
  if (!env.MONGODB_URI) {
    // eslint-disable-next-line no-console
    console.warn('[db] MONGODB_URI not set — running with in-memory word bank, no persistence.');
    return false;
  }

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    // eslint-disable-next-line no-console
    console.log('[db] Connected to MongoDB Atlas');
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[db] Connection failed, falling back to in-memory mode:', err.message);
    return false;
  }
}

function isDbConnected() {
  return isConnected;
}

module.exports = { connectDatabase, isDbConnected };
