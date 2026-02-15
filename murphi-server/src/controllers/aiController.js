const aiService = require('../services/aiService');
const advancedInsightsService = require('../services/advancedInsights');
const Transaction = require('../models/Transaction');
const StudySession = require('../models/StudySession');
const Task = require('../models/Task');
const Streak = require('../models/Streak');
const Budget = require('../models/Budget');
const SavingGoal = require('../models/SavingGoal');

exports.predictExpenses = async (req, res) => {
  try {
    const result = await aiService.predictExpenses(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStudySuggestions = async (req, res) => {
  try {
    const result = await aiService.getStudySuggestions(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCrossInsights = async (req, res) => {
  try {
    const result = await aiService.getCrossInsights(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const result = await aiService.getAlerts(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Endpoint combinado para el dashboard de insights
exports.getAllInsights = async (req, res) => {
  try {
    const [predictions, suggestions, crossInsights, alerts] = await Promise.all([
      aiService.predictExpenses(req.user._id),
      aiService.getStudySuggestions(req.user._id),
      aiService.getCrossInsights(req.user._id),
      aiService.getAlerts(req.user._id)
    ]);

    res.json({
      predictions,
      suggestions,
      crossInsights,
      alerts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Chat con Murphi (con tool use)
exports.chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }
    const cleanHistory = Array.isArray(history) ? history.slice(-10) : [];
    const result = await aiService.chat(req.user._id, message, cleanHistory);

    // Backward-compatible: si result es string (fallback smartChat), wrappear
    if (typeof result === 'string') {
      return res.json({ response: result, actions: [] });
    }

    res.json({
      response: result.text,
      actions: result.actions || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reporte semanal
exports.getWeeklyReport = async (req, res) => {
  try {
    const report = await aiService.getWeeklyReport(req.user._id);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Score de salud financiera
exports.getHealthScore = async (req, res) => {
  try {
    const score = await aiService.getHealthScore(req.user._id);
    res.json(score);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Insights avanzados (diferenciador de la app)
exports.getAdvancedInsights = async (req, res) => {
  try {
    const insights = await advancedInsightsService.getAdvancedInsights(req.user._id);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Recomendación de distribución de presupuesto
exports.getBudgetAllocation = async (req, res) => {
  try {
    const result = await aiService.getBudgetAllocation(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Daily Digest: streak + daily insight (pool curado + random) + forecast
exports.getDailyDigest = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Rangos de tiempo
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const startOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));

    // Fetch todo en paralelo
    const [
      monthTransactions,
      lastMonthTransactions,
      weekSessions,
      lastWeekSessions,
      monthSessions,
      pendingTasks,
      completedTasksWeek,
      allTasksMonth,
      streak,
      budget,
      savingGoals,
      todayTransactions,
      todaySessions
    ] = await Promise.all([
      Transaction.find({ userId, date: { $gte: startOfMonth } }),
      Transaction.find({ userId, date: { $gte: startOfLastMonth, $lt: startOfMonth } }),
      StudySession.find({ userId, date: { $gte: startOfWeek } }),
      StudySession.find({ userId, date: { $gte: startOfLastWeek, $lt: startOfWeek } }),
      StudySession.find({ userId, date: { $gte: startOfMonth } }),
      Task.find({ userId, status: { $ne: 'completed' } }),
      Task.find({ userId, status: 'completed', updatedAt: { $gte: startOfWeek } }),
      Task.find({ userId, updatedAt: { $gte: startOfMonth } }),
      Streak.findOne({ userId }),
      Budget.findOne({ userId }),
      SavingGoal.find({ userId, status: 'active' }),
      Transaction.find({ userId, date: { $gte: todayStart, $lte: todayEnd } }),
      StudySession.find({ userId, date: { $gte: todayStart, $lte: todayEnd } })
    ]);

    // --- Métricas precalculadas ---
    const monthExpenses = monthTransactions.filter(t => t.type === 'expense');
    const monthIncome = monthTransactions.filter(t => t.type === 'income');
    const totalExpenses = monthExpenses.reduce((s, t) => s + t.amount, 0);
    const totalIncome = monthIncome.reduce((s, t) => s + t.amount, 0);
    const variableExpenses = monthExpenses.filter(t => !t.isFixed);
    const totalVariable = variableExpenses.reduce((s, t) => s + t.amount, 0);
    const totalFixed = totalExpenses - totalVariable;

    const weekExpenses = monthTransactions.filter(t => t.type === 'expense' && new Date(t.date) >= startOfWeek);
    const totalWeekExpenses = weekExpenses.reduce((s, t) => s + t.amount, 0);
    const lastWeekExpenses = monthTransactions.concat(lastMonthTransactions).filter(t => t.type === 'expense' && new Date(t.date) >= startOfLastWeek && new Date(t.date) < startOfWeek);
    const totalLastWeekExpenses = lastWeekExpenses.reduce((s, t) => s + t.amount, 0);

    const weekStudyMin = weekSessions.reduce((s, sess) => s + sess.duration, 0);
    const lastWeekStudyMin = lastWeekSessions.reduce((s, sess) => s + sess.duration, 0);
    const monthStudyMin = monthSessions.reduce((s, sess) => s + sess.duration, 0);

    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const daysElapsed = now.getUTCDate();
    const daysInMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getUTCDate();
    const daysRemaining = daysInMonth - daysElapsed;

    // Categorías
    const catTotals = {};
    monthExpenses.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });
    const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

    // Patrón por día de semana
    const dayExpenses = {};
    const dayCounts = {};
    monthExpenses.filter(t => !t.isFixed).forEach(t => {
      const d = new Date(t.date).getDay();
      dayExpenses[d] = (dayExpenses[d] || 0) + t.amount;
      dayCounts[d] = (dayCounts[d] || 0) + 1;
    });

    // Materias de estudio
    const subjectHours = {};
    monthSessions.forEach(s => { subjectHours[s.subject] = (subjectHours[s.subject] || 0) + s.duration; });
    const topSubject = Object.entries(subjectHours).sort((a, b) => b[1] - a[1])[0];

    // Gastos diarios (para calcular días sin gastar)
    const dailyTotals = {};
    monthExpenses.filter(t => !t.isFixed).forEach(t => {
      const dk = new Date(t.date).toISOString().split('T')[0];
      dailyTotals[dk] = (dailyTotals[dk] || 0) + t.amount;
    });

    // Pomodoros semana
    const weekPomodoros = weekSessions.reduce((s, sess) => s + (sess.pomodorosCompleted || 0), 0);

    // Tareas Canvas
    const canvasTasks = pendingTasks.filter(t => t.source === 'canvas');

    // Today
    const todayExpenseTotal = todayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const todayStudyMin = todaySessions.reduce((s, sess) => s + sess.duration, 0);

    // Gasto más grande del mes
    const biggestExpense = monthExpenses.sort((a, b) => b.amount - a.amount)[0];

    // Días sin gastar (consecutivos hasta hoy)
    let daysNoSpending = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dk = d.toISOString().split('T')[0];
      if (!dailyTotals[dk] || dailyTotals[dk] === 0) {
        daysNoSpending++;
      } else {
        break;
      }
    }

    // Días de estudio de los últimos 7
    const studyDaysSet = new Set();
    weekSessions.forEach(s => studyDaysSet.add(new Date(s.date).toISOString().split('T')[0]));
    const studyDaysCount = studyDaysSet.size;

    // Sesión más larga de la semana
    const longestSession = weekSessions.sort((a, b) => b.duration - a.duration)[0];

    // --- Datos para insights ---
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const urgentTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) <= nextWeek);
    const completedMonth = allTasksMonth.filter(t => t.status === 'completed').length;

    // --- Construir insights candidatos (solo datos significativos) ---
    const insightCandidates = [];

    // Finanzas - comparación semanal
    if (totalLastWeekExpenses > 0 && totalWeekExpenses > 0) {
      const pct = Math.round(((totalWeekExpenses - totalLastWeekExpenses) / totalLastWeekExpenses) * 100);
      if (pct !== 0) {
        insightCandidates.push(`Esta semana ${pct > 0 ? 'gastaste' : 'ahorraste'} ${Math.abs(pct)}% ${pct > 0 ? 'más' : 'menos'} que la semana pasada (Q${Math.round(totalWeekExpenses)} vs Q${Math.round(totalLastWeekExpenses)})`);
      }
    }

    // Categoría dominante
    if (topCategory && totalExpenses > 0) {
      const pct = Math.round((topCategory[1] / totalExpenses) * 100);
      if (pct >= 25) {
        insightCandidates.push(`${topCategory[0]} se lleva el ${pct}% de tus gastos este mes (Q${Math.round(topCategory[1])})`);
      }
    }

    // Gasto más grande
    if (biggestExpense && biggestExpense.amount > 50) {
      insightCandidates.push(`Tu gasto más fuerte del mes: Q${Math.round(biggestExpense.amount)} en ${biggestExpense.category}${biggestExpense.description ? ` (${biggestExpense.description})` : ''}`);
    }

    // Días sin gastar (solo si >= 2)
    if (daysNoSpending >= 2) {
      insightCandidates.push(`Llevas ${daysNoSpending} días seguidos sin gastos variables`);
    }

    // Tasa de ahorro
    if (totalIncome > 0 && totalExpenses > 0) {
      const savingsRate = Math.round(((totalIncome - totalExpenses) / totalIncome) * 100);
      if (savingsRate >= 20) {
        insightCandidates.push(`Estás ahorrando el ${savingsRate}% de tus ingresos este mes`);
      } else if (savingsRate < 0) {
        insightCandidates.push(`Llevas Q${Math.round(totalExpenses - totalIncome)} más de gasto que de ingresos este mes`);
      } else if (savingsRate >= 0 && savingsRate < 10) {
        insightCandidates.push(`Solo estás ahorrando ${savingsRate}% de tus ingresos — la meta ideal es 20%`);
      }
    }

    // Presupuesto
    if (budget && budget.amount > 0) {
      const budgetPct = Math.round((totalExpenses / budget.amount) * 100);
      const monthPct = Math.round((daysElapsed / daysInMonth) * 100);
      if (budgetPct > monthPct + 10) {
        insightCandidates.push(`Vas en el día ${daysElapsed} del mes pero ya usaste ${budgetPct}% de tu presupuesto`);
      } else if (budgetPct < monthPct - 10) {
        insightCandidates.push(`Llevas solo ${budgetPct}% del presupuesto usado al día ${daysElapsed} del mes`);
      }
      if (daysRemaining > 0 && totalExpenses > 0) {
        const dailyBudget = Math.round((budget.amount - totalExpenses) / daysRemaining);
        if (dailyBudget > 0) {
          insightCandidates.push(`Te quedan Q${dailyBudget} por día para el resto del mes sin pasarte del presupuesto`);
        }
      }
    }

    // Patrón por día de semana
    const dayAvgs = Object.entries(dayExpenses).map(([d, total]) => [d, total / (dayCounts[d] || 1)]);
    if (dayAvgs.length >= 3) {
      const sorted = dayAvgs.sort((a, b) => b[1] - a[1]);
      const maxDay = sorted[0];
      const overallAvg = Object.values(dayExpenses).reduce((a, b) => a + b, 0) / dayAvgs.length;
      if (maxDay[1] > overallAvg * 1.3) {
        insightCandidates.push(`Los ${dayNames[maxDay[0]]} gastas en promedio Q${Math.round(maxDay[1])}, más que cualquier otro día`);
      }
    }

    // Estudio - comparación semanal
    if (lastWeekStudyMin > 0 && weekStudyMin > 0) {
      const diff = weekStudyMin - lastWeekStudyMin;
      if (Math.abs(diff) >= 30) {
        insightCandidates.push(`Esta semana estudiaste ${Math.abs(Math.round(diff / 60 * 10) / 10)}h ${diff > 0 ? 'más' : 'menos'} que la anterior`);
      }
    }

    // Materia top
    if (topSubject && topSubject[1] >= 60) {
      insightCandidates.push(`Tu materia más estudiada: ${topSubject[0]} con ${(topSubject[1] / 60).toFixed(1)}h este mes`);
    }

    // Materia descuidada
    const subjects = Object.keys(subjectHours);
    if (subjects.length >= 2) {
      const leastSubject = Object.entries(subjectHours).sort((a, b) => a[1] - b[1])[0];
      if (topSubject && leastSubject[1] < topSubject[1] * 0.3) {
        insightCandidates.push(`${leastSubject[0]} es tu materia menos estudiada — solo ${Math.round(leastSubject[1])} minutos este mes`);
      }
    }

    // Consistencia de estudio
    if (studyDaysCount >= 5) {
      insightCandidates.push(`Estudiaste ${studyDaysCount} de los últimos 7 días — excelente consistencia`);
    } else if (studyDaysCount <= 2 && studyDaysCount > 0) {
      insightCandidates.push(`Solo estudiaste ${studyDaysCount} de los últimos 7 días`);
    }

    // Sesión más larga
    if (longestSession && longestSession.duration >= 45) {
      insightCandidates.push(`Tu sesión más larga esta semana: ${(longestSession.duration / 60).toFixed(1)}h de ${longestSession.subject}`);
    }

    // Pomodoros
    if (weekPomodoros >= 5) {
      insightCandidates.push(`Completaste ${weekPomodoros} pomodoros esta semana`);
    }

    // Tareas
    if (completedTasksWeek.length >= 3) {
      insightCandidates.push(`Completaste ${completedTasksWeek.length} tareas esta semana`);
    }
    if (urgentTasks.length > 0) {
      insightCandidates.push(`Tienes ${urgentTasks.length} tarea${urgentTasks.length > 1 ? 's' : ''} que vence${urgentTasks.length > 1 ? 'n' : ''} esta semana`);
    }
    if (allTasksMonth.length >= 5) {
      const rate = Math.round((completedMonth / allTasksMonth.length) * 100);
      insightCandidates.push(`Tu tasa de completado de tareas este mes: ${rate}%`);
    }

    // Racha
    if (streak && streak.currentStreak >= 3) {
      insightCandidates.push(`Llevas ${streak.currentStreak} días consecutivos siendo productivo`);
    }
    if (streak && streak.longestStreak > streak.currentStreak && (streak.longestStreak - streak.currentStreak) <= 3) {
      insightCandidates.push(`Estás a ${streak.longestStreak - streak.currentStreak} día${(streak.longestStreak - streak.currentStreak) > 1 ? 's' : ''} de romper tu récord de ${streak.longestStreak} días`);
    }

    // Metas de ahorro
    if (savingGoals.length > 0) {
      const goal = savingGoals[0];
      const pct = Math.round((goal.currentAmount / goal.targetAmount) * 100);
      insightCandidates.push(`Llevas ${pct}% de tu meta "${goal.name}" (Q${goal.currentAmount} de Q${goal.targetAmount})`);
    }

    // Ratio fijo/variable
    if (totalExpenses > 0 && totalFixed > 0 && totalVariable > 0) {
      const fixPct = Math.round((totalFixed / totalExpenses) * 100);
      insightCandidates.push(`El ${fixPct}% de tus gastos son fijos y ${100 - fixPct}% variables`);
    }

    // Horas de estudio del mes
    if (monthStudyMin >= 60) {
      insightCandidates.push(`Llevas ${(monthStudyMin / 60).toFixed(1)}h de estudio este mes`);
    }

    // Promedio diario variable
    if (daysElapsed > 3 && totalVariable > 0) {
      insightCandidates.push(`Tu promedio diario de gastos variables: Q${Math.round(totalVariable / daysElapsed)}`);
    }

    // Canvas
    if (canvasTasks.length > 0) {
      insightCandidates.push(`Tienes ${canvasTasks.length} tarea${canvasTasks.length > 1 ? 's' : ''} de Canvas pendiente${canvasTasks.length > 1 ? 's' : ''}`);
    }

    // --- Seleccionar aleatoriamente ---
    let dailyInsight;
    if (insightCandidates.length > 0) {
      const selected = insightCandidates[Math.floor(Math.random() * insightCandidates.length)];
      // Determinar tipo
      const warningKeywords = ['menos', 'solo', 'ya usaste', 'vence', 'más de gasto', 'descuidada'];
      const positiveKeywords = ['ahorrando', 'completaste', 'excelente', 'récord', 'consecutivos', 'ahorraste'];
      const type = warningKeywords.some(k => selected.toLowerCase().includes(k)) ? 'warning' :
                   positiveKeywords.some(k => selected.toLowerCase().includes(k)) ? 'positive' : 'neutral';
      dailyInsight = { text: selected, type };
    } else {
      dailyInsight = { text: 'Registra gastos y sesiones de estudio para ver insights personalizados', type: 'neutral' };
    }

    // --- Forecast ---
    let forecast = null;
    if (daysElapsed > 0 && (totalExpenses > 0 || totalIncome > 0)) {
      const dailyExpenseRate = totalVariable / daysElapsed;
      const projectedVariable = totalVariable + (dailyExpenseRate * daysRemaining);
      const projectedTotal = totalFixed + projectedVariable;
      const projectedBalance = totalIncome - projectedTotal;

      forecast = {
        projectedBalance: Math.round(projectedBalance),
        daysRemaining,
        onTrack: budget ? projectedTotal <= budget.amount : projectedBalance >= 0
      };

      if (budget && budget.amount > 0) {
        forecast.dailyBudgetLeft = Math.round(Math.max(0, budget.amount - totalExpenses) / Math.max(1, daysRemaining));
      }
    }

    res.json({
      streak: streak ? { current: streak.currentStreak, longest: streak.longestStreak } : { current: 0, longest: 0 },
      dailyInsight,
      forecast
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
