import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Plus, Clock, BookOpen, CheckSquare, Search, Timer } from 'lucide-react';
import { useProductivity } from '../hooks/useProductivity';
import { useTaskTracker } from '../context/TaskTrackerContext';
import Sidebar from '../components/common/Sidebar';
import SearchFilter from '../components/common/SearchFilter';
import PomodoroTimer from '../components/productivity/PomodoroTimer';
import TaskTracker from '../components/productivity/TaskTracker';
import TaskHistory from '../components/productivity/TaskHistory';
import TaskList from '../components/productivity/TaskList';
import TaskForm from '../components/productivity/TaskForm';

export default function Productivity() {
  const {
    tasks,
    summary,
    loading,
    addTask,
    updateTask,
    deleteTask,
    addSession
  } = useProductivity();

  const { activeTask } = useTaskTracker();

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [currentSubject, setCurrentSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [timerMode, setTimerMode] = useState('tracker');

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    return tasks.filter(t => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          t.title?.toLowerCase().includes(search) ||
          t.description?.toLowerCase().includes(search) ||
          t.subject?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      if (filters.priority && filters.priority !== 'all') {
        if (t.priority !== filters.priority) return false;
      }

      if (filters.status && filters.status !== 'all') {
        if (t.status !== filters.status) return false;
      }

      return true;
    });
  }, [tasks, searchTerm, filters]);

  const taskFilterConfig = [
    {
      key: 'priority',
      label: 'Prioridad',
      options: [
        { value: 'high', label: 'Alta' },
        { value: 'medium', label: 'Media' },
        { value: 'low', label: 'Baja' }
      ]
    },
    {
      key: 'status',
      label: 'Estado',
      options: [
        { value: 'pending', label: 'Pendiente' },
        { value: 'in_progress', label: 'En progreso' },
        { value: 'completed', label: 'Completada' }
      ]
    }
  ];

  const handlePomodoroComplete = async (count) => {
    if (currentSubject) {
      await addSession({
        subject: currentSubject,
        duration: 25,
        pomodorosCompleted: 1
      });
    }
  };

  const handleTaskSubmit = async (data) => {
    try {
      if (editingTask) {
        await toast.promise(
          updateTask(editingTask._id, data),
          {
            loading: 'Actualizando...',
            success: 'Tarea actualizada',
            error: 'Error al actualizar',
          }
        );
      } else {
        await toast.promise(
          addTask(data),
          {
            loading: 'Creando...',
            success: 'Tarea creada',
            error: 'Error al crear tarea',
          }
        );
      }
      setShowTaskForm(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm('¿Eliminar esta tarea?')) {
      toast.promise(
        deleteTask(id),
        {
          loading: 'Eliminando...',
          success: 'Tarea eliminada',
          error: 'Error al eliminar',
        }
      );
    }
  };

  const handleToggleStatus = async (id, newStatus) => {
    await updateTask(id, { status: newStatus });
  };

  const pendingTasks = filteredTasks.filter(t => t.status !== 'completed');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');
  const hasFilters = searchTerm || Object.values(filters).some(v => v && v !== 'all');

  if (loading) {
    return (
      <div className="flex min-h-screen bg-dark-bg">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="spinner w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Productividad</h1>
          <button
            onClick={() => setShowTaskForm(true)}
            className="btn btn-primary"
          >
            <Plus size={18} />
            Nueva Tarea
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-6">
          <div className="bg-dark-surface rounded-xl border border-dark-border p-4 lg:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-ocean-500/10 flex items-center justify-center">
                <Clock size={16} className="text-ocean-400" />
              </div>
              <span className="text-xs text-text-secondary">Horas</span>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-text-primary">
              {summary?.week?.totalHours || 0}h
            </p>
          </div>

          <div className="bg-dark-surface rounded-xl border border-dark-border p-4 lg:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
                <BookOpen size={16} className="text-danger" />
              </div>
              <span className="text-xs text-text-secondary">Pomodoros</span>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-text-primary">
              {summary?.week?.totalPomodoros || 0}
            </p>
          </div>

          <div className="bg-dark-surface rounded-xl border border-dark-border p-4 lg:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <CheckSquare size={16} className="text-warning" />
              </div>
              <span className="text-xs text-text-secondary">Pendientes</span>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-text-primary">
              {summary?.tasks?.pending || 0}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Left Column - Timers */}
          <div className="space-y-4 order-first lg:order-none">
            {/* Timer Mode Tabs */}
            <div className="bg-dark-surface rounded-xl border border-dark-border p-1.5">
              <div className="flex gap-1">
                <button
                  onClick={() => setTimerMode('tracker')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                    timerMode === 'tracker'
                      ? 'bg-mint-500/15 text-mint-400'
                      : 'text-text-muted hover:bg-dark-elevated hover:text-text-secondary'
                  } ${activeTask ? 'ring-1 ring-mint-500' : ''}`}
                >
                  <Timer size={14} />
                  <span className="hidden sm:inline">Registrar</span>
                  {activeTask && <span className="w-1.5 h-1.5 bg-mint-400 rounded-full animate-pulse" />}
                </button>
                <button
                  onClick={() => setTimerMode('pomodoro')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                    timerMode === 'pomodoro'
                      ? 'bg-mint-500/15 text-mint-400'
                      : 'text-text-muted hover:bg-dark-elevated hover:text-text-secondary'
                  }`}
                >
                  <Clock size={14} />
                  <span className="hidden sm:inline">Pomodoro</span>
                </button>
              </div>
            </div>

            {/* Pomodoro Mode */}
            {timerMode === 'pomodoro' && (
              <>
                <div className="bg-dark-surface rounded-xl border border-dark-border p-4">
                  <label className="block text-sm text-text-secondary mb-2">
                    ¿Qué vas a estudiar?
                  </label>
                  <input
                    type="text"
                    value={currentSubject}
                    onChange={(e) => setCurrentSubject(e.target.value)}
                    className="input"
                    placeholder="Ej: Matemáticas, Física..."
                  />
                </div>

                <PomodoroTimer onComplete={handlePomodoroComplete} subject={currentSubject} />
              </>
            )}

            {/* Task Tracker Mode */}
            {timerMode === 'tracker' && (
              <>
                <TaskTracker />
                <TaskHistory />
              </>
            )}
          </div>

          {/* Right Column - Tasks */}
          <div className="lg:col-span-2 space-y-4">
            <SearchFilter
              searchPlaceholder="Buscar tareas..."
              onSearch={setSearchTerm}
              onFilter={setFilters}
              filters={taskFilterConfig}
              activeFilters={filters}
            />

            {/* Pending Tasks */}
            <div className="bg-dark-surface rounded-xl border border-dark-border p-5">
              <h2 className="font-medium text-text-primary mb-4">
                {hasFilters ? 'Resultados' : 'Tareas pendientes'} ({pendingTasks.length})
              </h2>
              {pendingTasks.length > 0 ? (
                <TaskList
                  tasks={pendingTasks}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onToggleStatus={handleToggleStatus}
                />
              ) : hasFilters ? (
                <div className="text-center py-8 text-text-muted">
                  <Search size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No se encontraron tareas</p>
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <CheckSquare size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay tareas pendientes</p>
                </div>
              )}
            </div>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="bg-dark-surface rounded-xl border border-dark-border p-5">
                <h2 className="font-medium text-text-primary mb-4">
                  Completadas ({completedTasks.length})
                </h2>
                <TaskList
                  tasks={completedTasks.slice(0, 5)}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onToggleStatus={handleToggleStatus}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {showTaskForm && (
        <TaskForm
          initialData={editingTask}
          onSubmit={handleTaskSubmit}
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
