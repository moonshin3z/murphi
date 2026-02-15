const Transaction = require('../models/Transaction');
const Task = require('../models/Task');
const Budget = require('../models/Budget');
const SavingGoal = require('../models/SavingGoal');
const StudySession = require('../models/StudySession');
const TaskLog = require('../models/TaskLog');
const Streak = require('../models/Streak');

async function executeTool(toolName, toolInput, userId) {
  try {
    switch (toolName) {
      case 'create_transaction': {
        const transaction = await Transaction.create({
          userId,
          type: toolInput.type,
          category: toolInput.category,
          amount: toolInput.amount,
          description: toolInput.description || '',
          date: toolInput.date ? new Date(toolInput.date + 'T12:00:00Z') : new Date(),
          isFixed: toolInput.isFixed || false
        });
        return {
          success: true,
          data: transaction.toJSON(),
          actionType: 'transaction_created',
          displayData: {
            type: toolInput.type,
            category: toolInput.category,
            amount: toolInput.amount,
            description: toolInput.description || ''
          }
        };
      }

      case 'create_task': {
        const task = await Task.create({
          userId,
          title: toolInput.title,
          subject: toolInput.subject || '',
          dueDate: toolInput.dueDate ? new Date(toolInput.dueDate + 'T23:59:59Z') : undefined,
          priority: toolInput.priority || 'medium',
          estimatedTime: toolInput.estimatedTime || 0
        });
        return {
          success: true,
          data: task.toJSON(),
          actionType: 'task_created',
          displayData: {
            title: toolInput.title,
            priority: toolInput.priority || 'medium',
            dueDate: toolInput.dueDate || null,
            subject: toolInput.subject || ''
          }
        };
      }

      case 'complete_task': {
        const task = await Task.findOne({
          userId,
          title: { $regex: toolInput.title, $options: 'i' },
          status: { $ne: 'completed' }
        });

        if (!task) {
          return {
            success: false,
            error: `No se encontró tarea pendiente con título "${toolInput.title}".`,
            actionType: 'error',
            displayData: null
          };
        }

        task.status = 'completed';
        await task.save();

        return {
          success: true,
          data: task.toJSON(),
          actionType: 'task_completed',
          displayData: {
            title: task.title,
            subject: task.subject || ''
          }
        };
      }

      case 'uncomplete_task': {
        const task = await Task.findOne({
          userId,
          title: { $regex: toolInput.title, $options: 'i' },
          status: 'completed'
        });

        if (!task) {
          return {
            success: false,
            error: `No se encontró tarea completada con título "${toolInput.title}".`,
            actionType: 'error',
            displayData: null
          };
        }

        task.status = 'pending';
        await task.save();

        return {
          success: true,
          data: task.toJSON(),
          actionType: 'task_uncompleted',
          displayData: {
            title: task.title,
            subject: task.subject || ''
          }
        };
      }

      case 'search_transactions': {
        const query = { userId };
        if (toolInput.type) query.type = toolInput.type;
        if (toolInput.category) query.category = toolInput.category;
        if (toolInput.description) {
          query.description = { $regex: toolInput.description, $options: 'i' };
        }

        // Rango de fechas (default: mes actual)
        const now = new Date();
        const defaultStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        if (toolInput.startDate || toolInput.endDate) {
          query.date = {};
          if (toolInput.startDate) query.date.$gte = new Date(toolInput.startDate + 'T00:00:00Z');
          if (toolInput.endDate) query.date.$lte = new Date(toolInput.endDate + 'T23:59:59Z');
        } else {
          query.date = { $gte: defaultStart };
        }

        const sortField = toolInput.sortBy === 'amount' ? 'amount' : 'date';
        const sortOrder = toolInput.sortOrder === 'asc' ? 1 : -1;
        const limit = Math.min(toolInput.limit || 50, 100);

        const transactions = await Transaction.find(query)
          .sort({ [sortField]: sortOrder })
          .limit(limit);

        const total = transactions.reduce((sum, t) => sum + t.amount, 0);

        return {
          success: true,
          data: {
            count: transactions.length,
            total,
            transactions: transactions.map(t => ({
              date: t.date.toISOString().split('T')[0],
              type: t.type,
              category: t.category,
              amount: t.amount,
              description: t.description || '',
              isFixed: t.isFixed || false
            }))
          },
          actionType: 'search_results',
          displayData: null
        };
      }

      case 'update_transaction': {
        const searchQuery = { userId };
        if (toolInput.search.type) searchQuery.type = toolInput.search.type;
        if (toolInput.search.category) searchQuery.category = toolInput.search.category;
        if (toolInput.search.description) {
          searchQuery.description = { $regex: toolInput.search.description, $options: 'i' };
        }
        if (toolInput.search.date) {
          const searchDate = new Date(toolInput.search.date + 'T00:00:00Z');
          const endDate = new Date(toolInput.search.date + 'T23:59:59Z');
          searchQuery.date = { $gte: searchDate, $lte: endDate };
        }

        const transaction = await Transaction.findOne(searchQuery).sort({ date: -1 });

        if (!transaction) {
          return {
            success: false,
            error: 'No se encontró la transacción con esos criterios.',
            actionType: 'error',
            displayData: null
          };
        }

        // Aplicar actualizaciones
        if (toolInput.update.amount !== undefined) transaction.amount = toolInput.update.amount;
        if (toolInput.update.category) transaction.category = toolInput.update.category;
        if (toolInput.update.description !== undefined) transaction.description = toolInput.update.description;
        if (toolInput.update.date) transaction.date = new Date(toolInput.update.date + 'T12:00:00Z');

        await transaction.save();

        return {
          success: true,
          data: transaction.toJSON(),
          actionType: 'transaction_updated',
          displayData: {
            type: transaction.type,
            category: transaction.category,
            amount: transaction.amount,
            description: transaction.description || ''
          }
        };
      }

      case 'delete_transaction': {
        const searchQuery = { userId };
        if (toolInput.type) searchQuery.type = toolInput.type;
        if (toolInput.category) searchQuery.category = toolInput.category;
        if (toolInput.description) {
          searchQuery.description = { $regex: toolInput.description, $options: 'i' };
        }
        if (toolInput.date) {
          const searchDate = new Date(toolInput.date + 'T00:00:00Z');
          const endDate = new Date(toolInput.date + 'T23:59:59Z');
          searchQuery.date = { $gte: searchDate, $lte: endDate };
        }

        const transaction = await Transaction.findOne(searchQuery).sort({ date: -1 });

        if (!transaction) {
          return {
            success: false,
            error: 'No se encontró la transacción con esos criterios.',
            actionType: 'error',
            displayData: null
          };
        }

        const deletedData = {
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          description: transaction.description || ''
        };

        await transaction.deleteOne();

        return {
          success: true,
          data: deletedData,
          actionType: 'transaction_deleted',
          displayData: deletedData
        };
      }

      case 'get_finance_summary': {
        const now = new Date();
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

        const [transactions, budget, activeGoals] = await Promise.all([
          Transaction.find({ userId, date: { $gte: startOfMonth } }),
          Budget.findOne({ userId }),
          SavingGoal.find({ userId, status: 'active' })
        ]);

        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const expensesByCategory = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
          expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });

        return {
          success: true,
          data: {
            income,
            expenses,
            balance: income - expenses,
            expensesByCategory,
            budget: budget ? { amount: budget.amount, used: expenses, percentage: Math.round((expenses / budget.amount) * 100) } : null,
            savingGoals: activeGoals.map(g => ({ name: g.name, current: g.currentAmount, target: g.targetAmount }))
          },
          actionType: 'finance_summary',
          displayData: null
        };
      }

      case 'get_productivity_summary': {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const [weekSessions, pendingTasks, streak] = await Promise.all([
          StudySession.find({ userId, date: { $gte: startOfWeek } }),
          Task.find({ userId, status: { $ne: 'completed' } }),
          Streak.findOne({ userId })
        ]);

        const totalMinutes = weekSessions.reduce((s, sess) => s + sess.duration, 0);
        const totalPomodoros = weekSessions.reduce((s, sess) => s + (sess.pomodorosCompleted || 0), 0);

        const hoursBySubject = {};
        weekSessions.forEach(s => {
          hoursBySubject[s.subject] = (hoursBySubject[s.subject] || 0) + s.duration;
        });

        return {
          success: true,
          data: {
            studyHours: Math.round(totalMinutes / 60 * 10) / 10,
            totalMinutes,
            pomodoros: totalPomodoros,
            sessions: weekSessions.length,
            hoursBySubject,
            pendingTasks: pendingTasks.length,
            tasksList: pendingTasks.slice(0, 5).map(t => ({ title: t.title, priority: t.priority, dueDate: t.dueDate })),
            streak: streak?.currentStreak || 0
          },
          actionType: 'productivity_summary',
          displayData: null
        };
      }

      case 'create_saving_goal': {
        const goal = await SavingGoal.create({
          userId,
          name: toolInput.name,
          targetAmount: toolInput.targetAmount,
          currentAmount: toolInput.currentAmount || 0,
          deadline: toolInput.deadline ? new Date(toolInput.deadline + 'T23:59:59Z') : undefined
        });
        return {
          success: true,
          data: goal.toJSON(),
          actionType: 'saving_goal_created',
          displayData: {
            name: toolInput.name,
            targetAmount: toolInput.targetAmount,
            deadline: toolInput.deadline || null
          }
        };
      }

      case 'set_budget': {
        const budget = await Budget.findOneAndUpdate(
          { userId },
          {
            userId,
            amount: toolInput.amount,
            period: toolInput.period,
            categories: toolInput.categories || [],
            alertThreshold: toolInput.alertThreshold || 80
          },
          { new: true, upsert: true, runValidators: true }
        );
        return {
          success: true,
          data: budget.toJSON(),
          actionType: 'budget_set',
          displayData: {
            amount: toolInput.amount,
            period: toolInput.period
          }
        };
      }

      case 'start_timer': {
        const existingActive = await TaskLog.findOne({ userId, status: 'active' });
        if (existingActive) {
          return {
            success: false,
            error: `Ya tienes un temporizador activo: "${existingActive.title}". Deténlo primero.`,
            actionType: 'timer_error',
            displayData: null
          };
        }

        const taskLog = await TaskLog.create({
          userId,
          title: toolInput.title,
          category: toolInput.category,
          startTime: new Date(),
          status: 'active'
        });
        return {
          success: true,
          data: taskLog.toJSON(),
          actionType: 'timer_started',
          displayData: {
            title: toolInput.title,
            category: toolInput.category
          }
        };
      }

      case 'log_study_session': {
        const session = await StudySession.create({
          userId,
          subject: toolInput.subject,
          duration: toolInput.duration,
          pomodorosCompleted: toolInput.pomodorosCompleted || 0,
          date: new Date()
        });

        // Actualizar streak
        let streak = await Streak.findOne({ userId });
        if (!streak) {
          streak = new Streak({ userId });
        }
        streak.updateStreak();
        await streak.save();

        return {
          success: true,
          data: session.toJSON(),
          actionType: 'study_session_logged',
          displayData: {
            subject: toolInput.subject,
            duration: toolInput.duration,
            pomodorosCompleted: toolInput.pomodorosCompleted || 0
          }
        };
      }

      case 'search_study_sessions': {
        const query = { userId };
        if (toolInput.subject) query.subject = { $regex: toolInput.subject, $options: 'i' };

        const now = new Date();
        const defaultStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        if (toolInput.startDate || toolInput.endDate) {
          query.date = {};
          if (toolInput.startDate) query.date.$gte = new Date(toolInput.startDate + 'T00:00:00Z');
          if (toolInput.endDate) query.date.$lte = new Date(toolInput.endDate + 'T23:59:59Z');
        } else {
          query.date = { $gte: defaultStart };
        }

        const sortField = toolInput.sortBy === 'duration' ? 'duration' : 'date';
        const sortOrder = toolInput.sortOrder === 'asc' ? 1 : -1;
        const limit = Math.min(toolInput.limit || 50, 100);

        const sessions = await StudySession.find(query)
          .sort({ [sortField]: sortOrder })
          .limit(limit);

        return {
          success: true,
          data: {
            count: sessions.length,
            sessions: sessions.map(s => ({
              date: s.date.toISOString().split('T')[0],
              subject: s.subject,
              duration: s.duration,
              pomodorosCompleted: s.pomodorosCompleted || 0
            }))
          },
          actionType: 'search_results',
          displayData: null
        };
      }

      case 'search_tasks': {
        const query = { userId };
        if (toolInput.status) query.status = toolInput.status;
        if (toolInput.priority) query.priority = toolInput.priority;
        if (toolInput.subject) query.subject = { $regex: toolInput.subject, $options: 'i' };

        if (toolInput.startDate || toolInput.endDate) {
          query.dueDate = {};
          if (toolInput.startDate) query.dueDate.$gte = new Date(toolInput.startDate + 'T00:00:00Z');
          if (toolInput.endDate) query.dueDate.$lte = new Date(toolInput.endDate + 'T23:59:59Z');
        }

        const sortMap = { priority: 'priority', createdAt: 'createdAt' };
        const sortField = sortMap[toolInput.sortBy] || 'dueDate';
        const sortOrder = toolInput.sortOrder === 'asc' ? 1 : -1;
        const limit = Math.min(toolInput.limit || 50, 100);

        const tasks = await Task.find(query)
          .sort({ [sortField]: sortOrder })
          .limit(limit);

        return {
          success: true,
          data: {
            count: tasks.length,
            tasks: tasks.map(t => ({
              title: t.title,
              subject: t.subject || '',
              status: t.status,
              priority: t.priority,
              dueDate: t.dueDate ? t.dueDate.toISOString().split('T')[0] : null,
              estimatedTime: t.estimatedTime || 0,
              createdAt: t.createdAt.toISOString().split('T')[0]
            }))
          },
          actionType: 'search_results',
          displayData: null
        };
      }

      default:
        return { success: false, error: `Herramienta desconocida: ${toolName}`, actionType: 'error', displayData: null };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      actionType: 'error',
      displayData: null
    };
  }
}

module.exports = { executeTool };
