const express = require('express');
const { auth, authorize, boothAuth } = require('../middleware/auth');
const { validateInput, sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// Sync routes will be implemented here
// For now, just a placeholder

router.get('/status', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Sync service is active',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
