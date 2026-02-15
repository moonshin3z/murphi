const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getBudget,
  saveBudget,
  getSavingGoals,
  createSavingGoal,
  updateSavingGoal,
  getFinanceSummary
} = require('../controllers/financeController');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// Transactions
router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);
router.put('/transactions/:id', updateTransaction);
router.delete('/transactions/:id', deleteTransaction);

// Budget
router.get('/budget', getBudget);
router.post('/budget', saveBudget);

// Saving Goals
router.get('/savings', getSavingGoals);
router.post('/savings', createSavingGoal);
router.put('/savings/:id', updateSavingGoal);

// Summary
router.get('/summary', getFinanceSummary);

module.exports = router;
