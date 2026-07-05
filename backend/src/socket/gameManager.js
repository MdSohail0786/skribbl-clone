const roomStore = require('../services/roomStore');
const events = require('../constants/events');

function registerGameManager(io, socket, gameService) {
  socket.on(events.SELECT_WORD, (payload = {}) => {
    const { roomId, playerId } = socket.data;
    const room = roomStore.getRoom(roomId);
    if (!room) return;
    gameService.chooseWord(room, playerId, payload.word);
  });
}

module.exports = { registerGameManager };
