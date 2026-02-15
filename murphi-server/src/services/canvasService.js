const Task = require('../models/Task');

const CANVAS_API_VERSION = '/api/v1';

/**
 * Helper para hacer requests a Canvas API con paginación
 */
async function canvasFetch(canvasUrl, token, endpoint, params = {}) {
  const url = new URL(`${CANVAS_API_VERSION}${endpoint}`, `https://${canvasUrl}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Canvas API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * Obtiene todos los resultados paginados de un endpoint
 */
async function canvasFetchAll(canvasUrl, token, endpoint, params = {}) {
  let allResults = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const results = await canvasFetch(canvasUrl, token, endpoint, {
      ...params,
      per_page: perPage,
      page
    });

    if (!Array.isArray(results) || results.length === 0) break;

    allResults = allResults.concat(results);

    if (results.length < perPage) break;
    page++;

    // Safety limit
    if (page > 10) break;
  }

  return allResults;
}

/**
 * Valida que el token de Canvas funcione
 */
async function testConnection(canvasUrl, token) {
  try {
    const user = await canvasFetch(canvasUrl, token, '/users/self');
    return {
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.primary_email || user.login_id
      }
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Obtiene cursos activos del usuario
 */
async function getCourses(canvasUrl, token) {
  const courses = await canvasFetchAll(canvasUrl, token, '/courses', {
    enrollment_state: 'active',
    state: 'available'
  });

  return courses.map(c => ({
    id: c.id,
    name: c.name,
    code: c.course_code
  }));
}

/**
 * Obtiene assignments de un curso (incluye submission del usuario actual)
 */
async function getAssignments(canvasUrl, token, courseId) {
  const assignments = await canvasFetchAll(canvasUrl, token, `/courses/${courseId}/assignments`, {
    order_by: 'due_at',
    'include[]': 'submission'
  });

  return assignments;
}

/**
 * Convierte una fecha UTC a la fecha local (GMT-6 Guatemala) y
 * la almacena a mediodía UTC de ese día local para que el Timeline
 * la agrupe correctamente.
 */
function toLocalDateUTC(utcDateString) {
  const utcDate = new Date(utcDateString);
  // Ajustar a GMT-6
  const localDate = new Date(utcDate.getTime() - (6 * 60 * 60 * 1000));
  // Extraer año, mes, día en la zona local
  const year = localDate.getUTCFullYear();
  const month = localDate.getUTCMonth();
  const day = localDate.getUTCDate();
  // Devolver mediodía UTC de ese día para evitar problemas de borde
  return new Date(Date.UTC(year, month, day, 12, 0, 0));
}

/**
 * Sincroniza assignments de Canvas con Tasks en Murphi
 * Solo importa assignments con due_at (fecha de entrega)
 */
async function syncAssignments(userId, canvasUrl, token) {
  const courses = await getCourses(canvasUrl, token);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  // Fecha límite: solo assignments del último mes hacia adelante
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  for (const course of courses) {
    let assignments;
    try {
      assignments = await getAssignments(canvasUrl, token, course.id);
    } catch (error) {
      console.error(`Error fetching assignments for course ${course.name}:`, error.message);
      continue;
    }

    for (const assignment of assignments) {
      // Saltar assignments sin fecha de entrega
      if (!assignment.due_at) {
        skipped++;
        continue;
      }

      // Convertir fecha UTC a fecha local (GMT-6) para el calendario
      const dueDate = toLocalDateUTC(assignment.due_at);

      // Saltar assignments muy viejos
      if (dueDate < oneMonthAgo) {
        skipped++;
        continue;
      }

      // Buscar si ya existe esta task
      const existingTask = await Task.findOne({
        userId,
        canvasId: assignment.id,
        source: 'canvas'
      });

      // Verificar si el usuario actual entregó usando su submission personal
      const submission = assignment.submission;
      const isSubmitted = submission &&
        submission.workflow_state &&
        submission.workflow_state !== 'unsubmitted';

      if (existingTask) {
        // Actualizar si cambió algo
        let changed = false;

        if (existingTask.title !== assignment.name) {
          existingTask.title = assignment.name;
          changed = true;
        }
        if (existingTask.dueDate?.toISOString() !== dueDate.toISOString()) {
          existingTask.dueDate = dueDate;
          changed = true;
        }
        if (existingTask.courseName !== course.name) {
          existingTask.courseName = course.name;
          changed = true;
        }
        // Actualizar estado basado en submission del usuario
        if (isSubmitted && existingTask.status !== 'completed') {
          existingTask.status = 'completed';
          changed = true;
        } else if (!isSubmitted && existingTask.status === 'completed' && !existingTask.manuallyCompleted) {
          // Solo revertir a pending si NO fue completada manualmente por el usuario
          existingTask.status = 'pending';
          changed = true;
        }

        if (changed) {
          await existingTask.save();
          updated++;
        }
      } else {
        // Crear nueva task
        await Task.create({
          userId,
          title: assignment.name,
          subject: course.name,
          courseName: course.name,
          dueDate,
          priority: 'medium',
          status: isSubmitted ? 'completed' : 'pending',
          source: 'canvas',
          canvasId: assignment.id
        });
        created++;
      }
    }
  }

  return { created, updated, skipped, coursesFound: courses.length };
}

module.exports = {
  testConnection,
  getCourses,
  syncAssignments
};
