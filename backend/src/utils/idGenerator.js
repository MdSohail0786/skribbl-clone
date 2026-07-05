const { v4: uuidv4 } = require('uuid');

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity

/** Short, human-shareable room code, e.g. "K7F3QZ". */
function generateRoomCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function generatePlayerId() {
  return uuidv4();
}

module.exports = { generateRoomCode, generatePlayerId };
