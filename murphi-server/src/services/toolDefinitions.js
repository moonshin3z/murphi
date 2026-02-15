const TOOL_DEFINITIONS = [
  {
    name: 'create_transaction',
    description: 'Registra un gasto o ingreso del usuario. Usa cuando el usuario diga que gastó, compró, pagó, recibió dinero, le pagaron, etc.',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['income', 'expense'], description: 'income para ingresos, expense para gastos' },
        category: {
          type: 'string',
          enum: ['Comida', 'Transporte', 'Ocio', 'Educación', 'Salud', 'Vivienda', 'Servicios', 'Otros', 'Beca', 'Trabajo', 'Familia', 'Freelance'],
          description: 'Categoría del gasto/ingreso'
        },
        amount: { type: 'number', description: 'Monto positivo' },
        description: { type: 'string', description: 'Descripción breve' },
        date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD. Usa hoy si no se especifica.' },
        isFixed: { type: 'boolean', description: 'true si es gasto fijo mensual (renta, servicios, internet)' }
      },
      required: ['type', 'category', 'amount']
    }
  },
  {
    name: 'create_task',
    description: 'Crea una tarea pendiente. Usa cuando el usuario quiera anotar algo por hacer, una entrega, o tarea escolar.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título de la tarea' },
        subject: { type: 'string', description: 'Materia asociada (si aplica)' },
        dueDate: { type: 'string', description: 'Fecha límite en YYYY-MM-DD' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Prioridad' },
        estimatedTime: { type: 'number', description: 'Tiempo estimado en minutos' }
      },
      required: ['title']
    }
  },
  {
    name: 'complete_task',
    description: 'Marca una tarea como completada. Usa cuando el usuario diga que ya terminó, completó o acabó una tarea.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título o parte del título de la tarea a completar' }
      },
      required: ['title']
    }
  },
  {
    name: 'uncomplete_task',
    description: 'Marca una tarea completada como pendiente de nuevo. Usa cuando el usuario diga que no terminó una tarea, que la quiere reabrir, desmarcar o descompletar.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título o parte del título de la tarea a descompletar' }
      },
      required: ['title']
    }
  },
  {
    name: 'update_transaction',
    description: 'Edita una transacción existente. Usa cuando el usuario quiera cambiar el monto, categoría, descripción o fecha de un gasto/ingreso ya registrado. Primero busca la transacción para identificarla.',
    input_schema: {
      type: 'object',
      properties: {
        search: {
          type: 'object',
          description: 'Criterios para encontrar la transacción a editar',
          properties: {
            description: { type: 'string', description: 'Descripción o parte de ella para buscar' },
            category: { type: 'string', description: 'Categoría de la transacción' },
            date: { type: 'string', description: 'Fecha de la transacción YYYY-MM-DD' },
            type: { type: 'string', enum: ['income', 'expense'], description: 'Tipo de transacción' }
          }
        },
        update: {
          type: 'object',
          description: 'Campos a actualizar',
          properties: {
            amount: { type: 'number', description: 'Nuevo monto' },
            category: { type: 'string', description: 'Nueva categoría' },
            description: { type: 'string', description: 'Nueva descripción' },
            date: { type: 'string', description: 'Nueva fecha YYYY-MM-DD' }
          }
        }
      },
      required: ['search', 'update']
    }
  },
  {
    name: 'delete_transaction',
    description: 'Elimina una transacción existente. Usa cuando el usuario quiera borrar o eliminar un gasto/ingreso registrado.',
    input_schema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Descripción o parte de ella para buscar' },
        category: { type: 'string', description: 'Categoría de la transacción' },
        date: { type: 'string', description: 'Fecha de la transacción YYYY-MM-DD' },
        type: { type: 'string', enum: ['income', 'expense'], description: 'Tipo de transacción' }
      },
      required: []
    }
  },
  {
    name: 'search_transactions',
    description: 'Busca transacciones del usuario con filtros. Usa para ver transacciones específicas, buscar por categoría/fecha/descripción, o responder preguntas como "cuánto gasté en X". El campo description busca en el texto de las descripciones. Devuelve el total sumado automáticamente.',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['income', 'expense'], description: 'Filtrar por tipo' },
        category: { type: 'string', description: 'Filtrar por categoría' },
        description: { type: 'string', description: 'Buscar en descripción (texto parcial, ej: "amigos", "uber", "almuerzo")' },
        startDate: { type: 'string', description: 'Desde fecha YYYY-MM-DD' },
        endDate: { type: 'string', description: 'Hasta fecha YYYY-MM-DD' },
        limit: { type: 'number', description: 'Máximo de resultados (default 50)' },
        sortBy: { type: 'string', enum: ['date', 'amount'], description: 'Ordenar por fecha o monto' },
        sortOrder: { type: 'string', enum: ['asc', 'desc'], description: 'Orden ascendente o descendente' }
      },
      required: []
    }
  },
  {
    name: 'get_finance_summary',
    description: 'Obtiene resumen financiero detallado del mes: ingresos, gastos por categoría, balance, presupuesto y metas de ahorro. Usa SOLO si necesitas datos agregados que no están en tu contexto.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_productivity_summary',
    description: 'Obtiene resumen de productividad de la semana: horas de estudio por materia, tareas pendientes, racha, pomodoros. Usa SOLO si necesitas datos detallados que no están en tu contexto.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'create_saving_goal',
    description: 'Crea una meta de ahorro. Usa cuando el usuario quiera ahorrar para algo específico.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nombre de la meta' },
        targetAmount: { type: 'number', description: 'Cantidad objetivo' },
        deadline: { type: 'string', description: 'Fecha límite en YYYY-MM-DD' },
        currentAmount: { type: 'number', description: 'Cantidad ya ahorrada (0 por defecto)' }
      },
      required: ['name', 'targetAmount']
    }
  },
  {
    name: 'set_budget',
    description: 'Establece o actualiza el presupuesto mensual/semanal del usuario.',
    input_schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Presupuesto total' },
        period: { type: 'string', enum: ['weekly', 'monthly'], description: 'Período' },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              limit: { type: 'number' }
            },
            required: ['name', 'limit']
          },
          description: 'Límites por categoría (opcional)'
        },
        alertThreshold: { type: 'number', description: 'Porcentaje (0-100) para alerta' }
      },
      required: ['amount', 'period']
    }
  },
  {
    name: 'start_timer',
    description: 'Inicia un temporizador de actividad. Usa cuando el usuario diga que va a estudiar, trabajar, o quiera registrar tiempo.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Nombre de la actividad' },
        category: { type: 'string', enum: ['Estudio', 'Trabajo', 'Proyecto', 'Lectura', 'Ejercicio', 'Hobbies', 'Otros'] }
      },
      required: ['title', 'category']
    }
  },
  {
    name: 'log_study_session',
    description: 'Registra una sesión de estudio ya completada. Usa cuando el usuario diga que ya estudió cierto tiempo.',
    input_schema: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'Materia estudiada' },
        duration: { type: 'number', description: 'Duración en minutos' },
        pomodorosCompleted: { type: 'number', description: 'Cantidad de pomodoros completados' }
      },
      required: ['subject', 'duration']
    }
  },
  {
    name: 'search_study_sessions',
    description: 'Busca sesiones de estudio del usuario con filtros. Usa cuando necesites ver sesiones específicas, encontrar el día con más estudio, buscar por materia/fecha, o responder preguntas sobre sesiones individuales.',
    input_schema: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'Filtrar por materia' },
        startDate: { type: 'string', description: 'Desde fecha YYYY-MM-DD' },
        endDate: { type: 'string', description: 'Hasta fecha YYYY-MM-DD' },
        limit: { type: 'number', description: 'Máximo de resultados (default 50)' },
        sortBy: { type: 'string', enum: ['date', 'duration'], description: 'Ordenar por fecha o duración' },
        sortOrder: { type: 'string', enum: ['asc', 'desc'], description: 'Orden ascendente o descendente' }
      },
      required: []
    }
  },
  {
    name: 'search_tasks',
    description: 'Busca tareas del usuario con filtros. Usa cuando necesites ver tareas específicas, filtrar por estado/prioridad/materia, encontrar tareas vencidas, o responder preguntas sobre tareas individuales.',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'in_progress', 'completed'], description: 'Filtrar por estado' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Filtrar por prioridad' },
        subject: { type: 'string', description: 'Filtrar por materia' },
        startDate: { type: 'string', description: 'Fecha límite desde YYYY-MM-DD' },
        endDate: { type: 'string', description: 'Fecha límite hasta YYYY-MM-DD' },
        limit: { type: 'number', description: 'Máximo de resultados (default 50)' },
        sortBy: { type: 'string', enum: ['dueDate', 'priority', 'createdAt'], description: 'Ordenar por fecha límite, prioridad o fecha de creación' },
        sortOrder: { type: 'string', enum: ['asc', 'desc'], description: 'Orden ascendente o descendente' }
      },
      required: []
    }
  }
];

module.exports = TOOL_DEFINITIONS;
