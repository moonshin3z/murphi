const { generateText, chat: claudeChat, chatWithTools } = require('../config/claude');
const { smartChat } = require('./smartChat');
const TOOL_DEFINITIONS = require('./toolDefinitions');
const { executeTool } = require('./toolExecutor');
const Transaction = require('../models/Transaction');
const StudySession = require('../models/StudySession');
const Task = require('../models/Task');
const Budget = require('../models/Budget');
const SavingGoal = require('../models/SavingGoal');

class AIService {
  // Predecir gastos del mes basado en historial
  async predictExpenses(userId) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const transactions = await Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: threeMonthsAgo }
    });

    if (transactions.length < 5) {
      return {
        prediction: null,
        message: 'Necesitas al menos 5 transacciones para hacer predicciones'
      };
    }

    // Agrupar por categoría y calcular promedios
    const categoryStats = {};
    transactions.forEach(t => {
      if (!categoryStats[t.category]) {
        categoryStats[t.category] = { total: 0, count: 0, isFixed: t.isFixed };
      }
      categoryStats[t.category].total += t.amount;
      categoryStats[t.category].count += 1;
    });

    // Calcular promedio mensual por categoría
    const monthlyAverages = {};
    let totalPredicted = 0;
    Object.entries(categoryStats).forEach(([category, stats]) => {
      const monthlyAvg = (stats.total / 3); // 3 meses
      monthlyAverages[category] = {
        average: Math.round(monthlyAvg),
        isFixed: stats.isFixed
      };
      totalPredicted += monthlyAvg;
    });

    // Obtener presupuesto
    const budget = await Budget.findOne({ userId });
    const budgetAmount = budget?.amount || 0;

    // Usar Gemini para análisis
    let aiInsight = null;
    const prompt = `Analiza estos gastos mensuales de un estudiante y da consejos breves (máximo 3 oraciones):
    Gastos por categoría: ${JSON.stringify(monthlyAverages)}
    Total estimado: $${Math.round(totalPredicted)}
    Presupuesto: $${budgetAmount}

    Responde en español, sé directo y útil.`;

    aiInsight = await generateText(prompt);

    return {
      prediction: {
        total: Math.round(totalPredicted),
        byCategory: monthlyAverages,
        vsbudget: budgetAmount > 0 ? Math.round((totalPredicted / budgetAmount) * 100) : null
      },
      aiInsight,
      message: budgetAmount > 0 && totalPredicted > budgetAmount
        ? 'Se proyecta que excederás tu presupuesto'
        : 'Vas bien con tu presupuesto'
    };
  }

  // Sugerencias de estudio basadas en patrones
  async getStudySuggestions(userId) {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const sessions = await StudySession.find({
      userId,
      date: { $gte: twoWeeksAgo }
    });

    const pendingTasks = await Task.find({
      userId,
      status: { $ne: 'completed' }
    }).sort({ dueDate: 1 });

    if (sessions.length < 3) {
      return {
        suggestions: [],
        message: 'Registra más sesiones de estudio para obtener sugerencias personalizadas'
      };
    }

    // Analizar patrones por día de la semana
    const dayStats = {};
    sessions.forEach(s => {
      const day = new Date(s.date).getDay();
      if (!dayStats[day]) {
        dayStats[day] = { totalMinutes: 0, sessions: 0 };
      }
      dayStats[day].totalMinutes += s.duration;
      dayStats[day].sessions += 1;
    });

    // Encontrar días más productivos
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const productiveDays = Object.entries(dayStats)
      .sort((a, b) => b[1].totalMinutes - a[1].totalMinutes)
      .slice(0, 3)
      .map(([day]) => dayNames[day]);

    // Materias más estudiadas vs menos estudiadas
    const subjectStats = {};
    sessions.forEach(s => {
      if (!subjectStats[s.subject]) {
        subjectStats[s.subject] = 0;
      }
      subjectStats[s.subject] += s.duration;
    });

    // Tareas urgentes
    const urgentTasks = pendingTasks
      .filter(t => t.dueDate && new Date(t.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      .slice(0, 3);

    const suggestions = [];

    // Sugerencia de días
    suggestions.push({
      type: 'schedule',
      title: 'Tus días más productivos',
      description: `Aprovecha ${productiveDays.join(', ')} - son cuando mejor rindes`,
      icon: 'Calendar'
    });

    // Sugerencia de tareas urgentes
    if (urgentTasks.length > 0) {
      suggestions.push({
        type: 'urgent',
        title: 'Tareas próximas a vencer',
        description: `Tienes ${urgentTasks.length} tarea(s) para esta semana: ${urgentTasks.map(t => t.title).join(', ')}`,
        icon: 'AlertTriangle'
      });
    }

    // Sugerencia de balance de materias
    const subjects = Object.entries(subjectStats);
    if (subjects.length > 1) {
      const leastStudied = subjects.sort((a, b) => a[1] - b[1])[0];
      suggestions.push({
        type: 'balance',
        title: 'Equilibra tu estudio',
        description: `Considera dedicar más tiempo a "${leastStudied[0]}" - es tu materia menos estudiada`,
        icon: 'Scale'
      });
    }

    // Usar Gemini para sugerencia personalizada
    if (sessions.length >= 5) {
      const prompt = `Como tutor, da UNA sugerencia breve (máximo 2 oraciones) para este estudiante:
      - Estudia principalmente: ${Object.keys(subjectStats).join(', ')}
      - Horas totales últimas 2 semanas: ${Math.round(sessions.reduce((a, s) => a + s.duration, 0) / 60)}
      - Tareas pendientes: ${pendingTasks.length}

      Responde en español, sé motivador pero realista.`;

      const aiSuggestion = await generateText(prompt);

      if (aiSuggestion) {
        suggestions.push({
          type: 'ai',
          title: 'Consejo de Murphi',
          description: aiSuggestion,
          icon: 'Brain'
        });
      }
    }

    return { suggestions };
  }

  // Insights cruzados: correlación entre finanzas y productividad
  async getCrossInsights(userId) {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const [transactions, sessions] = await Promise.all([
      Transaction.find({ userId, date: { $gte: oneMonthAgo } }),
      StudySession.find({ userId, date: { $gte: oneMonthAgo } })
    ]);

    if (transactions.length < 10 || sessions.length < 5) {
      return {
        insights: [],
        message: 'Necesitas más datos para ver correlaciones'
      };
    }

    const insights = [];

    // Agrupar por día - EXCLUIR gastos fijos para no distorsionar patrones diarios
    const dailyData = {};

    transactions.forEach(t => {
      // Solo contar gastos variables para análisis de patrones diarios
      // Los gastos fijos (renta, universidad) son mensuales y no reflejan comportamiento diario
      if (t.isFixed) return;

      const day = new Date(t.date).toISOString().split('T')[0];
      if (!dailyData[day]) dailyData[day] = { expenses: 0, studyMinutes: 0, ocioExpense: 0 };
      dailyData[day].expenses += t.amount;
      if (t.category === 'Ocio' || t.category === 'Comida') {
        dailyData[day].ocioExpense += t.amount;
      }
    });

    sessions.forEach(s => {
      const day = new Date(s.date).toISOString().split('T')[0];
      if (!dailyData[day]) dailyData[day] = { expenses: 0, studyMinutes: 0, ocioExpense: 0 };
      dailyData[day].studyMinutes += s.duration;
    });

    // Analizar correlaciones
    const days = Object.values(dailyData);
    const productiveDays = days.filter(d => d.studyMinutes >= 60);
    const unproductiveDays = days.filter(d => d.studyMinutes < 30);

    if (productiveDays.length > 0 && unproductiveDays.length > 0) {
      const avgExpenseProductive = productiveDays.reduce((a, d) => a + d.ocioExpense, 0) / productiveDays.length;
      const avgExpenseUnproductive = unproductiveDays.reduce((a, d) => a + d.ocioExpense, 0) / unproductiveDays.length;

      if (avgExpenseUnproductive > avgExpenseProductive * 1.3) {
        insights.push({
          type: 'correlation',
          title: 'Patrón detectado',
          description: `Los días que estudias menos, gastas ${Math.round(((avgExpenseUnproductive / avgExpenseProductive) - 1) * 100)}% más en ocio y comida`,
          icon: 'TrendingUp',
          sentiment: 'warning'
        });
      } else {
        insights.push({
          type: 'correlation',
          title: 'Buen balance',
          description: 'Tu productividad y gastos están equilibrados',
          icon: 'CheckCircle',
          sentiment: 'positive'
        });
      }
    }

    // Gasto promedio en días de estudio intensivo
    const intensiveDays = days.filter(d => d.studyMinutes >= 120);
    if (intensiveDays.length >= 3) {
      const avgExpenseIntensive = intensiveDays.reduce((a, d) => a + d.expenses, 0) / intensiveDays.length;
      insights.push({
        type: 'pattern',
        title: 'Días de estudio intensivo',
        description: `Cuando estudias 2+ horas, gastas en promedio $${Math.round(avgExpenseIntensive)} al día`,
        icon: 'BookOpen',
        sentiment: 'neutral'
      });
    }

    // Usar Gemini para insight personalizado
    if (insights.length > 0) {
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
      const totalStudyHours = Math.round(sessions.reduce((a, s) => a + s.duration, 0) / 60);

      const prompt = `Como asistente financiero y académico, da UN insight breve (máximo 2 oraciones) para este estudiante del último mes:
      - Gastos totales: $${totalExpenses}
      - Horas de estudio: ${totalStudyHours}
      - Patrón: ${insights[0]?.description || 'Sin patrón claro'}

      Responde en español con un consejo accionable.`;

      const aiInsight = await generateText(prompt);

      if (aiInsight) {
        insights.push({
          type: 'ai',
          title: 'Análisis de Murphi',
          description: aiInsight,
          icon: 'Brain',
          sentiment: 'neutral'
        });
      }
    }

    return { insights };
  }

  // Alertas inteligentes
  async getAlerts(userId) {
    const alerts = [];

    // Verificar presupuesto
    const now = new Date();
    // Usar UTC para consistencia con las fechas guardadas
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const [budget, monthExpenses, pendingTasks] = await Promise.all([
      Budget.findOne({ userId }),
      Transaction.find({
        userId,
        type: 'expense',
        date: { $gte: startOfMonth }
      }),
      Task.find({
        userId,
        status: { $ne: 'completed' },
        dueDate: { $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }
      })
    ]);

    const totalExpenses = monthExpenses.reduce((a, t) => a + t.amount, 0);

    // Alerta de presupuesto
    if (budget && budget.amount > 0) {
      const percentage = (totalExpenses / budget.amount) * 100;
      if (percentage >= 100) {
        alerts.push({
          type: 'budget',
          severity: 'critical',
          title: '¡Presupuesto excedido!',
          description: `Has gastado $${totalExpenses} de $${budget.amount}`,
          icon: 'AlertCircle'
        });
      } else if (percentage >= budget.alertThreshold) {
        alerts.push({
          type: 'budget',
          severity: 'warning',
          title: 'Cerca del límite',
          description: `Has usado el ${Math.round(percentage)}% de tu presupuesto`,
          icon: 'AlertTriangle'
        });
      }
    }

    // Alertas de tareas urgentes
    if (pendingTasks.length > 0) {
      const overdue = pendingTasks.filter(t => new Date(t.dueDate) < now);
      const upcoming = pendingTasks.filter(t => new Date(t.dueDate) >= now);

      if (overdue.length > 0) {
        alerts.push({
          type: 'task',
          severity: 'critical',
          title: 'Tareas vencidas',
          description: `Tienes ${overdue.length} tarea(s) pasadas de fecha`,
          icon: 'XCircle'
        });
      }

      if (upcoming.length > 0) {
        alerts.push({
          type: 'task',
          severity: 'warning',
          title: 'Entregas próximas',
          description: `${upcoming.length} tarea(s) vencen en los próximos 3 días`,
          icon: 'Calendar'
        });
      }
    }

    return { alerts };
  }

  // Chat conversacional con Murphi usando Claude + Tool Use
  async chat(userId, message, history = []) {
    // Obtener datos del usuario para dar contexto a Claude
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const startOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()));

    const [transactions, sessions, tasks, budget, savingGoals] = await Promise.all([
      Transaction.find({ userId, date: { $gte: startOfMonth } }),
      StudySession.find({ userId, date: { $gte: startOfWeek } }),
      Task.find({ userId, status: { $ne: 'completed' } }),
      Budget.findOne({ userId }),
      SavingGoal.find({ userId, status: 'active' })
    ]);

    const expenses = transactions.filter(t => t.type === 'expense');
    const income = transactions.filter(t => t.type === 'income');
    const totalExpenses = expenses.reduce((a, t) => a + t.amount, 0);
    const totalIncome = income.reduce((a, t) => a + t.amount, 0);
    const totalStudyMinutes = sessions.reduce((a, s) => a + s.duration, 0);

    const expensesByCategory = {};
    expenses.forEach(t => {
      if (!expensesByCategory[t.category]) expensesByCategory[t.category] = { total: 0, fixed: 0 };
      expensesByCategory[t.category].total += t.amount;
      if (t.isFixed || (t.recurring && t.recurring.enabled)) expensesByCategory[t.category].fixed += t.amount;
    });

    const todayStr = now.toISOString().split('T')[0];

    const systemPrompt = `Eres Murphi, un asistente financiero y de productividad para estudiantes. Respondes en español, eres conciso, directo y amigable. No uses emojis excesivos. Máximo 3-4 oraciones por respuesta a menos que el usuario pida algo detallado.

FECHA DE HOY: ${todayStr}

DATOS DEL USUARIO ESTE MES:
- Gastos totales: $${totalExpenses.toFixed(2)}
- Ingresos totales: $${totalIncome.toFixed(2)}
- Balance: $${(totalIncome - totalExpenses).toFixed(2)}
- Gastos por categoría: ${JSON.stringify(Object.entries(expensesByCategory).map(([cat, data]) => `${cat}: $${data.total.toFixed(2)}${data.fixed > 0 ? ` (fijo: $${data.fixed.toFixed(2)})` : ''}`))}
- Presupuesto mensual: ${budget?.amount ? `$${budget.amount}` : 'No definido'}
- Horas de estudio esta semana: ${(totalStudyMinutes / 60).toFixed(1)}
- Tareas pendientes: ${tasks.length}${tasks.length > 0 ? ` (${tasks.slice(0, 3).map(t => t.title).join(', ')}${tasks.length > 3 ? '...' : ''})` : ''}
- Metas de ahorro activas: ${savingGoals.length > 0 ? savingGoals.map(g => `${g.name}: $${g.currentAmount}/$${g.targetAmount}`).join(', ') : 'Ninguna'}

HERRAMIENTAS:
Tienes herramientas para ejecutar acciones reales. Úsalas cuando el usuario quiera:
- Registrar gasto/ingreso → create_transaction
- Editar gasto/ingreso → update_transaction (cuando el usuario quiera cambiar monto, categoría o descripción de una transacción existente)
- Eliminar gasto/ingreso → delete_transaction (cuando el usuario quiera borrar una transacción)
- Crear tarea → create_task
- Completar tarea → complete_task (cuando el usuario diga que ya terminó o completó una tarea)
- Descompletar tarea → uncomplete_task (cuando el usuario quiera reabrir o desmarcar una tarea completada)
- Crear meta de ahorro → create_saving_goal
- Definir presupuesto → set_budget
- Iniciar temporizador → start_timer
- Registrar sesión de estudio → log_study_session
- Buscar transacciones → search_transactions (soporta filtro por description para buscar texto en descripciones, ej: "amigos", "uber", "almuerzo". Devuelve total sumado. Úsala para preguntas como "cuánto gasté en salidas con amigos", "cuánto he gastado en uber", "mis gastos de comida rápida", etc.)
- Buscar sesiones de estudio → search_study_sessions (para preguntas como "qué día estudié más", "cuánto estudié de cálculo", "mi sesión más larga", etc.)
- Buscar tareas → search_tasks (para preguntas como "qué tareas tengo de alta prioridad", "tareas vencidas", "tareas de matemáticas", etc.)
- Ver datos financieros agregados → get_finance_summary (SOLO si necesitas más datos de los que ya tienes arriba)
- Ver datos de productividad detallados → get_productivity_summary (SOLO si necesitas más datos)

REGLAS:
- Para preguntas simples ("cuánto gasté?"), usa los DATOS de arriba directamente. NO llames get_finance_summary.
- Solo usa get_finance_summary o get_productivity_summary si necesitas datos que NO están en tu contexto.
- Cuando el usuario pregunte por gastos específicos como "cuánto gasté en salidas con amigos", "gastos de uber", "comida rápida", usa search_transactions con el campo description para buscar en las descripciones. Puedes combinar con category si aplica. Usa el campo total de la respuesta para dar el monto total.
- Cuando registres algo, confirma brevemente lo que hiciste.
- Infiere categoría y tipo cuando sea obvio (ej: "compré comida" → expense, Comida).
- Si falta información crítica (monto, título), pregunta al usuario.
- Responde SIEMPRE en español.`;

    // Intentar usar Claude con tool use (incluir historial de conversación)
    let messages = [
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];
    const actions = [];

    let response = await chatWithTools(systemPrompt, messages, TOOL_DEFINITIONS);

    // Fallback a smartChat si Claude no está disponible
    if (!response) {
      const fallback = await smartChat(userId, message);
      return { text: fallback, actions: [] };
    }

    // Tool use loop (máx 3 iteraciones)
    let iterations = 0;
    const MAX_ITERATIONS = 3;

    while (response.stop_reason === 'tool_use' && iterations < MAX_ITERATIONS) {
      iterations++;

      const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');
      if (toolUseBlocks.length === 0) break;

      // Agregar respuesta del asistente al historial
      messages.push({ role: 'assistant', content: response.content });

      // Ejecutar cada herramienta
      const toolResults = [];
      for (const toolUse of toolUseBlocks) {
        const result = await executeTool(toolUse.name, toolUse.input, userId);
        actions.push(result);

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result.success ? result.data : { error: result.error })
        });
      }

      // Enviar resultados de herramientas a Claude
      messages.push({ role: 'user', content: toolResults });

      response = await chatWithTools(systemPrompt, messages, TOOL_DEFINITIONS);

      if (!response) {
        return { text: 'Listo, realicé la acción solicitada.', actions };
      }
    }

    // Extraer texto final
    const textBlock = response.content.find(block => block.type === 'text');
    const text = textBlock ? textBlock.text : 'Listo, he realizado la acción.';

    return { text, actions };
  }

  // Recomendación de distribución de presupuesto
  async getBudgetAllocation(userId) {
    const now = new Date();
    const threeMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1));
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const [transactions, budget, savingGoals] = await Promise.all([
      Transaction.find({ userId, date: { $gte: threeMonthsAgo } }),
      Budget.findOne({ userId }),
      SavingGoal.find({ userId, status: 'active' })
    ]);

    const monthlyTx = transactions.filter(t => new Date(t.date) >= startOfMonth);
    const expenses = monthlyTx.filter(t => t.type === 'expense');
    const income = monthlyTx.filter(t => t.type === 'income');
    const totalExpenses = expenses.reduce((a, t) => a + t.amount, 0);
    const totalIncome = income.reduce((a, t) => a + t.amount, 0);

    // Categorizar gastos actuales
    const categories = {};
    expenses.forEach(t => {
      const isFixed = t.isFixed || (t.recurring && t.recurring.enabled);
      if (!categories[t.category]) categories[t.category] = { total: 0, isFixed };
      categories[t.category].total += t.amount;
    });

    // Calcular gastos fijos vs variables
    const fixedTotal = Object.values(categories).filter(c => c.isFixed).reduce((a, c) => a + c.total, 0);
    const variableTotal = totalExpenses - fixedTotal;

    // Base para la recomendación: el ingreso o presupuesto
    const base = totalIncome > 0 ? totalIncome : (budget?.amount || totalExpenses);

    // Distribución recomendada personalizada
    const fixedPercent = base > 0 ? Math.round((fixedTotal / base) * 100) : 0;
    const currentSavingsPercent = base > 0 ? Math.round(((totalIncome - totalExpenses) / base) * 100) : 0;

    // Recomendaciones por categoría tipo de gasto
    const allocation = {
      necesidades: {
        label: 'Necesidades',
        recommended: 50,
        current: base > 0 ? Math.round(((fixedTotal + (categories['Comida']?.total || 0) + (categories['Transporte']?.total || 0) + (categories['Salud']?.total || 0)) / base) * 100) : 0,
        categories: ['Vivienda', 'Comida', 'Transporte', 'Salud', 'Servicios'],
        description: 'Gastos esenciales para vivir'
      },
      deseos: {
        label: 'Deseos',
        recommended: 30,
        current: base > 0 ? Math.round(((categories['Ocio']?.total || 0) + (categories['Otros']?.total || 0)) / base * 100) : 0,
        categories: ['Ocio', 'Otros'],
        description: 'Entretenimiento y gustos'
      },
      ahorro: {
        label: 'Ahorro e Inversión',
        recommended: 20,
        current: Math.max(0, currentSavingsPercent),
        categories: [],
        description: 'Para metas futuras y emergencias'
      }
    };

    // Pedir a Claude un análisis personalizado
    let aiRecommendation = null;
    const prompt = `Analiza esta distribución de gastos de un estudiante y da recomendaciones personalizadas (máximo 4 oraciones). Usa la regla 50/30/20 como referencia:

Ingresos: $${totalIncome.toFixed(2)}
Gastos fijos: $${fixedTotal.toFixed(2)} (${fixedPercent}%)
Gastos variables: $${variableTotal.toFixed(2)}
Gastos por categoría: ${JSON.stringify(categories)}
Ahorro actual: ${currentSavingsPercent}%
Metas de ahorro: ${savingGoals.length > 0 ? savingGoals.map(g => `${g.name}: $${g.currentAmount}/$${g.targetAmount}`).join(', ') : 'Ninguna'}

Responde en español. Sé directo con números específicos de cuánto debería destinar a cada área.`;

    aiRecommendation = await generateText(prompt, { maxTokens: 400 });

    return {
      base,
      totalIncome,
      totalExpenses,
      fixedTotal,
      variableTotal,
      allocation,
      categories,
      savingGoals: savingGoals.map(g => ({
        name: g.name,
        current: g.currentAmount,
        target: g.targetAmount,
        progress: Math.round((g.currentAmount / g.targetAmount) * 100)
      })),
      aiRecommendation
    };
  }

  // Generar reporte semanal
  async getWeeklyReport(userId) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const [transactions, sessions, completedTasks] = await Promise.all([
      Transaction.find({ userId, date: { $gte: startOfWeek } }),
      StudySession.find({ userId, date: { $gte: startOfWeek } }),
      Task.find({ userId, status: 'completed', updatedAt: { $gte: startOfWeek } })
    ]);

    const expenses = transactions.filter(t => t.type === 'expense');
    const income = transactions.filter(t => t.type === 'income');

    const totalExpenses = expenses.reduce((a, t) => a + t.amount, 0);
    const totalIncome = income.reduce((a, t) => a + t.amount, 0);
    const totalStudyMinutes = sessions.reduce((a, s) => a + s.duration, 0);
    const totalPomodoros = sessions.reduce((a, s) => a + (s.pomodorosCompleted || 0), 0);

    // Gastos por categoría
    const expensesByCategory = {};
    expenses.forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

    // Día más productivo
    const dayStats = {};
    sessions.forEach(s => {
      const day = new Date(s.date).toLocaleDateString('es-MX', { weekday: 'long' });
      dayStats[day] = (dayStats[day] || 0) + s.duration;
    });
    const mostProductiveDay = Object.entries(dayStats).sort((a, b) => b[1] - a[1])[0];

    // Generar resumen con IA
    const prompt = `Genera un resumen motivador de la semana para un estudiante (máximo 3 oraciones):
    - Gastó $${totalExpenses}, ganó $${totalIncome}
    - Estudió ${Math.round(totalStudyMinutes / 60)} horas
    - Completó ${completedTasks.length} tareas
    - Día más productivo: ${mostProductiveDay?.[0] || 'No hay datos'}

    Responde en español, sé positivo pero realista.`;

    const aiSummary = await generateText(prompt);

    return {
      period: {
        start: startOfWeek.toISOString(),
        end: now.toISOString()
      },
      finances: {
        income: totalIncome,
        expenses: totalExpenses,
        balance: totalIncome - totalExpenses,
        byCategory: expensesByCategory,
        transactionCount: transactions.length
      },
      productivity: {
        studyHours: Math.round(totalStudyMinutes / 60 * 10) / 10,
        studyMinutes: totalStudyMinutes,
        pomodoros: totalPomodoros,
        tasksCompleted: completedTasks.length,
        sessionsCount: sessions.length,
        mostProductiveDay: mostProductiveDay?.[0] || null
      },
      aiSummary
    };
  }

  // Calcular score de salud financiera (0-100)
  async getHealthScore(userId) {
    const now = new Date();
    // Usar UTC para consistencia con las fechas guardadas
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const threeMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1));

    const [transactions, budget, savingGoals, sessions] = await Promise.all([
      Transaction.find({ userId, date: { $gte: threeMonthsAgo } }),
      Budget.findOne({ userId }),
      SavingGoal.find({ userId, status: 'active' }),
      StudySession.find({ userId, date: { $gte: startOfMonth } })
    ]);

    const monthlyTransactions = transactions.filter(t => new Date(t.date) >= startOfMonth);
    const expenses = monthlyTransactions.filter(t => t.type === 'expense');
    const income = monthlyTransactions.filter(t => t.type === 'income');

    const totalExpenses = expenses.reduce((a, t) => a + t.amount, 0);
    const totalIncome = income.reduce((a, t) => a + t.amount, 0);

    let score = 50; // Base score
    const factors = [];

    // Factor 1: Balance ingreso/gasto (máx 20 puntos)
    if (totalIncome > 0) {
      const savingsRate = (totalIncome - totalExpenses) / totalIncome;
      if (savingsRate >= 0.2) {
        score += 20;
        factors.push({ name: 'Ahorro', points: 20, status: 'excellent', detail: 'Ahorras más del 20% de tus ingresos' });
      } else if (savingsRate >= 0.1) {
        score += 15;
        factors.push({ name: 'Ahorro', points: 15, status: 'good', detail: 'Ahorras entre 10-20% de tus ingresos' });
      } else if (savingsRate >= 0) {
        score += 10;
        factors.push({ name: 'Ahorro', points: 10, status: 'fair', detail: 'Gastas menos de lo que ganas' });
      } else {
        score -= 10;
        factors.push({ name: 'Ahorro', points: -10, status: 'poor', detail: 'Gastas más de lo que ganas' });
      }
    }

    // Factor 2: Presupuesto (máx 15 puntos)
    if (budget && budget.amount > 0) {
      const budgetUsage = totalExpenses / budget.amount;
      if (budgetUsage <= 0.8) {
        score += 15;
        factors.push({ name: 'Presupuesto', points: 15, status: 'excellent', detail: 'Usas menos del 80% de tu presupuesto' });
      } else if (budgetUsage <= 1) {
        score += 10;
        factors.push({ name: 'Presupuesto', points: 10, status: 'good', detail: 'Te mantienes dentro del presupuesto' });
      } else {
        score -= 5;
        factors.push({ name: 'Presupuesto', points: -5, status: 'poor', detail: 'Excediste tu presupuesto' });
      }
    } else {
      factors.push({ name: 'Presupuesto', points: 0, status: 'missing', detail: 'No tienes presupuesto definido' });
    }

    // Factor 3: Consistencia de registro (máx 10 puntos)
    if (transactions.length >= 20) {
      score += 10;
      factors.push({ name: 'Registro', points: 10, status: 'excellent', detail: 'Registras tus transacciones consistentemente' });
    } else if (transactions.length >= 10) {
      score += 5;
      factors.push({ name: 'Registro', points: 5, status: 'good', detail: 'Buen registro de transacciones' });
    } else {
      factors.push({ name: 'Registro', points: 0, status: 'fair', detail: 'Registra más transacciones para mejor análisis' });
    }

    // Factor 4: Metas de ahorro (máx 10 puntos)
    if (savingGoals.length > 0) {
      const progressingGoals = savingGoals.filter(g => g.currentAmount > 0);
      if (progressingGoals.length === savingGoals.length) {
        score += 10;
        factors.push({ name: 'Metas', points: 10, status: 'excellent', detail: 'Todas tus metas tienen progreso' });
      } else if (progressingGoals.length > 0) {
        score += 5;
        factors.push({ name: 'Metas', points: 5, status: 'good', detail: 'Algunas metas tienen progreso' });
      } else {
        factors.push({ name: 'Metas', points: 0, status: 'fair', detail: 'Tus metas no tienen progreso aún' });
      }
    }

    // Factor 5: Productividad (máx 5 puntos bonus)
    const studyHours = sessions.reduce((a, s) => a + s.duration, 0) / 60;
    if (studyHours >= 20) {
      score += 5;
      factors.push({ name: 'Productividad', points: 5, status: 'excellent', detail: 'Excelente dedicación al estudio' });
    } else if (studyHours >= 10) {
      score += 3;
      factors.push({ name: 'Productividad', points: 3, status: 'good', detail: 'Buena dedicación al estudio' });
    }

    // Limitar score entre 0 y 100
    score = Math.max(0, Math.min(100, score));

    // Determinar nivel
    let level, color, icon;
    if (score >= 80) {
      level = 'Excelente';
      color = 'green';
      icon = 'Star';
    } else if (score >= 60) {
      level = 'Bueno';
      color = 'blue';
      icon = 'ThumbsUp';
    } else if (score >= 40) {
      level = 'Regular';
      color = 'yellow';
      icon = 'TrendingUp';
    } else {
      level = 'Necesita mejora';
      color = 'red';
      icon = 'Target';
    }

    // Tip personalizado con IA
    const worstFactor = factors.filter(f => f.status === 'poor' || f.status === 'missing')[0];
    let aiTip = null;
    if (worstFactor) {
      const prompt = `Da UN consejo breve (1-2 oraciones) para mejorar esto: "${worstFactor.detail}". Responde en español, sé práctico y motivador.`;
      aiTip = await generateText(prompt);
    }

    return {
      score,
      level,
      color,
      icon,
      factors,
      aiTip,
      lastUpdated: now.toISOString()
    };
  }
}

module.exports = new AIService();
