const roomStore = require('../services/roomStore');
const roomService = require('../services/roomService');

/**
 * REST endpoints exist for: discovering public rooms, checking a room
 * exists before showing a "join" form, and fetching room metadata for
 * share links. The actual join handshake (socket attach) happens over
 * Socket.IO so the player is registered the instant they're connected.
 */

async function createRoom(req, res, next) {
  try {
    const { hostName, isPrivate, settings } = req.body;
    const { room, hostPlayerId } = await roomService.createRoom({ hostName, isPrivate, settings });
    res.status(201).json({
      success: true,
      data: { roomId: room.roomId, hostPlayerId, settings: room.settings, isPrivate: room.isPrivate },
    });
  } catch (err) {
    next(err);
  }
}

async function checkJoinable(req, res, next) {
  try {
    const { roomId } = req.body;
    const room = roomStore.getRoom(roomId.toUpperCase());
    const result = roomService.canJoin(room);
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.reason });
    }
    return res.json({ success: true, data: { roomId: room.roomId } });
  } catch (err) {
    return next(err);
  }
}

function listRooms(req, res, next) {
  try {
    res.json({ success: true, data: roomStore.listPublicRooms() });
  } catch (err) {
    next(err);
  }
}

function getRoomById(req, res, next) {
  try {
    const room = roomStore.getRoom(req.params.id.toUpperCase());
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    return res.json({ success: true, data: roomStore.toPublicState(room) });
  } catch (err) {
    return next(err);
  }
}

function deleteRoom(req, res, next) {
  try {
    const room = roomStore.getRoom(req.params.id.toUpperCase());
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    roomStore.deleteRoom(room.roomId);
    return res.json({ success: true, message: 'Room deleted' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createRoom, checkJoinable, listRooms, getRoomById, deleteRoom };
