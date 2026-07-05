export const EVENTS = {
  // Client -> Server
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  PLAYER_READY: 'player_ready',
  START_GAME: 'start_game',
  SELECT_WORD: 'select_word',
  DRAW_START: 'draw_start',
  DRAW_MOVE: 'draw_move',
  DRAW_END: 'draw_end',
  UNDO: 'undo',
  CLEAR_CANVAS: 'clear_canvas',
  GUESS: 'guess',
  CHAT: 'chat',
  LIST_PUBLIC_ROOMS: 'list_public_rooms',

  // Server -> Client
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  ROOM_UPDATED: 'room_updated',
  GAME_STARTED: 'game_started',
  ROUND_STARTED: 'round_started',
  DRAWER_CHANGED: 'drawer_changed',
  WORD_SELECTED: 'word_selected',
  CANVAS_UPDATE: 'canvas_update',
  CANVAS_UNDO: 'canvas_undo',
  CANVAS_CLEAR: 'canvas_clear',
  CHAT_MESSAGE: 'chat_message',
  GUESS_RESULT: 'guess_result',
  SCORE_UPDATE: 'score_update',
  HINT_UPDATE: 'hint_update',
  TIMER_UPDATE: 'timer_update',
  ROUND_END: 'round_end',
  GAME_OVER: 'game_over',
  PUBLIC_ROOMS_LIST: 'public_rooms_list',
  ERROR: 'error',
};

export const AVATARS = ['🎨', '🙂', '🐱', '🐶', '🦊', '🐸', '🐼', '🦁', '🐵', '🦄', '🐷', '🐧'];

export const BRUSH_COLORS = [
  '#000000', '#ffffff', '#ff5c7a', '#ff9f45', '#ffd23f',
  '#4ade80', '#22d3c8', '#3b82f6', '#7c5cff', '#d946ef',
  '#a16207', '#64748b',
];
