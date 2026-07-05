const roomStore = require('../services/roomStore');
const events = require('../constants/events');
const gameConfig = require('../constants/gameConfig');
const { sanitizeText } = require('../utils/sanitize');

function registerChatManager(io, socket, gameService) {
  socket.on(events.CHAT, (payload = {}) => {
    const { roomId, playerId } = socket.data;
    const room = roomStore.getRoom(roomId);
    if (!room) return;
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    const text = sanitizeText(payload.text, gameConfig.MAX_CHAT_LENGTH);
    if (!text) return;

    // While a round is active and this player hasn't guessed yet (and isn't
    // the drawer), treat their message as a guess attempt instead of open chat.
    if (room.status === 'drawing' && player.id !== room.currentDrawerId && !player.hasGuessedCorrectly) {
      return handleGuess(room, player, text);
    }

    io.to(roomId).emit(events.CHAT_MESSAGE, {
      playerId: player.id,
      playerName: player.name,
      text,
      system: false,
    });
    return undefined;
  });

  socket.on(events.GUESS, (payload = {}) => {
    const { roomId, playerId } = socket.data;
    const room = roomStore.getRoom(roomId);
    if (!room) return;
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;
    const text = sanitizeText(payload.text, gameConfig.MAX_CHAT_LENGTH);
    if (!text) return;
    handleGuess(room, player, text);
  });

  function handleGuess(room, player, text) {
    const result = gameService.handleGuess(room, player, text);

    if (result.correct) {
      // Correct guess: reveal to everyone as a system message, but never
      // leak the guessed word text itself to those still guessing.
      io.to(room.roomId).emit(events.GUESS_RESULT, {
        playerId: player.id,
        playerName: player.name,
        correct: true,
        points: result.points,
      });
      io.to(room.roomId).emit(events.CHAT_MESSAGE, {
        system: true,
        text: `${player.name} guessed the word!`,
      });
      return;
    }

    // Wrong or close guess: only the guesser sees their own attempt + hint,
    // everyone else just doesn't see the word (prevents spoiling it).
    socket.emit(events.GUESS_RESULT, { correct: false, close: result.close });
    io.to(room.roomId).emit(events.CHAT_MESSAGE, {
      playerId: player.id,
      playerName: player.name,
      text,
      system: false,
      guessFeedback: result.close ? 'close' : null,
    });
  }
}

module.exports = { registerChatManager };
