const StudySession = require('../models/StudySession');
const Task = require('../models/Task');
const Streak = require('../models/Streak');
const TaskLog = require('../models/TaskLog');

// ============ STUDY SESSIONS ============

exports.getSessions = async (req, res) => {
  try {
    const { startDate, endDate, subject } = req.query;
    const query = { userId: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (subject) query.subject = subject;

    const sessions = await StudySession.find(query).sort({ date: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    const session = await StudySession.create({
      ...req.body,
      userId: req.user._id
    });

    // Actualizar racha
    let streak = await Streak.findOne({ userId: req.user._id });
    if (!streak) {
      streak = new Streak({ userId: req.user._id });
    }
    streak.updateStreak();
    await streak.save();

    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const session = await StudySession.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    res.json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const session = await StudySession.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    res.json({ message: 'Sesión eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ TASKS ============

exports.getTasks = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const query = { userId: req.user._id };

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query).sort({ dueDate: 1, priority: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      userId: req.user._id
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    // Obtener la tarea antes de actualizar para comparar el status
    const existingTask = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!existingTask) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const wasNotCompleted = existingTask.status !== 'completed';
    const isNowCompleted = req.body.status === 'completed';

    // Si es tarea de Canvas y el usuario la marca como completada, guardar flag
    const updateData = { ...req.body };
    if (existingTask.source === 'canvas' && wasNotCompleted && isNowCompleted) {
      updateData.manuallyCompleted = true;
    }
    // Si el usuario la desmarca (vuelve a pending), quitar el flag
    if (existingTask.source === 'canvas' && !wasNotCompleted && !isNowCompleted) {
      updateData.manuallyCompleted = false;
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    // Si la tarea se acaba de completar, crear un TaskLog para el calendario
    if (wasNotCompleted && isNowCompleted) {
      const now = new Date();
      await TaskLog.create({
        userId: req.user._id,
        title: task.title,
        category: task.subject ? 'Estudio' : 'Otros',
        description: task.description || '',
        startTime: now,
        endTime: now,
        duration: task.estimatedTime ? task.estimatedTime * 60 : 0, // estimatedTime en minutos → segundos
        status: 'completed'
      });

      // Actualizar racha de productividad
      let streak = await Streak.findOne({ userId: req.user._id });
      if (!streak) {
        streak = new Streak({ userId: req.user._id });
      }
      streak.updateStreak();
      await streak.save();
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json({ message: 'Tarea eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ STREAK ============

exports.getStreak = async (req, res) => {
  try {
    let streak = await Streak.findOne({ userId: req.user._id });
    if (!streak) {
      streak = { currentStreak: 0, longestStreak: 0, totalProductiveDays: 0 };
    }
    res.json(streak);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ SUMMARY ============

exports.getProductivitySummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Sesiones de la semana
    const weekSessions = await StudySession.find({
      userId: req.user._id,
      date: { $gte: startOfWeek }
    });

    const totalMinutes = weekSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalPomodoros = weekSessions.reduce((sum, s) => sum + s.pomodorosCompleted, 0);

    // Horas por materia
    const hoursBySubject = weekSessions.reduce((acc, s) => {
      acc[s.subject] = (acc[s.subject] || 0) + s.duration;
      return acc;
    }, {});

    // Tareas pendientes
    const pendingTasks = await Task.countDocuments({
      userId: req.user._id,
      status: { $ne: 'completed' }
    });

    // Tareas próximas a vencer (7 días)
    const upcomingDeadline = new Date();
    upcomingDeadline.setDate(upcomingDeadline.getDate() + 7);

    const urgentTasks = await Task.find({
      userId: req.user._id,
      status: { $ne: 'completed' },
      dueDate: { $lte: upcomingDeadline, $gte: now }
    }).sort({ dueDate: 1 }).limit(5);

    // Racha
    const streak = await Streak.findOne({ userId: req.user._id });

    res.json({
      week: {
        totalMinutes,
        totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        totalPomodoros,
        sessions: weekSessions.length,
        hoursBySubject
      },
      tasks: {
        pending: pendingTasks,
        urgent: urgentTasks
      },
      streak: {
        current: streak?.currentStreak || 0,
        longest: streak?.longestStreak || 0,
        totalDays: streak?.totalProductiveDays || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ TASK LOGS (Time Tracking) ============

// Obtener registros de tareas
exports.getTaskLogs = async (req, res) => {
  try {
    const { status, category, startDate, endDate, limit = 50 } = req.query;
    const query = { userId: req.user._id };

    if (status) query.status = status;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const taskLogs = await TaskLog.find(query)
      .sort({ startTime: -1 })
      .limit(parseInt(limit));

    res.json(taskLogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener tarea activa (si existe)
exports.getActiveTaskLog = async (req, res) => {
  try {
    const activeTask = await TaskLog.findOne({
      userId: req.user._id,
      status: 'active'
    });

    res.json(activeTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Iniciar nueva tarea
exports.startTaskLog = async (req, res) => {
  try {
    const { title, category, description } = req.body;

    // Verificar si hay una tarea activa
    const existingActive = await TaskLog.findOne({
      userId: req.user._id,
      status: 'active'
    });

    if (existingActive) {
      return res.status(400).json({
        error: 'Ya tienes una tarea activa. Deténla primero.',
        activeTask: existingActive
      });
    }

    const taskLog = await TaskLog.create({
      userId: req.user._id,
      title,
      category,
      description: description || '',
      startTime: new Date(),
      status: 'active'
    });

    res.status(201).json(taskLog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Detener tarea activa
exports.stopTaskLog = async (req, res) => {
  try {
    const { id } = req.params;

    const taskLog = await TaskLog.findOne({
      _id: id,
      userId: req.user._id,
      status: 'active'
    });

    if (!taskLog) {
      return res.status(404).json({ error: 'Tarea no encontrada o ya finalizada' });
    }

    // Calcular duración y finalizar
    taskLog.endTime = new Date();
    taskLog.duration = Math.floor((taskLog.endTime - taskLog.startTime) / 1000);
    taskLog.status = 'completed';
    await taskLog.save();

    // Actualizar racha de productividad
    let streak = await Streak.findOne({ userId: req.user._id });
    if (!streak) {
      streak = new Streak({ userId: req.user._id });
    }
    streak.updateStreak();
    await streak.save();

    res.json(taskLog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Cancelar tarea activa
exports.cancelTaskLog = async (req, res) => {
  try {
    const { id } = req.params;

    const taskLog = await TaskLog.findOneAndUpdate(
      { _id: id, userId: req.user._id, status: 'active' },
      { status: 'cancelled', endTime: new Date() },
      { new: true }
    );

    if (!taskLog) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.json(taskLog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar registro de tarea
exports.deleteTaskLog = async (req, res) => {
  try {
    const taskLog = await TaskLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!taskLog) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json({ message: 'Registro eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear registro de tarea completada (para entrada manual del calendario)
exports.createCompletedTaskLog = async (req, res) => {
  try {
    const { title, category, description, duration, date } = req.body;

    if (!title || !category || !duration) {
      return res.status(400).json({ error: 'Título, categoría y duración son requeridos' });
    }

    const startTime = date ? new Date(date) : new Date();
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000); // duration en minutos

    const taskLog = await TaskLog.create({
      userId: req.user._id,
      title,
      category,
      description: description || '',
      startTime,
      endTime,
      duration: duration * 60, // Convertir minutos a segundos
      status: 'completed'
    });

    // Actualizar racha de productividad
    let streak = await Streak.findOne({ userId: req.user._id });
    if (!streak) {
      streak = new Streak({ userId: req.user._id });
    }
    streak.updateStreak();
    await streak.save();

    res.status(201).json(taskLog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Actualizar registro de tarea
exports.updateTaskLog = async (req, res) => {
  try {
    const taskLog = await TaskLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!taskLog) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    res.json(taskLog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Resumen de tiempo por categoría
exports.getTaskLogsSummary = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }

    const taskLogs = await TaskLog.find({
      userId: req.user._id,
      status: 'completed',
      startTime: { $gte: startDate }
    });

    // Calcular tiempo total
    const totalSeconds = taskLogs.reduce((sum, t) => sum + t.duration, 0);

    // Tiempo por categoría
    const byCategory = taskLogs.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.duration;
      return acc;
    }, {});

    // Tareas por día
    const byDay = taskLogs.reduce((acc, t) => {
      const day = t.startTime.toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = { count: 0, duration: 0 };
      }
      acc[day].count++;
      acc[day].duration += t.duration;
      return acc;
    }, {});

    res.json({
      period,
      totalTasks: taskLogs.length,
      totalSeconds,
      totalHours: Math.round(totalSeconds / 3600 * 10) / 10,
      byCategory,
      byDay
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
