const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getStreak,
  getProductivitySummary,
  // Task Logs (Time Tracking)
  getTaskLogs,
  getActiveTaskLog,
  startTaskLog,
  stopTaskLog,
  cancelTaskLog,
  deleteTaskLog,
  updateTaskLog,
  getTaskLogsSummary,
  createCompletedTaskLog
} = require('../controllers/productivityController');

const router = express.Router();

router.use(isAuthenticated);

// Study Sessions
router.get('/sessions', getSessions);
router.post('/sessions', createSession);
router.put('/sessions/:id', updateSession);
router.delete('/sessions/:id', deleteSession);

// Tasks
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

// Streak
router.get('/streak', getStreak);

// Summary
router.get('/summary', getProductivitySummary);

// Task Logs (Time Tracking)
router.get('/task-logs', getTaskLogs);
router.get('/task-logs/active', getActiveTaskLog);
router.get('/task-logs/summary', getTaskLogsSummary);
router.post('/task-logs/start', startTaskLog);
router.post('/task-logs/completed', createCompletedTaskLog); // Para entrada manual del calendario
router.post('/task-logs/:id/stop', stopTaskLog);
router.post('/task-logs/:id/cancel', cancelTaskLog);
router.put('/task-logs/:id', updateTaskLog);
router.delete('/task-logs/:id', deleteTaskLog);

module.exports = router;
