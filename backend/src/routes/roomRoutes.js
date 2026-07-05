const express = require('express');
const roomController = require('../controllers/roomController');
const { createRoomRules, joinRoomRules, roomIdParamRule } = require('../validators/roomValidators');

const router = express.Router();

router.post('/', createRoomRules, roomController.createRoom);
router.post('/join', joinRoomRules, roomController.checkJoinable);
router.get('/', roomController.listRooms);
router.get('/:id', roomIdParamRule, roomController.getRoomById);
router.delete('/:id', roomIdParamRule, roomController.deleteRoom);

module.exports = router;
