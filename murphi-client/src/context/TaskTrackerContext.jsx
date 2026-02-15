import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const TaskTrackerContext = createContext();

const TASK_STORAGE_KEY = 'murphi_active_task';

const CATEGORIES = [
  { value: 'Estudio', label: 'Estudio', icon: 'BookOpen', color: 'bg-ocean-500' },
  { value: 'Trabajo', label: 'Trabajo', icon: 'Briefcase', color: 'bg-purple-500' },
  { value: 'Proyecto', label: 'Proyecto', icon: 'Rocket', color: 'bg-warning' },
  { value: 'Lectura', label: 'Lectura', icon: 'BookMarked', color: 'bg-mint-500' },
  { value: 'Ejercicio', label: 'Ejercicio', icon: 'Dumbbell', color: 'bg-danger' },
  { value: 'Hobbies', label: 'Hobbies', icon: 'Palette', color: 'bg-pink-500' },
  { value: 'Otros', label: 'Otros', icon: 'FileText', color: 'bg-text-muted' }
];

export function TaskTrackerProvider({ children }) {
  const [activeTask, setActiveTask] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [taskLogs, setTaskLogs] = useState([]);
  const [summary, setSummary] = useState(null);

  const intervalRef = useRef(null);

  // Cargar tarea activa al iniciar
  useEffect(() => {
    loadActiveTask();
  }, []);

  // Timer para contar el tiempo transcurrido
  useEffect(() => {
    if (activeTask && activeTask.status === 'active') {
      // Calcular tiempo inicial transcurrido
      const startTime = new Date(activeTask.startTime).getTime();
      const now = Date.now();
      setElapsedTime(Math.floor((now - startTime) / 1000));

      // Iniciar intervalo
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeTask]);

  // Guardar en localStorage para persistencia offline
  useEffect(() => {
    if (activeTask) {
      localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(activeTask));
    } else {
      localStorage.removeItem(TASK_STORAGE_KEY);
    }
  }, [activeTask]);

  const loadActiveTask = async () => {
    try {
      setIsLoading(true);

      // Primero intentar cargar desde el servidor
      const response = await api.get('/api/productivity/task-logs/active');
      if (response.data) {
        setActiveTask(response.data);
      } else {
        // Si no hay tarea activa en servidor, verificar localStorage
        const saved = localStorage.getItem(TASK_STORAGE_KEY);
        if (saved) {
          const localTask = JSON.parse(saved);
          // Verificar si la tarea local aún es válida (no muy antigua)
          const startTime = new Date(localTask.startTime).getTime();
          const hoursSinceStart = (Date.now() - startTime) / (1000 * 60 * 60);

          // Si la tarea local tiene más de 24 horas, descartarla
          if (hoursSinceStart < 24) {
            // Sincronizar con servidor
            try {
              const syncResponse = await api.post('/api/productivity/task-logs/start', {
                title: localTask.title,
                category: localTask.category,
                description: localTask.description
              });
              setActiveTask(syncResponse.data);
            } catch {
              // Si falla, usar la local
              setActiveTask(localTask);
            }
          } else {
            localStorage.removeItem(TASK_STORAGE_KEY);
          }
        }
      }
    } catch (error) {
      console.error('Error loading active task:', error);
      // Intentar cargar desde localStorage
      const saved = localStorage.getItem(TASK_STORAGE_KEY);
      if (saved) {
        setActiveTask(JSON.parse(saved));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startTask = useCallback(async (title, category, description = '') => {
    try {
      const response = await api.post('/api/productivity/task-logs/start', {
        title,
        category,
        description
      });

      setActiveTask(response.data);
      setElapsedTime(0);
      toast.success(`Tarea iniciada: ${title}`);
      return response.data;
    } catch (error) {
      // Si hay error de conexión, crear tarea local
      if (!error.response) {
        const localTask = {
          _id: `local_${Date.now()}`,
          title,
          category,
          description,
          startTime: new Date().toISOString(),
          status: 'active'
        };
        setActiveTask(localTask);
        setElapsedTime(0);
        toast.success(`Tarea iniciada (offline): ${title}`);
        return localTask;
      }
      toast.error(error.response?.data?.error || 'Error al iniciar tarea');
      throw error;
    }
  }, []);

  const stopTask = useCallback(async () => {
    if (!activeTask) return;

    try {
      const response = await api.post(`/api/productivity/task-logs/${activeTask._id}/stop`);

      const completedTask = response.data;
      setActiveTask(null);
      setElapsedTime(0);

      // Formatear duración para el toast
      const duration = formatDuration(completedTask.duration);
      toast.success(`Tarea completada: ${duration}`);

      return completedTask;
    } catch (error) {
      // Si es tarea local o error de conexión
      if (activeTask._id?.startsWith('local_') || !error.response) {
        const completedTask = {
          ...activeTask,
          endTime: new Date().toISOString(),
          duration: elapsedTime,
          status: 'completed'
        };
        setActiveTask(null);
        setElapsedTime(0);
        toast.success(`Tarea completada: ${formatDuration(elapsedTime)}`);
        return completedTask;
      }
      toast.error('Error al detener tarea');
      throw error;
    }
  }, [activeTask, elapsedTime]);

  const cancelTask = useCallback(async () => {
    if (!activeTask) return;

    try {
      await api.post(`/api/productivity/task-logs/${activeTask._id}/cancel`);
      setActiveTask(null);
      setElapsedTime(0);
      toast.error('Tarea cancelada');
    } catch (error) {
      // Si es tarea local
      if (activeTask._id?.startsWith('local_')) {
        setActiveTask(null);
        setElapsedTime(0);
        toast.error('Tarea cancelada');
        return;
      }
      toast.error('Error al cancelar tarea');
    }
  }, [activeTask]);

  const loadTaskLogs = useCallback(async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/api/productivity/task-logs?${params}`);
      setTaskLogs(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading task logs:', error);
      return [];
    }
  }, []);

  const loadSummary = useCallback(async (period = 'week') => {
    try {
      const response = await api.get(`/api/productivity/task-logs/summary?period=${period}`);
      setSummary(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading summary:', error);
      return null;
    }
  }, []);

  const deleteTaskLog = useCallback(async (id) => {
    try {
      await api.delete(`/api/productivity/task-logs/${id}`);
      setTaskLogs(prev => prev.filter(t => t._id !== id));
      toast.success('Registro eliminado');
    } catch (error) {
      toast.error('Error al eliminar registro');
    }
  }, []);

  // Formatear tiempo
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatElapsedTime = () => {
    const hrs = Math.floor(elapsedTime / 3600);
    const mins = Math.floor((elapsedTime % 3600) / 60);
    const secs = elapsedTime % 60;

    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const value = {
    // Estado
    activeTask,
    elapsedTime,
    isLoading,
    taskLogs,
    summary,
    categories: CATEGORIES,

    // Acciones
    startTask,
    stopTask,
    cancelTask,
    loadTaskLogs,
    loadSummary,
    deleteTaskLog,

    // Helpers
    formatDuration,
    formatElapsedTime,
    getCategoryInfo: (category) => CATEGORIES.find(c => c.value === category) || CATEGORIES[6]
  };

  return (
    <TaskTrackerContext.Provider value={value}>
      {children}
    </TaskTrackerContext.Provider>
  );
}

export function useTaskTracker() {
  const context = useContext(TaskTrackerContext);
  if (!context) {
    throw new Error('useTaskTracker must be used within a TaskTrackerProvider');
  }
  return context;
}

export default TaskTrackerContext;
