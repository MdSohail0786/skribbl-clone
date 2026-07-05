<<<<<<< HEAD
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
=======
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
>>>>>>> 2544e17cf721543ad040d801d07f7d6f9693884c
import toast from 'react-hot-toast';
import { useSocket } from './SocketContext.jsx';
import { EVENTS } from '../constants/events.js';

const GameContext = createContext(null);

const initialState = {
  room: null,
  playerId: null,
  messages: [],
  wordOptions: null,
  secondsLeft: null,
  timerPhase: null,
  roundResult: null,
  gameOverResult: null,
};

export function GameProvider({ children }) {
  const { socket } = useSocket();
  const [state, setState] = useState(initialState);
  const messageIdRef = useRef(0);

  const pushMessage = useCallback((msg) => {
    messageIdRef.current += 1;
<<<<<<< HEAD
    setState((s) => ({
      ...s,
      messages: [...s.messages.slice(-199), { ...msg, id: messageIdRef.current }],
    }));
=======
    setState((s) => ({ ...s, messages: [...s.messages.slice(-199), { ...msg, id: messageIdRef.current }] }));
>>>>>>> 2544e17cf721543ad040d801d07f7d6f9693884c
  }, []);

  useEffect(() => {
    const onRoomCreated = ({ playerId, room }) => setState((s) => ({ ...s, playerId, room }));
    const onRoomJoined = ({ playerId, room }) => setState((s) => ({ ...s, playerId, room }));
    const onRoomUpdated = (room) => setState((s) => ({ ...s, room }));
    const onPlayerJoined = ({ player }) => toast.success(`${player.name} joined the room`);
    const onPlayerLeft = () => toast(`A player left the room`, { icon: '👋' });

    const onGameStarted = () => {
<<<<<<< HEAD
      setState((s) => ({
        ...s,
        messages: [],
        wordOptions: null,
        roundResult: null,
        gameOverResult: null,
      }));
      toast.success('Game started!');
    };
    const onDrawerChanged = ({ drawerName, round, totalRounds }) => {
      pushMessage({
        system: true,
        text: `Round ${round}/${totalRounds} — ${drawerName} is drawing now`,
      });
    };
    const onWordSelected = ({ options }) =>
      setState((s) => ({ ...s, wordOptions: options, roundResult: null }));
    const onRoundStarted = () => setState((s) => ({ ...s, wordOptions: null, roundResult: null }));
    const onTimerUpdate = ({ phase, secondsLeft }) =>
      setState((s) => ({ ...s, timerPhase: phase, secondsLeft }));
=======
      setState((s) => ({ ...s, messages: [], wordOptions: null, roundResult: null, gameOverResult: null }));
      toast.success('Game started!');
    };
    const onDrawerChanged = ({ drawerName, round, totalRounds }) => {
      pushMessage({ system: true, text: `Round ${round}/${totalRounds} — ${drawerName} is drawing now` });
    };
    const onWordSelected = ({ options }) => setState((s) => ({ ...s, wordOptions: options }));
    const onRoundStarted = () => setState((s) => ({ ...s, wordOptions: null, roundResult: null }));
    const onTimerUpdate = ({ phase, secondsLeft }) => setState((s) => ({ ...s, timerPhase: phase, secondsLeft }));
>>>>>>> 2544e17cf721543ad040d801d07f7d6f9693884c
    const onHintUpdate = ({ revealedHints }) =>
      setState((s) => (s.room ? { ...s, room: { ...s.room, revealedHints } } : s));
    const onGuessResult = (result) => {
      if (result.correct) {
        toast.success(`+${result.points} points!`);
      } else if (result.close) {
        toast('So close!', { icon: '🤏' });
      }
    };
    const onScoreUpdate = ({ players: updated }) =>
      setState((s) => {
        if (!s.room) return s;
        const merged = s.room.players.map((p) => {
          const u = updated.find((x) => x.id === p.id);
          return u ? { ...p, score: u.score } : p;
        });
        return { ...s, room: { ...s.room, players: merged } };
      });
    const onRoundEnd = (payload) => setState((s) => ({ ...s, roundResult: payload }));
    const onGameOver = (payload) => setState((s) => ({ ...s, gameOverResult: payload }));
    const onChatMessage = (msg) => pushMessage(msg);
    const onError = ({ message }) => toast.error(message);

    socket.on(EVENTS.ROOM_CREATED, onRoomCreated);
    socket.on(EVENTS.ROOM_JOINED, onRoomJoined);
    socket.on(EVENTS.ROOM_UPDATED, onRoomUpdated);
    socket.on(EVENTS.PLAYER_JOINED, onPlayerJoined);
    socket.on(EVENTS.PLAYER_LEFT, onPlayerLeft);
    socket.on(EVENTS.GAME_STARTED, onGameStarted);
    socket.on(EVENTS.DRAWER_CHANGED, onDrawerChanged);
    socket.on(EVENTS.WORD_SELECTED, onWordSelected);
    socket.on(EVENTS.ROUND_STARTED, onRoundStarted);
    socket.on(EVENTS.TIMER_UPDATE, onTimerUpdate);
    socket.on(EVENTS.HINT_UPDATE, onHintUpdate);
    socket.on(EVENTS.GUESS_RESULT, onGuessResult);
    socket.on(EVENTS.SCORE_UPDATE, onScoreUpdate);
    socket.on(EVENTS.ROUND_END, onRoundEnd);
    socket.on(EVENTS.GAME_OVER, onGameOver);
    socket.on(EVENTS.CHAT_MESSAGE, onChatMessage);
    socket.on(EVENTS.ERROR, onError);

    return () => {
      socket.off(EVENTS.ROOM_CREATED, onRoomCreated);
      socket.off(EVENTS.ROOM_JOINED, onRoomJoined);
      socket.off(EVENTS.ROOM_UPDATED, onRoomUpdated);
      socket.off(EVENTS.PLAYER_JOINED, onPlayerJoined);
      socket.off(EVENTS.PLAYER_LEFT, onPlayerLeft);
      socket.off(EVENTS.GAME_STARTED, onGameStarted);
      socket.off(EVENTS.DRAWER_CHANGED, onDrawerChanged);
      socket.off(EVENTS.WORD_SELECTED, onWordSelected);
      socket.off(EVENTS.ROUND_STARTED, onRoundStarted);
      socket.off(EVENTS.TIMER_UPDATE, onTimerUpdate);
      socket.off(EVENTS.HINT_UPDATE, onHintUpdate);
      socket.off(EVENTS.GUESS_RESULT, onGuessResult);
      socket.off(EVENTS.SCORE_UPDATE, onScoreUpdate);
      socket.off(EVENTS.ROUND_END, onRoundEnd);
      socket.off(EVENTS.GAME_OVER, onGameOver);
      socket.off(EVENTS.CHAT_MESSAGE, onChatMessage);
      socket.off(EVENTS.ERROR, onError);
    };
  }, [socket, pushMessage]);

  const actions = useMemo(
    () => ({
      createRoom: (payload) =>
        new Promise((resolve) => socket.emit(EVENTS.CREATE_ROOM, payload, (ack) => resolve(ack))),
      joinRoom: (payload) =>
        new Promise((resolve) => socket.emit(EVENTS.JOIN_ROOM, payload, (ack) => resolve(ack))),
      leaveRoom: () => socket.emit(EVENTS.LEAVE_ROOM),
      toggleReady: () => socket.emit(EVENTS.PLAYER_READY),
      startGame: () => socket.emit(EVENTS.START_GAME),
      selectWord: (word) => socket.emit(EVENTS.SELECT_WORD, { word }),
      sendChat: (text) => socket.emit(EVENTS.CHAT, { text }),
      sendGuess: (text) => socket.emit(EVENTS.GUESS, { text }),
      drawStart: (stroke) => socket.emit(EVENTS.DRAW_START, stroke),
      drawMove: (point) => socket.emit(EVENTS.DRAW_MOVE, point),
      drawEnd: () => socket.emit(EVENTS.DRAW_END),
      undo: () => socket.emit(EVENTS.UNDO),
      clearCanvas: () => socket.emit(EVENTS.CLEAR_CANVAS),
      listPublicRooms: () =>
<<<<<<< HEAD
        new Promise((resolve) =>
          socket.emit(EVENTS.LIST_PUBLIC_ROOMS, {}, (ack) => resolve(ack?.data || []))
        ),
=======
        new Promise((resolve) => socket.emit(EVENTS.LIST_PUBLIC_ROOMS, {}, (ack) => resolve(ack?.data || []))),
>>>>>>> 2544e17cf721543ad040d801d07f7d6f9693884c
      resetGameState: () => setState(initialState),
    }),
    [socket]
  );

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
