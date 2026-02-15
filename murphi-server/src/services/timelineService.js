const Transaction = require('../models/Transaction');
const StudySession = require('../models/StudySession');
const TaskLog = require('../models/TaskLog');
const Task = require('../models/Task');

/**
 * Obtiene datos del timeline agrupados por día para un mes específico
 */
async function getMonthlyTimeline(userId, year, month) {
  // Usar UTC para consistencia con las fechas guardadas desde el frontend
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1)); // Primer día del siguiente mes

  const [transactions, sessions, taskLogs, tasks] = await Promise.all([
    Transaction.find({
      userId,
      date: { $gte: startDate, $lt: endDate }
    }).sort({ date: 1 }),
    StudySession.find({
      userId,
      date: { $gte: startDate, $lt: endDate }
    }).sort({ date: 1 }),
    TaskLog.find({
      userId,
      startTime: { $gte: startDate, $lt: endDate },
      status: { $in: ['completed', 'active'] }
    }).sort({ startTime: 1 }),
    Task.find({
      userId,
      dueDate: { $gte: startDate, $lt: endDate }
    }).sort({ dueDate: 1 })
  ]);

  // Agrupar por día
  const dayMap = {};
  // Obtener el último día del mes (día 0 del siguiente mes = último día del mes actual)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  // Inicializar todos los días del mes
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    dayMap[dateKey] = {
      date: dateKey,
      day: day,
      expenses: 0,
      fixedExpenses: 0,
      variableExpenses: 0,
      income: 0,
      balance: 0,
      studyMinutes: 0,
      studyHours: 0,
      taskMinutes: 0,
      transactions: [],
      sessions: [],
      taskLogs: [],
      tasks: [],
      score: 0 // Score del día (0-100)
    };
  }

  // Agregar transacciones
  transactions.forEach(t => {
    const dateKey = t.date.toISOString().split('T')[0];
    if (dayMap[dateKey]) {
      const isFixed = t.isFixed || (t.recurring && t.recurring.enabled);
      dayMap[dateKey].transactions.push({
        _id: t._id,
        type: t.type,
        category: t.category,
        amount: t.amount,
        description: t.description,
        isFixed: isFixed
      });

      if (t.type === 'expense') {
        dayMap[dateKey].expenses += t.amount;
        if (isFixed) {
          dayMap[dateKey].fixedExpenses += t.amount;
        } else {
          dayMap[dateKey].variableExpenses += t.amount;
        }
      } else if (t.type === 'income') {
        dayMap[dateKey].income += t.amount;
      }
    }
  });

  // Agregar sesiones de estudio
  sessions.forEach(s => {
    const dateKey = s.date.toISOString().split('T')[0];
    if (dayMap[dateKey]) {
      dayMap[dateKey].sessions.push({
        _id: s._id,
        subject: s.subject,
        duration: s.duration,
        pomodorosCompleted: s.pomodorosCompleted
      });

      dayMap[dateKey].studyMinutes += s.duration;
    }
  });

  // Agregar tareas (completadas y activas)
  taskLogs.forEach(t => {
    const dateKey = t.startTime.toISOString().split('T')[0];
    if (dayMap[dateKey]) {
      dayMap[dateKey].taskLogs.push({
        _id: t._id,
        title: t.title,
        category: t.category,
        duration: t.duration,
        status: t.status // 'completed' o 'active'
      });

      // Solo sumar tiempo de tareas completadas
      if (t.status === 'completed') {
        dayMap[dateKey].taskMinutes += (t.duration / 60); // duration está en segundos
      }
    }
  });

  // Agregar tareas pendientes (por dueDate)
  tasks.forEach(t => {
    const dateKey = t.dueDate.toISOString().split('T')[0];
    if (dayMap[dateKey]) {
      dayMap[dateKey].tasks.push({
        _id: t._id,
        title: t.title,
        subject: t.subject || '',
        priority: t.priority,
        status: t.status,
        estimatedTime: t.estimatedTime || 0
      });
    }
  });

  // Calcular balance y score para cada día
  Object.keys(dayMap).forEach(dateKey => {
    const day = dayMap[dateKey];
    day.balance = day.income - day.expenses;
    day.studyHours = parseFloat((day.studyMinutes / 60).toFixed(1));
    day.taskHours = parseFloat((day.taskMinutes / 60).toFixed(1));

    // Si no hay actividad, el día es neutral (sin score)
    const hasActivity = day.transactions.length > 0 || day.sessions.length > 0 || day.taskLogs.length > 0 || day.tasks.length > 0;
    // Si solo hay gastos fijos y nada más, el día es neutral
    const onlyFixedExpenses = day.transactions.length > 0
      && day.transactions.every(t => t.type === 'expense' && t.isFixed)
      && day.sessions.length === 0 && day.taskLogs.length === 0 && day.tasks.length === 0;

    if (!hasActivity || onlyFixedExpenses) {
      day.score = null;
      day.type = 'neutral';
      return;
    }

    // Calcular score del día (0-100) - Solo para días con actividad
    let score = 50; // Base

    // Productividad total (estudio + tareas)
    const totalProductiveMinutes = day.studyMinutes + day.taskMinutes;

    // Estudio y productividad (hasta +30)
    if (totalProductiveMinutes >= 240) score += 30;      // 4+ horas
    else if (totalProductiveMinutes >= 180) score += 25; // 3+ horas
    else if (totalProductiveMinutes >= 120) score += 20; // 2+ horas
    else if (totalProductiveMinutes >= 60) score += 15;  // 1+ hora
    else if (totalProductiveMinutes > 0) score += 5;     // Algo de productividad

    // Bonus por completar tareas
    if (day.taskLogs.length >= 3) score += 10;
    else if (day.taskLogs.length >= 1) score += 5;

    // Balance financiero (hasta +20)
    // Usar balance sin gastos fijos para evaluar el día
    const balanceSinFijos = day.income - day.variableExpenses;
    if (day.income > 0 && balanceSinFijos > 0) {
      score += 20; // Día con ingreso y balance positivo
    } else if (balanceSinFijos >= 0) {
      score += 10; // Balance neutro o positivo (sin contar fijos)
    } else if (balanceSinFijos > -100) {
      score += 5; // Pequeño déficit en gastos variables
    }
    // Déficit mayor no suma puntos

    // Penalización por gastos excesivos (solo variables, no fijos)
    if (day.variableExpenses > 500) score -= 15;
    else if (day.variableExpenses > 300) score -= 10;
    else if (day.variableExpenses > 200) score -= 5;

    // Bonus por productividad + control financiero (solo gastos variables)
    if (totalProductiveMinutes >= 120 && day.variableExpenses <= 100) {
      score += 10; // Día productivo y controlado
    }

    day.score = Math.max(0, Math.min(100, score));

    // Determinar tipo de día
    // Bueno: 70+, Regular: 40-69, Malo: 0-39
    if (day.score >= 70) {
      day.type = 'good';
    } else if (day.score >= 40) {
      day.type = 'regular';
    } else {
      day.type = 'bad';
    }
  });

  // Calcular estadísticas del mes
  const days = Object.values(dayMap);
  const totalExpenses = days.reduce((sum, d) => sum + d.expenses, 0);
  const totalIncome = days.reduce((sum, d) => sum + d.income, 0);
  const totalStudyHours = days.reduce((sum, d) => sum + d.studyHours, 0);
  const totalTaskHours = days.reduce((sum, d) => sum + (d.taskHours || 0), 0);
  const daysWithActivity = days.filter(d => d.type !== 'neutral').length;
  const goodDays = days.filter(d => d.type === 'good').length;
  const regularDays = days.filter(d => d.type === 'regular').length;
  const badDays = days.filter(d => d.type === 'bad').length;

  // Solo calcular promedio de días con actividad
  const daysWithScore = days.filter(d => d.score !== null);
  const avgScore = daysWithScore.length > 0
    ? daysWithScore.reduce((sum, d) => sum + d.score, 0) / daysWithScore.length
    : 0;

  return {
    year,
    month,
    days: days,
    summary: {
      totalExpenses: totalExpenses.toFixed(2),
      totalIncome: totalIncome.toFixed(2),
      balance: (totalIncome - totalExpenses).toFixed(2),
      totalStudyHours: totalStudyHours.toFixed(1),
      totalTaskHours: totalTaskHours.toFixed(1),
      daysWithActivity,
      goodDays,
      avgScore: avgScore.toFixed(0)
    }
  };
}

/**
 * Obtiene detalles de un día específico
 */
async function getDayDetails(userId, dateString) {
  // Parsear la fecha como UTC para consistencia con getMonthlyTimeline
  const [year, month, day] = dateString.split('-').map(Number);
  const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  const [transactions, sessions, taskLogs, tasks] = await Promise.all([
    Transaction.find({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ date: -1 }),
    StudySession.find({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ date: -1 }),
    TaskLog.find({
      userId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['completed', 'active'] }
    }).sort({ startTime: -1 }),
    Task.find({
      userId,
      dueDate: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ priority: -1 })
  ]);

  const expenses = transactions.filter(t => t.type === 'expense');
  const income = transactions.filter(t => t.type === 'income');

  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const totalStudyMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
  // Solo contar tiempo de tareas completadas
  const completedTasks = taskLogs.filter(t => t.status === 'completed');
  const totalTaskMinutes = completedTasks.reduce((sum, t) => sum + (t.duration / 60), 0);

  return {
    date: dateString,
    transactions,
    sessions,
    taskLogs,
    tasks,
    summary: {
      totalExpenses: totalExpenses.toFixed(2),
      totalIncome: totalIncome.toFixed(2),
      balance: (totalIncome - totalExpenses).toFixed(2),
      studyHours: (totalStudyMinutes / 60).toFixed(1),
      taskHours: (totalTaskMinutes / 60).toFixed(1),
      transactionCount: transactions.length,
      sessionCount: sessions.length,
      taskCount: taskLogs.length,
      pendingTaskCount: tasks.filter(t => t.status !== 'completed').length
    }
  };
}

/**
 * Obtiene las actividades de hoy con timestamps para mostrar en el header visual
 * Devuelve marcadores con la hora en que ocurrieron
 */
async function getTodayActivities(userId) {
  // Usar zona horaria de Guatemala (GMT-6)
  const now = new Date();
  const guatemalaOffset = -6 * 60; // -6 horas en minutos
  const localOffset = now.getTimezoneOffset();
  const diff = guatemalaOffset - localOffset;

  const guatemalaNow = new Date(now.getTime() + diff * 60 * 1000);
  const startOfDay = new Date(guatemalaNow);
  startOfDay.setHours(0, 0, 0, 0);
  startOfDay.setTime(startOfDay.getTime() - diff * 60 * 1000); // Convertir de vuelta a UTC

  const endOfDay = new Date(guatemalaNow);
  endOfDay.setHours(23, 59, 59, 999);
  endOfDay.setTime(endOfDay.getTime() - diff * 60 * 1000); // Convertir de vuelta a UTC

  const [transactions, sessions, taskLogs] = await Promise.all([
    Transaction.find({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ date: 1 }),
    StudySession.find({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ date: 1 }),
    TaskLog.find({
      userId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['completed', 'active'] }
    }).sort({ startTime: 1 })
  ]);

  const activities = [];

  // Agregar transacciones como marcadores
  transactions.forEach(t => {
    const date = new Date(t.date);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timePercent = ((hours * 60 + minutes) / 1440) * 100;

    activities.push({
      id: t._id,
      type: t.type === 'income' ? 'income' : 'expense',
      category: t.category,
      timestamp: t.date,
      timePercent,
      icon: t.type === 'income' ? 'Wallet' : 'CreditCard',
      color: t.type === 'income' ? 'emerald' : 'rose'
    });
  });

  // Agregar sesiones de estudio
  sessions.forEach(s => {
    const date = new Date(s.date);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timePercent = ((hours * 60 + minutes) / 1440) * 100;

    activities.push({
      id: s._id,
      type: 'study',
      category: s.subject,
      duration: s.duration,
      timestamp: s.date,
      timePercent,
      icon: 'BookOpen',
      color: 'blue'
    });
  });

  // Agregar task logs (actividades completadas)
  taskLogs.forEach(t => {
    const date = new Date(t.startTime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timePercent = ((hours * 60 + minutes) / 1440) * 100;

    activities.push({
      id: t._id,
      type: 'task',
      category: t.category,
      title: t.title,
      duration: t.duration,
      status: t.status,
      timestamp: t.startTime,
      timePercent,
      icon: t.status === 'active' ? 'Clock' : 'CheckCircle',
      color: t.status === 'active' ? 'amber' : 'violet'
    });
  });

  // Ordenar por tiempo
  activities.sort((a, b) => a.timePercent - b.timePercent);

  return {
    count: activities.length,
    activities
  };
}

module.exports = { getMonthlyTimeline, getDayDetails, getTodayActivities };
