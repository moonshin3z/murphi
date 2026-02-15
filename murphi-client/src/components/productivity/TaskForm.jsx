import { useState } from 'react';
import { X, Flag } from 'lucide-react';

export default function TaskForm({ onSubmit, onClose, initialData }) {
  const [form, setForm] = useState(initialData || {
    title: '',
    subject: '',
    dueDate: '',
    priority: 'medium',
    estimatedTime: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      estimatedTime: form.estimatedTime ? parseInt(form.estimatedTime) : 0
    });
  };

  const priorityConfig = {
    low: { label: 'Baja', color: 'bg-mint-500/15 text-mint-400 border-mint-500/30', active: 'bg-mint-500 text-dark-bg border-mint-500' },
    medium: { label: 'Media', color: 'bg-warning/15 text-warning border-warning/30', active: 'bg-warning text-dark-bg border-warning' },
    high: { label: 'Alta', color: 'bg-danger/15 text-danger border-danger/30', active: 'bg-danger text-dark-bg border-danger' }
  };

  return (
    <div className="fixed inset-0 bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-surface rounded-xl border border-dark-border p-6 w-full max-w-md animate-scaleIn">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-text-primary">
            {initialData ? 'Editar' : 'Nueva'} Tarea
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-dark-elevated rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Título
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input w-full"
              placeholder="Ej: Entregar proyecto de física"
              required
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Materia <span className="text-text-muted font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="input w-full"
              placeholder="Ej: Física, Matemáticas"
            />
          </div>

          {/* Due date */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Fecha límite <span className="text-text-muted font-normal">(opcional)</span>
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="input w-full"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <Flag size={14} className="inline mr-1.5" />
              Prioridad
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high']).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p })}
                  className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all border ${
                    form.priority === p
                      ? priorityConfig[p].active
                      : 'bg-dark-elevated text-text-muted border-dark-border hover:border-dark-hover'
                  }`}
                >
                  {priorityConfig[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated time */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Tiempo estimado <span className="text-text-muted font-normal">(minutos)</span>
            </label>
            <input
              type="number"
              value={form.estimatedTime}
              onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })}
              className="input w-full"
              placeholder="60"
              min="0"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary w-full mt-2"
          >
            {initialData ? 'Guardar Cambios' : 'Agregar Tarea'}
          </button>
        </form>
      </div>
    </div>
  );
}
