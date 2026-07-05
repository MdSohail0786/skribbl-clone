const roomStore = require('./roomStore');
const wordService = require('./wordService');
const events = require('../constants/events');
const gameConfig = require('../constants/gameConfig');
const { normalizeWord, isCloseGuess } = require('../utils/sanitize');

/**
 * GameService owns the turn-based lifecycle: picking the next drawer,
 * offering word choices, running the round timer, revealing hints,
 * scoring guesses, and moving to the next round or ending the game.
 *
 * It is instantiated once per Socket.IO server (see socket/index.js)
 * so it always has `io` available to broadcast to rooms.
 */
function createGameService(io) {
  function broadcastRoom(room, forSocketId = null) {
    // Each player gets a state snapshot tailored to whether they're the drawer
    room.players.forEach((p) => {
      io.to(p.socketId).emit(events.ROOM_UPDATED, roomStore.toPublicState(room, p.id));
    });
  }

  function clearRoomTimer(room) {
    if (room.timer) {
      clearInterval(room.timer);
      room.timer = null;
    }
  }

  function startGame(room) {
    room.drawerOrder = room.players.map((p) => p.id);
    room.drawerIndex = -1;
    room.currentRound = 0;
    room.status = 'choosing_word';
    io.to(room.roomId).emit(events.GAME_STARTED, { totalRounds: room.settings.rounds });
    nextTurn(room);
  }

  async function nextTurn(room) {
    clearRoomTimer(room);
    room.players.forEach((p) => {
      p.isDrawer = false;
      p.hasGuessedCorrectly = false;
    });

    room.drawerIndex += 1;
    if (room.drawerIndex >= room.drawerOrder.length) {
      room.drawerIndex = 0;
      room.currentRound += 1;
    }
    if (room.currentRound === 0) room.currentRound = 1;

    if (room.currentRound > room.settings.rounds) {
      return endGame(room);
    }

    const drawerId = room.drawerOrder[room.drawerIndex];
    const drawer = room.players.find((p) => p.id === drawerId && p.connected);
    if (!drawer) {
      // Skip disconnected players
      return nextTurn(room);
    }

    drawer.isDrawer = true;
    room.currentDrawerId = drawer.id;
    room.currentWord = null;
    room.strokes = [];
    room.hintsRevealed = [];
    room.status = 'choosing_word';

    const options = await wordService.getWordOptions(room.settings.category, room.settings.wordChoices);
    room.wordOptions = options;

    io.to(room.roomId).emit(events.DRAWER_CHANGED, {
      drawerId: drawer.id,
      drawerName: drawer.name,
      round: room.currentRound,
      totalRounds: room.settings.rounds,
    });
    io.to(drawer.socketId).emit(events.WORD_SELECTED, { options });
    broadcastRoom(room);

    // Auto-pick a word if the drawer doesn't choose in time
    let secondsLeft = gameConfig.WORD_REVEAL_TIME_MS / 1000;
    room.timer = setInterval(() => {
      secondsLeft -= 1;
      io.to(room.roomId).emit(events.TIMER_UPDATE, { phase: 'choosing_word', secondsLeft });
      if (secondsLeft <= 0) {
        clearRoomTimer(room);
        const fallbackWord = options[Math.floor(Math.random() * options.length)];
        chooseWord(room, drawer.id, fallbackWord);
      }
    }, 1000);
  }

  function chooseWord(room, playerId, word) {
    if (room.currentDrawerId !== playerId || room.status !== 'choosing_word') return;
    if (!room.wordOptions.includes(word)) {
      [word] = room.wordOptions; // reject invalid choice, use first option
    }
    clearRoomTimer(room);
    room.currentWord = word;
    room.status = 'drawing';
    room.hintsRevealed = Array.from({ length: word.length }, () => null);

    io.to(room.roomId).emit(events.ROUND_STARTED, {
      round: room.currentRound,
      drawTimeSeconds: room.settings.drawTimeSeconds,
      wordLength: word.length,
    });
    broadcastRoom(room);
    runRoundTimer(room);
  }

  function runRoundTimer(room) {
    const total = room.settings.drawTimeSeconds;
    let secondsLeft = total;
    const hintCount = Math.min(gameConfig.HINT_INTERVALS, Math.max(room.currentWord.length - 1, 0));
    const hintTimes = new Set();
    for (let i = 1; i <= hintCount; i += 1) {
      hintTimes.add(Math.floor(total - (i * total) / (hintCount + 1)));
    }

    room.timer = setInterval(() => {
      secondsLeft -= 1;
      io.to(room.roomId).emit(events.TIMER_UPDATE, { phase: 'drawing', secondsLeft });

      if (hintTimes.has(secondsLeft)) {
        revealRandomHint(room);
      }

      const allGuessed = room.players
        .filter((p) => p.connected && p.id !== room.currentDrawerId)
        .every((p) => p.hasGuessedCorrectly);

      if (secondsLeft <= 0 || allGuessed) {
        clearRoomTimer(room);
        endRound(room, secondsLeft <= 0 ? 'timeout' : 'all_guessed');
      }
    }, 1000);
  }

  function revealRandomHint(room) {
    const word = room.currentWord;
    const unrevealedIndexes = room.hintsRevealed
      .map((v, i) => (v === null ? i : -1))
      .filter((i) => i !== -1);
    if (unrevealedIndexes.length <= 1) return; // always keep at least one letter hidden
    const idx = unrevealedIndexes[Math.floor(Math.random() * unrevealedIndexes.length)];
    room.hintsRevealed[idx] = word[idx];
    io.to(room.roomId).emit(events.HINT_UPDATE, { revealedHints: room.hintsRevealed });
  }

  function endRound(room, reason) {
    room.status = 'round_end';
    io.to(room.roomId).emit(events.ROUND_END, {
      reason,
      word: room.currentWord,
      scores: room.players.map((p) => ({ id: p.id, name: p.name, score: p.score })),
    });
    broadcastRoom(room);
    room.timer = setTimeout(() => nextTurn(room), gameConfig.ROUND_END_DELAY_MS);
  }

  function endGame(room) {
    room.status = 'finished';
    clearRoomTimer(room);
    const leaderboard = [...room.players]
      .sort((a, b) => b.score - a.score)
      .map((p) => ({ id: p.id, name: p.name, score: p.score, avatar: p.avatar }));
    io.to(room.roomId).emit(events.GAME_OVER, { leaderboard, winner: leaderboard[0] || null });
    broadcastRoom(room);
  }

  /**
   * Handles a guess. Returns true if it was the correct word (caller
   * uses this to decide whether to broadcast it as a public chat line
   * or keep it hidden from other guessers).
   */
  function handleGuess(room, player, rawGuess) {
    if (room.status !== 'drawing' || !room.currentWord) return { correct: false, close: false };
    if (player.id === room.currentDrawerId || player.hasGuessedCorrectly) {
      return { correct: false, close: false };
    }

    const guess = normalizeWord(rawGuess);
    const target = normalizeWord(room.currentWord);

    if (guess === target) {
      player.hasGuessedCorrectly = true;
      const guessOrder = room.players.filter((p) => p.hasGuessedCorrectly).length;
      const bonus = guessOrder === 1 ? gameConfig.FIRST_GUESS_BONUS : 0;
      const points = gameConfig.BASE_GUESS_POINTS + bonus;
      player.score += points;

      const drawer = room.players.find((p) => p.id === room.currentDrawerId);
      if (drawer) drawer.score += gameConfig.DRAWER_POINTS_PER_CORRECT_GUESSER;

      io.to(room.roomId).emit(events.SCORE_UPDATE, {
        players: room.players.map((p) => ({ id: p.id, score: p.score })),
      });
      return { correct: true, close: false, points };
    }

    return { correct: false, close: isCloseGuess(guess, target) };
  }

  return {
    startGame,
    nextTurn,
    chooseWord,
    handleGuess,
    endRound,
    endGame,
    broadcastRoom,
    clearRoomTimer,
  };
}

module.exports = { createGameService };
