const roomStore = require('../services/roomStore');
const roomService = require('../services/roomService');
const { generatePlayerId } = require('../utils/idGenerator');
const { sanitizeText } = require('../utils/sanitize');
const events = require('../constants/events');
const gameConfig = require('../constants/gameConfig');

function registerRoomManager(io, socket, gameService) {
  function emitError(message) {
    socket.emit(events.ERROR, { message });
  }

  function broadcastRoomUpdate(room) {
    room.players.forEach((p) => {
      io.to(p.socketId).emit(events.ROOM_UPDATED, roomStore.toPublicState(room, p.id));
    });
  }

  socket.on(events.CREATE_ROOM, async (payload = {}, ack) => {
    try {
      const hostName = sanitizeText(payload.hostName, gameConfig.MAX_PLAYER_NAME_LENGTH) || 'Host';
      const { room, hostPlayerId } = await roomService.createRoom({
        hostName,
        isPrivate: !!payload.isPrivate,
        settings: payload.settings || {},
      });

      room.players[0].socketId = socket.id;
      socket.data.playerId = hostPlayerId;
      socket.data.roomId = room.roomId;
      socket.join(room.roomId);

      const state = roomStore.toPublicState(room, hostPlayerId);
      socket.emit(events.ROOM_CREATED, { playerId: hostPlayerId, room: state });
      if (typeof ack === 'function') ack({ success: true, roomId: room.roomId, playerId: hostPlayerId });
    } catch (err) {
      emitError(err.message || 'Failed to create room');
      if (typeof ack === 'function') ack({ success: false, message: err.message });
    }
  });

  socket.on(events.JOIN_ROOM, (payload = {}, ack) => {
    try {
      const roomId = String(payload.roomId || '').toUpperCase().trim();
      const playerName = sanitizeText(payload.playerName, gameConfig.MAX_PLAYER_NAME_LENGTH) || 'Player';
      const room = roomStore.getRoom(roomId);

      const check = roomService.canJoin(room);
      if (!check.ok) {
        emitError(check.reason);
        if (typeof ack === 'function') ack({ success: false, message: check.reason });
        return;
      }

      const playerId = generatePlayerId();
      const player = {
        id: playerId,
        socketId: socket.id,
        name: playerName,
        avatar: payload.avatar || '🙂',
        score: 0,
        isReady: false,
        isDrawer: false,
        connected: true,
        hasGuessedCorrectly: false,
      };
      roomStore.addPlayer(roomId, player);

      socket.data.playerId = playerId;
      socket.data.roomId = roomId;
      socket.join(roomId);

      socket.emit(events.ROOM_JOINED, { playerId, room: roomStore.toPublicState(room, playerId) });
      socket.to(roomId).emit(events.PLAYER_JOINED, { player: { id: player.id, name: player.name, avatar: player.avatar } });
      broadcastRoomUpdate(room);
      if (typeof ack === 'function') ack({ success: true, roomId, playerId });
    } catch (err) {
      emitError(err.message || 'Failed to join room');
      if (typeof ack === 'function') ack({ success: false, message: err.message });
    }
  });

  socket.on(events.PLAYER_READY, () => {
    const { roomId, playerId } = socket.data;
    const room = roomStore.getRoom(roomId);
    if (!room) return;
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;
    player.isReady = !player.isReady;
    broadcastRoomUpdate(room);
  });

  socket.on(events.START_GAME, () => {
    const { roomId, playerId } = socket.data;
    const room = roomStore.getRoom(roomId);
    if (!room) return emitError('Room not found');
    if (room.hostId !== playerId) return emitError('Only the host can start the game');
    const connectedCount = room.players.filter((p) => p.connected).length;
    if (connectedCount < gameConfig.MIN_PLAYERS_TO_START) {
      return emitError(`Need at least ${gameConfig.MIN_PLAYERS_TO_START} players to start`);
    }
    if (room.status !== 'lobby') return emitError('Game already started');
    return gameService.startGame(room);
  });

  socket.on(events.LEAVE_ROOM, () => handleLeave());

  socket.on('disconnect', () => handleLeave(true));

  function handleLeave(isDisconnect = false) {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;
    const room = roomStore.getRoom(roomId);
    if (!room) return;

    if (isDisconnect) {
      // Keep the player in the room for a grace period so they can reconnect
      // (e.g. flaky mobile network) without losing their score/seat.
      roomStore.markDisconnected(roomId, playerId);
    } else {
      roomStore.removePlayer(roomId, playerId);
      socket.leave(roomId);
    }

    const remainingConnected = room.players.filter((p) => p.connected).length;
    if (remainingConnected === 0) {
      gameService.clearRoomTimer(room);
      roomStore.deleteRoom(roomId);
      return;
    }

    if (room.hostId === playerId) {
      const nextHost = room.players.find((p) => p.connected);
      if (nextHost) room.hostId = nextHost.id;
    }

    io.to(roomId).emit(events.PLAYER_LEFT, { playerId });
    broadcastRoomUpdate(room);

    // If the current drawer left mid-round, move the game on immediately
    if (room.status === 'drawing' && room.currentDrawerId === playerId) {
      gameService.clearRoomTimer(room);
      gameService.endRound(room, 'drawer_left');
    }
  }
}

module.exports = { registerRoomManager };
