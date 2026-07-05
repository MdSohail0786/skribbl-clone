const mongoose = require('mongoose');

/**
 * This model stores a lightweight historical record of a room
 * (used for stats / audit / "GET /rooms" listing persistence across
 * restarts if Mongo is enabled). The authoritative LIVE game state
 * (current strokes, timers, sockets) is always in-memory — see
 * src/services/roomStore.js — for latency reasons.
 */
const playerSummarySchema = new mongoose.Schema(
  {
    name: String,
    score: Number,
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    hostName: { type: String, required: true },
    isPrivate: { type: Boolean, default: false },
    maxPlayers: { type: Number, default: 8 },
    rounds: { type: Number, default: 3 },
    drawTimeSeconds: { type: Number, default: 80 },
    status: { type: String, enum: ['lobby', 'in_progress', 'finished'], default: 'lobby' },
    finalScores: [playerSummarySchema],
    startedAt: Date,
    endedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Room || mongoose.model('Room', roomSchema);
