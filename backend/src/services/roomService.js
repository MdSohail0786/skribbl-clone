const roomStore = require('./roomStore');
const RoomModel = require('../models/Room');
const { isDbConnected } = require('../config/database');
const { generateRoomCode, generatePlayerId } = require('../utils/idGenerator');
const gameConfig = require('../constants/gameConfig');
const env = require('../config/env');

function buildSettings(input = {}) {
  return {
    maxPlayers: Math.min(
      Math.max(parseInt(input.maxPlayers, 10) || env.DEFAULT_MAX_PLAYERS, gameConfig.MIN_ROOM_SIZE),
      gameConfig.MAX_ROOM_SIZE
    ),
    rounds: Math.min(Math.max(parseInt(input.rounds, 10) || env.DEFAULT_ROUNDS, 2), 10),
    drawTimeSeconds: Math.min(Math.max(parseInt(input.drawTimeSeconds, 10) || env.DEFAULT_DRAW_TIME, 15), 240),
    wordChoices: gameConfig.WORD_CHOICES,
    category: input.category || 'all',
    avatar: input.avatar || '🎨',
  };
}

async function createRoom({ hostName, isPrivate, settings }) {
  let roomId = generateRoomCode();
  while (roomStore.getRoom(roomId)) {
    roomId = generateRoomCode();
  }
  const hostPlayerId = generatePlayerId();

  const room = roomStore.createRoom({
    roomId,
    hostPlayerId,
    hostName,
    hostSocketId: null, // attached once the socket connects
    isPrivate: !!isPrivate,
    settings: buildSettings(settings),
  });

  if (isDbConnected()) {
    try {
      await RoomModel.create({
        roomId,
        hostName,
        isPrivate: !!isPrivate,
        maxPlayers: room.settings.maxPlayers,
        rounds: room.settings.rounds,
        drawTimeSeconds: room.settings.drawTimeSeconds,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[roomService] Failed to persist room:', err.message);
    }
  }

  return { room, hostPlayerId };
}

function canJoin(room) {
  if (!room) return { ok: false, reason: 'Room not found' };
  if (room.players.filter((p) => p.connected).length >= room.settings.maxPlayers) {
    return { ok: false, reason: 'Room is full' };
  }
  if (room.status !== 'lobby') {
    return { ok: false, reason: 'Game already in progress' };
  }
  return { ok: true };
}

module.exports = { buildSettings, createRoom, canJoin };
