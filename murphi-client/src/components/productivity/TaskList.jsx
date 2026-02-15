import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, Edit2, CheckCircle, Circle, Clock } from 'lucide-react';

const priorityColors = {
  low: 'bg-mint-500/15 text-mint-400 border-mint-500/30',
  medium: 'bg-warning/15 text-warning border-warning/30',
  high: 'bg-danger/15 text-danger border-danger/30'
};

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta'
};

export default function TaskList({ tasks, onEdit, onDelete, onToggleStatus }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        No hay tareas registradas
      </div>
    );
  }

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task._id}
          className={`flex items-center justify-between p-3.5 bg-dark-bg rounded-lg border border-dark-border hover:border-dark-hover transition-colors group ${
            task.status === 'completed' ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => onToggleStatus(task._id, task.status === 'completed' ? 'pending' : 'completed')}
              className={`flex-shrink-0 transition ${
                task.status === 'completed' ? 'text-mint-400' : 'text-text-muted hover:text-mint-400'
              }`}
            >
              {task.status === 'completed' ? (
                <CheckCircle size={22} />
              ) : (
                <Circle size={22} />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm truncate ${
                task.status === 'completed' ? 'line-through text-text-muted' : 'text-text-primary'
              }`}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {task.subject && (
                  <span className="text-[10px] bg-dark-elevated text-text-secondary px-2 py-0.5 rounded border border-dark-border">
                    {task.subject}
                  </span>
                )}
                <span className={`text-[10px] px-2 py-0.5 rounded border ${priorityColors[task.priority]}`}>
                  {priorityLabels[task.priority]}
                </span>
                {task.dueDate && (
                  <span className={`text-[10px] flex items-center gap-1 ${
                    isOverdue(task.dueDate) && task.status !== 'completed'
                      ? 'text-danger'
                      : 'text-text-muted'
                  }`}>
                    <Clock size={10} />
                    {format(new Date(task.dueDate), 'dd MMM', { locale: es })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-text-muted hover:text-ocean-400 hover:bg-ocean-500/10 rounded-lg transition"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => onDelete(task._id)}
              className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
