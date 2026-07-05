/**
 * RoomStore holds ALL live game state in memory, keyed by roomId.
 *
 * Why in-memory and not MongoDB:
 * Drawing strokes and timers fire many times per second per room.
 * Round-tripping that through a database would add latency and load
 * that a real-time drawing game cannot tolerate. MongoDB is used only
 * for the word bank and post-game history (see models/Room.js).
 *
 * This module is intentionally the ONLY place that mutates room state,
 * so socket handlers stay thin and testable.
 */

/** @typedef {{ id: string, socketId: string, name: string, avatar: string, score: number, isReady: boolean, isDrawer: boolean, connected: boolean, hasGuessedCorrectly: boolean }} Player */

const rooms = new Map(); // roomId -> Room

function createRoom({ roomId, hostPlayerId, hostName, hostSocketId, isPrivate, settings }) {
  const room = {
    roomId,
    hostId: hostPlayerId,
    isPrivate: !!isPrivate,
    settings: {
      maxPlayers: settings.maxPlayers,
      rounds: settings.rounds,
      drawTimeSeconds: settings.drawTimeSeconds,
      wordChoices: settings.wordChoices,
      category: settings.category || 'all',
    },
    status: 'lobby', // lobby | choosing_word | drawing | round_end | finished
    players: [
      {
        id: hostPlayerId,
        socketId: hostSocketId,
        name: hostName,
        avatar: settings.avatar || '🎨',
        score: 0,
        isReady: true,
        isDrawer: false,
        connected: true,
        hasGuessedCorrectly: false,
      },
    ],
    currentRound: 0,
    drawerOrder: [],
    drawerIndex: -1,
    currentDrawerId: null,
    currentWord: null,
    wordOptions: [],
    hintsRevealed: [],
    strokes: [], // for late joiners / undo
    timer: null, // interval handle, not serialized to clients
    createdAt: Date.now(),
  };
  rooms.set(roomId, room);
  return room;
}

function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

function deleteRoom(roomId) {
  const room = rooms.get(roomId);
  if (room?.timer) clearInterval(room.timer);
  rooms.delete(roomId);
}

function listPublicRooms() {
  return Array.from(rooms.values())
    .filter((r) => !r.isPrivate && r.status !== 'finished')
    .map((r) => ({
      roomId: r.roomId,
      playerCount: r.players.filter((p) => p.connected).length,
      maxPlayers: r.settings.maxPlayers,
      status: r.status,
      rounds: r.settings.rounds,
    }));
}

function addPlayer(roomId, player) {
  const room = getRoom(roomId);
  if (!room) return null;
  room.players.push(player);
  return room;
}

function removePlayerBySocket(socketId) {
  for (const room of rooms.values()) {
    const player = room.players.find((p) => p.socketId === socketId);
    if (player) {
      return { room, player };
    }
  }
  return null;
}

function markDisconnected(roomId, playerId) {
  const room = getRoom(roomId);
  if (!room) return null;
  const player = room.players.find((p) => p.id === playerId);
  if (player) player.connected = false;
  return room;
}

function removePlayer(roomId, playerId) {
  const room = getRoom(roomId);
  if (!room) return null;
  room.players = room.players.filter((p) => p.id !== playerId);
  return room;
}

/** Public-safe snapshot of a room sent to clients (hides the current word from guessers). */
function toPublicState(room, forPlayerId = null) {
  const isDrawerViewer = forPlayerId && room.currentDrawerId === forPlayerId;
  return {
    roomId: room.roomId,
    hostId: room.hostId,
    isPrivate: room.isPrivate,
    settings: room.settings,
    status: room.status,
    currentRound: room.currentRound,
    currentDrawerId: room.currentDrawerId,
    wordLength: room.currentWord ? room.currentWord.length : 0,
    revealedHints: room.hintsRevealed,
    word: isDrawerViewer || room.status === 'round_end' || room.status === 'finished' ? room.currentWord : null,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      isReady: p.isReady,
      isDrawer: p.isDrawer,
      connected: p.connected,
      hasGuessedCorrectly: p.hasGuessedCorrectly,
    })),
  };
}

module.exports = {
  rooms,
  createRoom,
  getRoom,
  deleteRoom,
  listPublicRooms,
  addPlayer,
  removePlayerBySocket,
  markDisconnected,
  removePlayer,
  toPublicState,
};
