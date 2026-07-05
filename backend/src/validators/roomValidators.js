const { body, param, validationResult } = require('express-validator');
const gameConfig = require('../constants/gameConfig');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array().map((e) => e.msg) });
  }
  return next();
}

const createRoomRules = [
  body('hostName')
    .trim()
    .isLength({ min: 1, max: gameConfig.MAX_PLAYER_NAME_LENGTH })
    .withMessage('Player name is required (max 20 chars)'),
  body('isPrivate').optional().isBoolean(),
  body('settings.maxPlayers').optional().isInt({ min: gameConfig.MIN_ROOM_SIZE, max: gameConfig.MAX_ROOM_SIZE }),
  body('settings.rounds').optional().isInt({ min: 2, max: 10 }),
  body('settings.drawTimeSeconds').optional().isInt({ min: 15, max: 240 }),
  handleValidation,
];

const joinRoomRules = [
  body('roomId').trim().isLength({ min: 4, max: 10 }).withMessage('A valid room code is required'),
  body('playerName')
    .trim()
    .isLength({ min: 1, max: gameConfig.MAX_PLAYER_NAME_LENGTH })
    .withMessage('Player name is required (max 20 chars)'),
  handleValidation,
];

const roomIdParamRule = [
  param('id').trim().isLength({ min: 4, max: 10 }).withMessage('Invalid room id'),
  handleValidation,
];

module.exports = { createRoomRules, joinRoomRules, roomIdParamRule };
