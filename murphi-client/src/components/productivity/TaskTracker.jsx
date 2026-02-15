import { useState } from 'react';
import { Play, Square, X, Clock, Tag, BookOpen, Briefcase, Rocket, BookMarked, Dumbbell, Palette, FileText } from 'lucide-react';

const ICON_MAP = {
  BookOpen, Briefcase, Rocket, BookMarked, Dumbbell, Palette, FileText
};
import { useTaskTracker } from '../../context/TaskTrackerContext';

export default function TaskTracker() {
  const {
    activeTask,
    elapsedTime,
    isLoading,
    categories,
    startTask,
    stopTask,
    cancelTask,
    formatElapsedTime,
    getCategoryInfo
  } = useTaskTracker();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Estudio',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await startTask(formData.title, formData.category, formData.description);
      setShowForm(false);
      setFormData({ title: '', category: 'Estudio', description: '' });
    } catch (error) {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStopTask = async () => {
    setIsSubmitting(true);
    try {
      await stopTask();
    } catch (error) {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-dark-surface rounded-xl p-4 sm:p-6 border border-dark-border">
        <div className="animate-pulse">
          <div className="h-6 bg-dark-elevated rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-dark-elevated rounded"></div>
        </div>
      </div>
    );
  }

  // Active task view
  if (activeTask) {
    const categoryInfo = getCategoryInfo(activeTask.category);

    return (
      <div className="bg-dark-surface rounded-xl p-4 sm:p-6 border border-dark-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-primary text-base sm:text-lg">
            Tarea en Progreso
          </h3>
          <button
            onClick={cancelTask}
            className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition"
            title="Cancelar tarea"
          >
            <X size={18} />
          </button>
        </div>

        {/* Category and title */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-lg text-xs font-medium bg-dark-elevated text-text-secondary border border-dark-border flex items-center gap-1.5`}>
              {ICON_MAP[categoryInfo.icon] && (() => { const Icon = ICON_MAP[categoryInfo.icon]; return <Icon size={12} />; })()}
              {categoryInfo.label}
            </span>
          </div>
          <h4 className="text-lg sm:text-xl font-bold text-text-primary">
            {activeTask.title}
          </h4>
          {activeTask.description && (
            <p className="text-sm text-text-muted mt-1">{activeTask.description}</p>
          )}
        </div>

        {/* Timer */}
        <div className="bg-dark-bg rounded-xl p-4 sm:p-6 mb-4 border border-dark-border">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-mint-400 animate-pulse" />
            <span className="text-sm text-mint-400 font-medium">Tiempo transcurrido</span>
          </div>
          <div className="text-center">
            <span className="text-4xl sm:text-5xl font-mono font-bold text-text-primary">
              {formatElapsedTime()}
            </span>
          </div>
        </div>

        {/* Stop button */}
        <button
          onClick={handleStopTask}
          disabled={isSubmitting}
          className="w-full py-3 sm:py-4 bg-danger hover:bg-danger/90 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          <Square size={20} fill="currentColor" />
          <span>Detener Tarea</span>
        </button>
      </div>
    );
  }

  // No active task view
  return (
    <div className="bg-dark-surface rounded-xl p-4 sm:p-6 border border-dark-border">
      <h3 className="font-semibold text-text-primary mb-3 sm:mb-4 text-base sm:text-lg">
        Registrar Tarea
      </h3>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-4 sm:py-6 border-2 border-dashed border-dark-border rounded-xl text-text-muted hover:border-mint-500/30 hover:text-mint-400 hover:bg-mint-500/5 transition flex flex-col items-center justify-center gap-2"
        >
          <Play size={32} className="text-mint-400" />
          <span className="font-medium">Iniciar nueva tarea</span>
          <span className="text-xs text-text-muted">Registra tu tiempo de trabajo</span>
        </button>
      ) : (
        <form onSubmit={handleStartTask} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              ¿Qué vas a hacer?
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Estudiar para examen de cálculo"
              className="input w-full"
              autoFocus
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <Tag size={14} className="inline mr-1" />
              Categoría
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1 border ${
                    formData.category === cat.value
                      ? 'bg-mint-500/15 text-mint-400 border-mint-500/30'
                      : 'bg-dark-elevated text-text-muted border-dark-border hover:border-dark-hover'
                  }`}
                >
                  {ICON_MAP[cat.icon] && (() => { const Icon = ICON_MAP[cat.icon]; return <Icon size={14} />; })()}
                  <span className="hidden sm:inline">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Descripción <span className="text-text-muted font-normal">(opcional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Añade detalles sobre la tarea..."
              className="input w-full resize-none"
              rows={2}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormData({ title: '', category: 'Estudio', description: '' });
              }}
              className="flex-1 py-2.5 bg-dark-elevated text-text-secondary rounded-lg font-medium hover:bg-dark-hover transition border border-dark-border"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="flex-1 py-2.5 btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play size={18} />
              <span>Iniciar</span>
            </button>
          </div>
        </form>
      )}

      {/* Tip */}
      {!showForm && (
        <div className="mt-4 p-3 bg-ocean-500/10 border border-ocean-500/20 rounded-lg text-xs sm:text-sm text-ocean-400">
          El tiempo se registra automáticamente hasta que detengas la tarea.
        </div>
      )}
    </div>
  );
}
