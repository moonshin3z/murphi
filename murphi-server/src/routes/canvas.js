const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const {
  connectCanvas,
  disconnectCanvas,
  syncCanvas,
  getCanvasStatus
} = require('../controllers/canvasController');

const router = express.Router();

router.use(isAuthenticated);

router.post('/connect', connectCanvas);
router.post('/disconnect', disconnectCanvas);
router.post('/sync', syncCanvas);
router.get('/status', getCanvasStatus);

module.exports = router;
