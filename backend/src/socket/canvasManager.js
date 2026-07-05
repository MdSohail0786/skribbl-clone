const roomStore = require('../services/roomStore');
const events = require('../constants/events');

/**
 * Relays drawing strokes to every other player in the room. Only the
 * current drawer's events are accepted, which prevents a malicious or
 * buggy client from painting on everyone else's canvas.
 */
function registerCanvasManager(io, socket) {
  function isCurrentDrawer(room, playerId) {
    return room && room.status === 'drawing' && room.currentDrawerId === playerId;
  }

  socket.on(events.DRAW_START, (stroke) => {
    const { roomId, playerId } = socket.data;
    const room = roomStore.getRoom(roomId);
    if (!isCurrentDrawer(room, playerId)) return;
    room.strokes.push({ type: 'start', ...stroke });
    socket.to(roomId).emit(events.CANVAS_UPDATE, { type: 'start', ...stroke });
  });

  socket.on(events.DRAW_MOVE, (point) => {
    const { roomId, playerId } = socket.data;
    const room = roomStore.getRoom(roomId);
    if (!isCurrentDrawer(room, playerId)) return;
    room.strokes.push({ type: 'move', ...point });
    socket.to(roomId).emit(events.CANVAS_UPDATE, { type: 'move', ...point });
  });

  socket.on(events.DRAW_END, () => {
    const { roomId, playerId } = socket.data;
    const room = roomStore.getRoom(roomId);
    if (!isCurrentDrawer(room, playerId)) return;
    room.strokes.push({ type: 'end' });
    socket.to(roomId).emit(events.CANVAS_UPDATE, { type: 'end' });
  });

  socket.on(events.UNDO, () => {
    const { roomId, playerId } = socket.data;
    const room = roomStore.getRoom(roomId);
    if (!isCurrentDrawer(room, playerId)) return;
    // Pop strokes back to the previous "end" marker
    let lastEndSeen = false;
    while (room.strokes.length) {
      const s = room.strokes.pop();
      if (s.type === 'end') {
        if (lastEndSeen) {
          room.strokes.push(s);
          break;
        }
        lastEndSeen = true;
      }
    }
    io.to(roomId).emit(events.CANVAS_UNDO);
  });

  socket.on(events.CLEAR_CANVAS, () => {
    const { roomId, playerId } = socket.data;
    const room = roomStore.getRoom(roomId);
    if (!isCurrentDrawer(room, playerId)) return;
    room.strokes = [];
    io.to(roomId).emit(events.CANVAS_CLEAR);
  });
}

module.exports = { registerCanvasManager };
