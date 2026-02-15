const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingGoal = require('../models/SavingGoal');

// ============ TRANSACTIONS ============

exports.getTransactions = async (req, res) => {
  try {
    const { startDate, endDate, category, type } = req.query;
    const query = { userId: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (category) query.category = category;
    if (type) query.type = type;

    const transactions = await Transaction.find(query).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.create({
      ...req.body,
      userId: req.user._id
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    res.json({ message: 'Transacción eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ BUDGET ============

exports.getBudget = async (req, res) => {
  try {
    let budget = await Budget.findOne({ userId: req.user._id });
    if (!budget) {
      budget = { amount: 0, categories: [], alertThreshold: 80, period: 'monthly' };
    }
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id },
      { ...req.body, userId: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(budget);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ============ SAVING GOALS ============

exports.getSavingGoals = async (req, res) => {
  try {
    const goals = await SavingGoal.find({
      userId: req.user._id,
      status: { $ne: 'cancelled' }
    }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSavingGoal = async (req, res) => {
  try {
    const goal = await SavingGoal.create({
      ...req.body,
      userId: req.user._id
    });
    res.status(201).json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateSavingGoal = async (req, res) => {
  try {
    const goal = await SavingGoal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!goal) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }

    // Auto-completar si se alcanza el objetivo
    if (goal.currentAmount >= goal.targetAmount && goal.status === 'active') {
      goal.status = 'completed';
      await goal.save();
    }

    res.json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ============ SUMMARY ============

exports.getFinanceSummary = async (req, res) => {
  try {
    const now = new Date();
    // Usar UTC para consistencia con las fechas guardadas desde el frontend
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const startOfNextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    // Transacciones del mes actual
    const transactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: startOfMonth, $lt: startOfNextMonth }
    });

    // Calcular totales
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Gastos por categoría
    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    // Presupuesto
    const budget = await Budget.findOne({ userId: req.user._id });
    const budgetUsed = budget ? (expenses / budget.amount) * 100 : 0;

    // Metas activas
    const activeGoals = await SavingGoal.find({
      userId: req.user._id,
      status: 'active'
    });

    res.json({
      month: {
        income,
        expenses,
        balance: income - expenses,
        expensesByCategory
      },
      budget: {
        total: budget?.amount || 0,
        used: expenses,
        percentage: Math.round(budgetUsed),
        alertThreshold: budget?.alertThreshold || 80
      },
      savingGoals: {
        active: activeGoals.length,
        totalTarget: activeGoals.reduce((sum, g) => sum + g.targetAmount, 0),
        totalSaved: activeGoals.reduce((sum, g) => sum + g.currentAmount, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
