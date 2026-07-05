const express = require('express');
const { isDbConnected } = require('../config/database');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptimeSeconds: process.uptime(),
    dbConnected: isDbConnected(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
