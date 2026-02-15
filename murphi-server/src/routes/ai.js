const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const {
  predictExpenses,
  getStudySuggestions,
  getCrossInsights,
  getAlerts,
  getAllInsights,
  chat,
  getWeeklyReport,
  getHealthScore,
  getAdvancedInsights,
  getBudgetAllocation,
  getDailyDigest
} = require('../controllers/aiController');

const router = express.Router();

router.use(isAuthenticated);

router.get('/predict-expenses', predictExpenses);
router.get('/study-suggestions', getStudySuggestions);
router.get('/insights', getCrossInsights);
router.get('/alerts', getAlerts);
router.get('/all', getAllInsights);

// Nuevas rutas
router.post('/chat', chat);
router.get('/weekly-report', getWeeklyReport);
router.get('/health-score', getHealthScore);
router.get('/advanced-insights', getAdvancedInsights);
router.get('/budget-allocation', getBudgetAllocation);
router.get('/daily-digest', getDailyDigest);

module.exports = router;
