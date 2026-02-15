const Transaction = require('../models/Transaction');
const StudySession = require('../models/StudySession');
const Task = require('../models/Task');
const Budget = require('../models/Budget');
const SavingGoal = require('../models/SavingGoal');

async function smartChat(userId, message) {
  // Obtener datos del usuario
  const now = new Date();
  // Usar UTC para consistencia con las fechas guardadas
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const startOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()));

  const [transactions, allTransactions, sessions, allSessions, tasks, completedTasks, budget, savingGoals] = await Promise.all([
    Transaction.find({ userId, date: { $gte: startOfMonth } }),
    Transaction.find({ userId }).sort({ date: -1 }).limit(100),
    StudySession.find({ userId, date: { $gte: startOfWeek } }),
    StudySession.find({ userId }).sort({ date: -1 }).limit(50),
    Task.find({ userId, status: { $ne: 'completed' } }),
    Task.find({ userId, status: 'completed' }).sort({ updatedAt: -1 }).limit(20),
    Budget.findOne({ userId }),
    SavingGoal.find({ userId })
  ]);

  // Estadísticas
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalStudyHours = Math.round(sessions.reduce((a, s) => a + s.duration, 0) / 60);
  const totalStudyMinutes = sessions.reduce((a, s) => a + s.duration, 0);

  const expensesByCategory = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
  });

  const incomeByCategory = {};
  transactions.filter(t => t.type === 'income').forEach(t => {
    incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
  });

  const subjectStats = {};
  allSessions.forEach(s => {
    if (!subjectStats[s.subject]) subjectStats[s.subject] = { minutes: 0, sessions: 0 };
    subjectStats[s.subject].minutes += s.duration;
    subjectStats[s.subject].sessions += 1;
  });

  // Normalizar mensaje
  const msg = message.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!]/g, '');

  // === CATEGORÍAS ESPECÍFICAS ===
  const categories = Object.keys(expensesByCategory);
  const mentionedCategory = categories.find(cat => msg.includes(cat.toLowerCase()));

  if (mentionedCategory && msg.match(/gast|cuanto|dinero/)) {
    const amount = expensesByCategory[mentionedCategory];
    return `Este mes has gastado Q${amount.toFixed(2)} en ${mentionedCategory}. ${amount > totalExpenses * 0.3 ? 'Representa más del 30% de tus gastos totales.' : 'Está en un rango razonable.'}`;
  }

  // === MATERIAS ESPECÍFICAS ===
  const subjects = Object.keys(subjectStats);
  const mentionedSubject = subjects.find(subj => msg.includes(subj.toLowerCase()));

  if (mentionedSubject && msg.match(/estudi|tiempo|hora/)) {
    const stats = subjectStats[mentionedSubject];
    const hours = (stats.minutes / 60).toFixed(1);
    return `Has estudiado ${mentionedSubject} por ${hours} horas en ${stats.sessions} sesiones. ${stats.minutes >= 180 ? '¡Excelente!' : 'Considera dedicarle más tiempo.'}`;
  }

  // === GASTOS ===
  if (msg.match(/gast|expense|dinero.*gast|cuanto.*gast/)) {
    const topCategory = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0];

    if (msg.match(/mas|mayor|donde|principal/)) {
      return topCategory
        ? `Tu categoría con más gastos es "${topCategory[0]}" con Q${topCategory[1].toFixed(2)} (${(topCategory[1]/totalExpenses*100).toFixed(0)}% del total).`
        : 'No tienes gastos registrados este mes.';
    }

    if (msg.match(/categoria|desglos|distribu/)) {
      const top3 = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]).slice(0, 3);
      return top3.length > 0
        ? `Tus principales gastos:\n${top3.map(([cat, amt]) => `• ${cat}: Q${amt.toFixed(2)}`).join('\n')}`
        : 'No tienes gastos registrados.';
    }

    return `Este mes has gastado Q${totalExpenses.toFixed(2)}. ${topCategory ? `La mayoría en "${topCategory[0]}" (Q${topCategory[1].toFixed(2)}).` : ''}`;
  }

  // === ESTUDIO ===
  if (msg.match(/estudi|hora|tiempo.*estudi|cuanto.*estudi/)) {
    if (msg.match(/materia|asignatura|que.*estudi|mas.*estudi/)) {
      const topSubject = Object.entries(subjectStats).sort((a, b) => b[1].minutes - a[1].minutes)[0];
      return topSubject
        ? `Tu materia más estudiada es "${topSubject[0]}" con ${(topSubject[1].minutes/60).toFixed(1)} horas en ${topSubject[1].sessions} sesiones.`
        : 'No tienes sesiones de estudio registradas.';
    }

    if (msg.match(/promedio|dia/)) {
      const avgPerDay = totalStudyMinutes / 7;
      return `Estudias en promedio ${Math.round(avgPerDay)} minutos por día. ${avgPerDay >= 120 ? '¡Excelente!' : avgPerDay >= 60 ? 'Buen ritmo.' : 'Intenta aumentar.'}`;
    }

    return `Esta semana has estudiado ${totalStudyHours} horas. ${totalStudyHours >= 20 ? '¡Excelente!' : totalStudyHours >= 10 ? 'Buen trabajo.' : 'Intenta dedicar más tiempo.'}`;
  }

  // === TAREAS ===
  if (msg.match(/tarea|pendiente|hacer|completar|falt/)) {
    if (msg.match(/complet|termin|hice|logr/)) {
      const recent = completedTasks.slice(0, 5);
      return recent.length > 0
        ? `Tareas completadas recientemente:\n${recent.map(t => `• ${t.title}`).join('\n')}`
        : 'No has completado tareas recientemente.';
    }

    if (msg.match(/priorid|urgent|proxim|venc/)) {
      const urgent = tasks.filter(t => t.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 3);
      return urgent.length > 0
        ? `Tareas próximas a vencer:\n${urgent.map(t => `• ${t.title} ${t.dueDate ? `(${new Date(t.dueDate).toLocaleDateString()})` : ''}`).join('\n')}`
        : 'No tienes tareas con fecha próxima.';
    }

    return `Tienes ${tasks.length} tarea${tasks.length !== 1 ? 's' : ''} pendiente${tasks.length !== 1 ? 's' : ''}. ${tasks.length > 5 ? '¡A ponerse al día!' : tasks.length > 0 ? '¡A completarlas!' : '¡Estás al día!'}`;
  }

  // === INGRESOS ===
  if (msg.match(/ingreso|gano|ganado|income|entrada/)) {
    const topIncome = Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1])[0];

    if (msg.match(/fuente|donde|como.*gano|principal/)) {
      return topIncome
        ? `Tu principal fuente de ingresos es "${topIncome[0]}" con Q${topIncome[1].toFixed(2)}.`
        : 'No tienes ingresos registrados este mes.';
    }

    return `Ingresos: Q${totalIncome.toFixed(2)}\nGastos: Q${totalExpenses.toFixed(2)}\nBalance: Q${(totalIncome - totalExpenses).toFixed(2)} ${totalIncome > totalExpenses ? '(positivo)' : '(negativo)'}`;
  }

  // === PRESUPUESTO ===
  if (msg.match(/presupuesto|budget|limite/)) {
    if (budget && budget.amount > 0) {
      const used = (totalExpenses / budget.amount * 100).toFixed(0);
      const remaining = budget.amount - totalExpenses;
      return `Presupuesto: Q${budget.amount}\nUsado: Q${totalExpenses.toFixed(2)} (${used}%)\nDisponible: Q${remaining.toFixed(2)}\n${used >= 100 ? 'Excedido' : used >= 80 ? 'Cerca del límite' : 'Vas bien'}`;
    }
    return 'No tienes presupuesto definido. Créalo en Finanzas.';
  }

  // === AHORRO ===
  if (msg.match(/ahorr|save|guard|sobr/)) {
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome * 100).toFixed(0) : 0;

    if (msg.match(/meta|objetivo/)) {
      const active = savingGoals.filter(g => g.status === 'active');
      if (active.length > 0) {
        return `Metas de ahorro:\n${active.map(g => `• ${g.name}: Q${g.currentAmount}/Q${g.targetAmount} (${(g.currentAmount/g.targetAmount*100).toFixed(0)}%)`).join('\n')}`;
      }
      return 'No tienes metas de ahorro. Créalas en Finanzas.';
    }

    return `${savings >= 0 ? `Has ahorrado Q${savings.toFixed(2)} (${savingsRate}%)` : `Gastaste Q${Math.abs(savings).toFixed(2)} más de lo que ganaste`}. ${savingsRate >= 20 ? '¡Excelente!' : savingsRate >= 10 ? 'Buen ritmo.' : 'Intenta ahorrar más.'}`;
  }

  // === CONSEJOS ===
  if (msg.match(/consejo|recomiend|suger|ayud.*mejor|tip|como.*mejorar/)) {
    const topExpense = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0];
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;

    let advice = 'Consejos:\n';
    if (savingsRate < 10) advice += '• Ahorra al menos 10% de tus ingresos\n';
    if (topExpense && topExpense[1] > totalExpenses * 0.4) advice += `• Reduce gastos en ${topExpense[0]}\n`;
    if (totalStudyHours < 10) advice += '• Dedica 10+ horas semanales al estudio\n';
    if (tasks.length > 5) advice += `• Prioriza tus ${tasks.length} tareas pendientes\n`;

    return advice;
  }

  // === COMPARACIONES ===
  if (msg.match(/compar|diferencia|mes.*pasado|anterior/)) {
    const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const startOfCurrentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const lastMonthTx = allTransactions.filter(t => new Date(t.date) >= lastMonth && new Date(t.date) < startOfCurrentMonth);
    const lastMonthExp = lastMonthTx.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
    const diff = totalExpenses - lastMonthExp;

    if (lastMonthExp > 0) {
      return `Este mes: Q${totalExpenses.toFixed(2)}\nMes pasado: Q${lastMonthExp.toFixed(2)}\n${diff > 0 ? `+Q${diff.toFixed(2)} más` : diff < 0 ? `-Q${Math.abs(diff).toFixed(2)} menos` : 'Igual'}`;
    }
  }

  // === RESUMEN ===
  if (msg.match(/resumen|todo|general|estado|como.*voy/)) {
    return `Tu resumen:\n• Gastos: Q${totalExpenses.toFixed(2)}\n• Ingresos: Q${totalIncome.toFixed(2)}\n• Balance: Q${(totalIncome - totalExpenses).toFixed(2)}\n• Estudio: ${totalStudyHours}h/semana\n• Tareas: ${tasks.length} pendientes\n${totalIncome > totalExpenses ? '¡Vas bien!' : 'Gastas más de lo que ganas.'}`;
  }

  // === SALUDOS ===
  if (msg.match(/^(hola|hi|hello|hey|buenos|buenas)/)) {
    return `¡Hola! Pregúntame:\n"¿Cuánto gasté?"\n"¿En qué gasté más?"\n"¿Cuánto estudié?"\n"¿Qué tareas tengo?"\n"Dame consejos"`;
  }

  if (msg.match(/gracias|thank/)) return '¡De nada! ¿Algo más?';
  if (msg.match(/quien|que.*eres/)) return 'Soy Murphi, tu asistente de finanzas y productividad.';

  // === DEFAULT ===
  return `Resumen rápido:\n• Gastos: Q${totalExpenses.toFixed(2)}\n• Ingresos: Q${totalIncome.toFixed(2)}\n• Estudio: ${totalStudyHours}h\n• Tareas: ${tasks.length}\n\nPreguntas que puedo responder:\n"¿En qué gasté más?"\n"¿Cuánto ahorré?"\n"¿Qué materia estudié más?"\n"Dame consejos"`;
}

module.exports = { smartChat };
