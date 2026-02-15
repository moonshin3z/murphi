const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const timelineService = require('../services/timelineService');

const router = express.Router();

router.use(isAuthenticated);

// Obtener timeline del mes
router.get('/month/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const timeline = await timelineService.getMonthlyTimeline(
      req.user._id,
      parseInt(year),
      parseInt(month)
    );
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener detalles de un día
router.get('/day/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const details = await timelineService.getDayDetails(req.user._id, date);
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener actividades de hoy con timestamps para el header visual
router.get('/today-activities', async (req, res) => {
  try {
    const activities = await timelineService.getTodayActivities(req.user._id);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
