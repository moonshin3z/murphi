const Transaction = require('../models/Transaction');
const StudySession = require('../models/StudySession');
const Task = require('../models/Task');
const Budget = require('../models/Budget');

/**
 * Calcula insights avanzados combinando finanzas y productividad
 */
async function getAdvancedInsights(userId) {
  const now = new Date();
  // Usar UTC para consistencia con las fechas guardadas
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  // Para calcular días del mes, usamos hora local ya que es solo para cálculos de display
  const endOfMonthLocal = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysInMonth = endOfMonthLocal.getDate();
  const currentDay = now.getDate();
  const daysRemaining = daysInMonth - currentDay;

  // Obtener datos
  const [transactions, sessions, tasks, budget] = await Promise.all([
    Transaction.find({ userId, date: { $gte: startOfMonth } }).sort({ date: -1 }),
    StudySession.find({ userId, date: { $gte: startOfMonth } }),
    Task.find({ userId, status: { $ne: 'completed' } }),
    Budget.findOne({ userId })
  ]);

  // === DETECTAR DATOS INSUFICIENTES ===
  const hasTransactions = transactions.length > 0;
  const hasSessions = sessions.length > 0;
  const hasIncome = transactions.some(t => t.type === 'income');
  const hasExpenses = transactions.some(t => t.type === 'expense');

  // Usuario nuevo: sin ningún dato
  const isNewUser = !hasTransactions && !hasSessions;

  // Datos insuficientes: tiene algunos datos pero no los necesarios para cálculos útiles
  // Por ejemplo: solo gastos sin ingresos, o muy pocos datos
  const hasInsufficientData = !hasIncome || transactions.length < 2;

  if (isNewUser) {
    return {
      isNewUser: true,
      hasInsufficientData: false,
      survival: null,
      predictions: null,
      correlations: [],
      status: {
        level: 'neutral',
        message: '¡Bienvenido! Comienza agregando tus ingresos y gastos',
        score: null
      },
      current: {
        balance: '0.00',
        expenses: '0.00',
        income: '0.00',
        studyHours: '0.0',
        dailyStudyAverage: '0.0',
        pendingTasks: tasks.length
      },
      advice: [{
        priority: 'info',
        category: 'welcome',
        message: 'Empieza registrando tu ingreso mensual (beca, mesada, etc.)',
        action: 'Ve a Finanzas → Nueva Transacción',
        icon: 'Hand'
      }, {
        priority: 'info',
        category: 'welcome',
        message: 'Registra tus gastos fijos como renta y servicios',
        action: 'Esto te ayudará a calcular tu presupuesto',
        icon: 'Home'
      }]
    };
  }

  // === CÁLCULOS FINANCIEROS ===
  const expenses = transactions.filter(t => t.type === 'expense');
  const income = transactions.filter(t => t.type === 'income');

  // Separar gastos fijos de variables para análisis de patrones
  const fixedExpenses = expenses.filter(t => t.isFixed);
  const variableExpenses = expenses.filter(t => !t.isFixed);

  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalFixedExpenses = fixedExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalVariableExpenses = variableExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalIncome - totalExpenses;

  // Para promedios diarios, usar solo gastos variables (los fijos son puntuales mensuales)
  const dailyAverageExpense = currentDay > 0 ? totalVariableExpenses / currentDay : 0;

  // === MODO ESTUDIANTE FORÁNEO: DÍAS DE SUPERVIVENCIA ===
  // Solo calcular si hay datos suficientes (ingresos registrados y balance positivo)
  let survivalDays = null;
  let dailyBudget = null;
  let survivalStatus = 'neutral';

  if (hasIncome && currentBalance > 0 && dailyAverageExpense > 0) {
    survivalDays = Math.floor(currentBalance / dailyAverageExpense);
    dailyBudget = daysRemaining > 0 ? currentBalance / daysRemaining : 0;

    // Determinar estado
    if (survivalDays < 7) survivalStatus = 'danger';
    else if (survivalDays < 15) survivalStatus = 'warning';
    else survivalStatus = 'optimal';
  } else if (hasIncome && currentBalance > 0) {
    // Tiene ingresos y balance positivo pero sin gastos aún
    survivalDays = daysRemaining;
    dailyBudget = daysRemaining > 0 ? currentBalance / daysRemaining : currentBalance;
    survivalStatus = 'optimal';
  }

  // === PREDICCIONES ===
  // Solo calcular si tenemos datos suficientes
  let projectedEndBalance = null;
  let projectedTotalExpenses = null;
  let willSurviveMonth = null;

  if (hasIncome && dailyAverageExpense > 0) {
    projectedEndBalance = currentBalance - (dailyAverageExpense * daysRemaining);
    projectedTotalExpenses = totalExpenses + (dailyAverageExpense * daysRemaining);
    willSurviveMonth = projectedEndBalance >= 0;
  }

  // === CÁLCULOS DE PRODUCTIVIDAD ===
  const totalStudyMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalStudyHours = totalStudyMinutes / 60;
  const dailyAverageStudy = currentDay > 0 ? totalStudyMinutes / currentDay : 0;
  const dailyAverageStudyHours = dailyAverageStudy / 60;

  // === CORRELACIONES INTELIGENTES ===
  const correlations = await calculateCorrelations(userId, transactions, sessions);

  // === ESTADO GENERAL ===
  let status = 'neutral';
  let statusMessage = '';

  // Si no hay datos suficientes, no calcular estado
  if (hasInsufficientData) {
    status = 'neutral';
    statusMessage = 'Registra tus ingresos para ver predicciones y consejos personalizados';
  } else if (survivalDays !== null && survivalDays < 5) {
    status = 'danger';
    statusMessage = '¡Alerta! Tu situación financiera requiere atención inmediata';
  } else if (projectedEndBalance !== null && projectedEndBalance < 0) {
    status = 'danger';
    statusMessage = '¡Alerta! Proyección negativa para fin de mes';
  } else if ((survivalDays !== null && survivalDays < 10) || dailyAverageStudyHours < 2) {
    status = 'warning';
    statusMessage = 'Ten cuidado, algunos indicadores necesitan mejorar';
  } else if (survivalDays !== null) {
    status = 'optimal';
    statusMessage = '¡Excelente! Vas por buen camino';
  }

  // === CONSEJOS PROACTIVOS ===
  // Solo generar consejos si hay datos suficientes
  const advice = hasInsufficientData
    ? generateInsufficientDataAdvice(hasIncome, hasExpenses, hasSessions)
    : generateProactiveAdvice({
        survivalDays,
        dailyBudget,
        currentBalance,
        dailyAverageStudyHours,
        tasks: tasks.length,
        projectedEndBalance,
        budget: budget?.amount || 0,
        totalExpenses
      });

  // Calcular cuánto necesita ahorrar (solo si tiene sentido)
  let needsToSave = null;
  if (dailyBudget !== null && dailyAverageExpense > dailyBudget && daysRemaining > 0) {
    needsToSave = ((dailyAverageExpense - dailyBudget) * daysRemaining).toFixed(2);
  }

  return {
    isNewUser: false,
    hasInsufficientData,

    // Modo Estudiante Foráneo - null si no hay datos suficientes
    survival: survivalDays !== null ? {
      daysRemaining: survivalDays,
      dailyBudget: dailyBudget !== null ? dailyBudget.toFixed(2) : null,
      currentBalance: currentBalance.toFixed(2),
      status: survivalStatus
    } : null,

    // Predicciones - null si no hay datos suficientes
    predictions: projectedEndBalance !== null ? {
      endMonthBalance: projectedEndBalance.toFixed(2),
      totalExpensesProjected: projectedTotalExpenses.toFixed(2),
      willSurvive: willSurviveMonth,
      needsToSave
    } : null,

    // Correlaciones (requiere suficientes datos)
    correlations: hasInsufficientData ? [] : correlations,

    // Estado general
    status: {
      level: status,
      message: statusMessage,
      score: hasInsufficientData ? null : calculateHealthScore({
        survivalDays: survivalDays || 0,
        dailyAverageStudyHours,
        currentBalance,
        tasks: tasks.length
      })
    },

    // Estadísticas actuales (siempre mostrar)
    current: {
      balance: currentBalance.toFixed(2),
      expenses: totalExpenses.toFixed(2),
      income: totalIncome.toFixed(2),
      studyHours: totalStudyHours.toFixed(1),
      dailyStudyAverage: dailyAverageStudyHours.toFixed(1),
      pendingTasks: tasks.length
    },

    // Consejos proactivos
    advice
  };
}

/**
 * Genera consejos cuando hay datos insuficientes
 */
function generateInsufficientDataAdvice(hasIncome, hasExpenses, hasSessions) {
  const advice = [];

  if (!hasIncome) {
    advice.push({
      priority: 'info',
      category: 'setup',
      message: 'Registra tu ingreso mensual para ver predicciones',
      action: 'Ve a Finanzas → Nuevo Ingreso',
      icon: 'Wallet'
    });
  }

  if (!hasExpenses && hasIncome) {
    advice.push({
      priority: 'info',
      category: 'setup',
      message: 'Registra tus gastos para calcular tu presupuesto diario',
      action: 'Ve a Finanzas → Nuevo Gasto',
      icon: 'FileText'
    });
  }

  if (!hasSessions) {
    advice.push({
      priority: 'info',
      category: 'setup',
      message: 'Registra tus sesiones de estudio para ver estadísticas',
      action: 'Usa el timer Pomodoro o registra manualmente',
      icon: 'BookOpen'
    });
  }

  return advice;
}

/**
 * Calcula correlaciones entre finanzas y productividad
 */
async function calculateCorrelations(userId, transactions, sessions) {
  const correlations = [];

  // Agrupar por día - EXCLUIR gastos fijos para no distorsionar patrones diarios
  // (los gastos fijos como renta/universidad son mensuales, no reflejan comportamiento diario)
  const dayMap = {};

  transactions.forEach(t => {
    const day = t.date.toISOString().split('T')[0];
    if (!dayMap[day]) dayMap[day] = { expenses: 0, study: 0 };
    // Solo contar gastos variables para correlaciones
    if (t.type === 'expense' && !t.isFixed) dayMap[day].expenses += t.amount;
  });

  sessions.forEach(s => {
    const day = s.date.toISOString().split('T')[0];
    if (!dayMap[day]) dayMap[day] = { expenses: 0, study: 0 };
    dayMap[day].study += s.duration;
  });

  const days = Object.values(dayMap);

  if (days.length >= 5) {
    // Días de alto estudio (>240 min = 4h)
    const highStudyDays = days.filter(d => d.study >= 240);
    const avgExpensesHighStudy = highStudyDays.length > 0
      ? highStudyDays.reduce((s, d) => s + d.expenses, 0) / highStudyDays.length
      : 0;

    // Días de bajo estudio (<120 min = 2h)
    const lowStudyDays = days.filter(d => d.study < 120);
    const avgExpensesLowStudy = lowStudyDays.length > 0
      ? lowStudyDays.reduce((s, d) => s + d.expenses, 0) / lowStudyDays.length
      : 0;

    if (highStudyDays.length >= 2 && lowStudyDays.length >= 2) {
      const difference = ((avgExpensesLowStudy - avgExpensesHighStudy) / avgExpensesHighStudy * 100).toFixed(0);

      if (Math.abs(difference) > 15) {
        correlations.push({
          type: 'study_vs_expenses',
          message: difference > 0
            ? `Cuando estudias más de 4h, gastas ${Math.abs(difference)}% menos`
            : `Cuando estudias menos, gastas ${Math.abs(difference)}% más`,
          impact: Math.abs(difference) > 30 ? 'high' : 'medium',
          icon: 'TrendingUp'
        });
      }
    }
  }

  // Correlación: gastos en ocio vs productividad
  const leisureExpenses = transactions.filter(t =>
    t.type === 'expense' &&
    (t.category === 'Ocio' || t.category === 'Entretenimiento')
  );

  if (leisureExpenses.length > 0 && sessions.length > 0) {
    const totalLeisure = leisureExpenses.reduce((s, t) => s + t.amount, 0);
    const totalStudy = sessions.reduce((s, se) => s + se.duration, 0) / 60;

    if (totalLeisure > 500 && totalStudy < 15) {
      correlations.push({
        type: 'leisure_warning',
        message: `Has gastado $${totalLeisure.toFixed(0)} en ocio pero solo ${totalStudy.toFixed(0)}h de estudio`,
        impact: 'high',
        icon: 'AlertTriangle'
      });
    }
  }

  // Mejor día (más estudio + menos gasto)
  if (days.length > 0) {
    const bestDay = days.reduce((best, day) => {
      const score = (day.study / 60) - (day.expenses / 100);
      const bestScore = (best.study / 60) - (best.expenses / 100);
      return score > bestScore ? day : best;
    });

    if (bestDay.study > 120) {
      correlations.push({
        type: 'best_pattern',
        message: `Tu mejor equilibrio: ${(bestDay.study / 60).toFixed(1)}h estudio + $${bestDay.expenses.toFixed(0)} gastos`,
        impact: 'positive',
        icon: 'Star'
      });
    }
  }

  return correlations;
}

/**
 * Genera consejos proactivos basados en la situación actual
 */
function generateProactiveAdvice(data) {
  const advice = [];

  // Consejo financiero urgente (solo si survivalDays es válido)
  if (data.survivalDays !== null && data.survivalDays < 7) {
    const budgetText = data.dailyBudget !== null ? `$${parseFloat(data.dailyBudget).toFixed(0)}` : 'un presupuesto ajustado';
    advice.push({
      priority: 'urgent',
      category: 'finance',
      message: `Solo tienes ${data.survivalDays} días de supervivencia. Reduce gastos inmediatamente.`,
      action: `Establece un presupuesto diario de ${budgetText}`,
      icon: 'AlertCircle'
    });
  } else if (data.survivalDays !== null && data.survivalDays < 15) {
    advice.push({
      priority: 'high',
      category: 'finance',
      message: `Tienes ${data.survivalDays} días de margen financiero.`,
      action: 'Considera reducir gastos no esenciales',
      icon: 'AlertTriangle'
    });
  }

  // Consejo de presupuesto
  if (data.budget > 0 && data.totalExpenses > data.budget * 0.8 && data.dailyBudget !== null) {
    advice.push({
      priority: 'high',
      category: 'budget',
      message: 'Has usado más del 80% de tu presupuesto mensual.',
      action: `Limítate a $${parseFloat(data.dailyBudget).toFixed(0)}/día por el resto del mes`,
      icon: 'Banknote'
    });
  }

  // Consejo de productividad
  if (data.dailyAverageStudyHours < 2) {
    advice.push({
      priority: 'medium',
      category: 'productivity',
      message: `Solo estudias ${data.dailyAverageStudyHours.toFixed(1)}h/día en promedio.`,
      action: 'Intenta alcanzar al menos 3-4 horas diarias',
      icon: 'BookOpen'
    });
  } else if (data.dailyAverageStudyHours >= 4) {
    advice.push({
      priority: 'positive',
      category: 'productivity',
      message: `¡Excelente! Promedias ${data.dailyAverageStudyHours.toFixed(1)}h/día de estudio.`,
      action: 'Mantén este ritmo',
      icon: 'Star'
    });
  }

  // Consejo de tareas
  if (data.tasks > 5) {
    advice.push({
      priority: 'medium',
      category: 'tasks',
      message: `Tienes ${data.tasks} tareas pendientes.`,
      action: 'Prioriza las más urgentes',
      icon: 'ListTodo'
    });
  }

  // Predicción negativa (solo si hay datos válidos)
  if (data.projectedEndBalance !== null && data.projectedEndBalance < 0) {
    const deficit = Math.abs(data.projectedEndBalance).toFixed(0);
    advice.push({
      priority: 'urgent',
      category: 'prediction',
      message: `Proyección: terminarás el mes con -$${deficit}`,
      action: 'Reduce tus gastos diarios para mejorar la proyección',
      icon: 'TrendingDown'
    });
  }

  return advice;
}

/**
 * Calcula un score de salud general (0-100)
 */
function calculateHealthScore(data) {
  let score = 50; // base

  // Supervivencia (30 puntos)
  if (data.survivalDays >= 20) score += 30;
  else if (data.survivalDays >= 15) score += 20;
  else if (data.survivalDays >= 10) score += 10;
  else if (data.survivalDays < 5) score -= 20;

  // Estudio (30 puntos)
  if (data.dailyAverageStudyHours >= 4) score += 30;
  else if (data.dailyAverageStudyHours >= 3) score += 20;
  else if (data.dailyAverageStudyHours >= 2) score += 10;
  else score -= 10;

  // Balance (20 puntos)
  if (data.currentBalance > 1000) score += 20;
  else if (data.currentBalance > 500) score += 10;
  else if (data.currentBalance < 0) score -= 20;

  // Tareas (20 puntos)
  if (data.tasks <= 2) score += 20;
  else if (data.tasks <= 5) score += 10;
  else if (data.tasks > 10) score -= 10;

  return Math.max(0, Math.min(100, score));
}

module.exports = { getAdvancedInsights };
