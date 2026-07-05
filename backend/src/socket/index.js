const roomStore = require('../services/roomStore');
const { createGameService } = require('../services/gameService');
const { registerRoomManager } = require('./roomManager');
const { registerCanvasManager } = require('./canvasManager');
const { registerChatManager } = require('./chatManager');
const { registerGameManager } = require('./gameManager');
const events = require('../constants/events');

/**
 * Wires up all socket namespaces/managers onto a single Socket.IO
 * server instance. Each manager owns one concern (rooms, canvas,
 * chat/guessing, game/word-selection) which keeps handlers small and
 * makes it obvious where to add new realtime features.
 */
function initSocket(io) {
  const gameService = createGameService(io);

  io.on('connection', (socket) => {
    socket.data.playerId = null;
    socket.data.roomId = null;

    registerRoomManager(io, socket, gameService);
    registerCanvasManager(io, socket);
    registerChatManager(io, socket, gameService);
    registerGameManager(io, socket, gameService);

    socket.on(events.LIST_PUBLIC_ROOMS, (_payload, ack) => {
      const list = roomStore.listPublicRooms();
      if (typeof ack === 'function') ack({ success: true, data: list });
      else socket.emit(events.PUBLIC_ROOMS_LIST, list);
    });
  });

  return io;
}

module.exports = { initSocket };
