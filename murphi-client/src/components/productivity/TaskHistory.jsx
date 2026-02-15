import { useState, useEffect } from 'react';
import { Clock, Trash2, Calendar, Filter, ChevronDown, ChevronUp, BookOpen, Briefcase, Rocket, BookMarked, Dumbbell, Palette, FileText } from 'lucide-react';

const ICON_MAP = {
  BookOpen, Briefcase, Rocket, BookMarked, Dumbbell, Palette, FileText
};
import { useTaskTracker } from '../../context/TaskTrackerContext';

export default function TaskHistory() {
  const {
    taskLogs,
    summary,
    loadTaskLogs,
    loadSummary,
    deleteTaskLog,
    formatDuration,
    getCategoryInfo
  } = useTaskTracker();

  const [filter, setFilter] = useState('all');
  const [period, setPeriod] = useState('week');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        loadTaskLogs({ status: 'completed', limit: 20 }),
        loadSummary(period)
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [loadTaskLogs, loadSummary, period]);

  const filteredLogs = filter === 'all'
    ? taskLogs
    : taskLogs.filter(log => log.category === filter);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupedLogs = filteredLogs.reduce((groups, log) => {
    const date = new Date(log.startTime).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {});

  if (isLoading) {
    return (
      <div className="bg-dark-surface rounded-xl p-4 sm:p-6 border border-dark-border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-dark-elevated rounded w-1/3"></div>
          <div className="h-20 bg-dark-elevated rounded"></div>
          <div className="h-20 bg-dark-elevated rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-surface rounded-xl border border-dark-border overflow-hidden">
      {/* Header */}
      <div
        className="p-4 sm:p-6 border-b border-dark-border cursor-pointer hover:bg-dark-elevated/50 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-ocean-400" />
            <h3 className="font-semibold text-text-primary text-base sm:text-lg">
              Historial de Tareas
            </h3>
          </div>
          <button className="p-1 text-text-muted">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* Quick summary */}
        {summary && (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center p-2.5 bg-ocean-500/10 border border-ocean-500/20 rounded-lg">
              <div className="text-lg sm:text-xl font-bold text-ocean-400">
                {summary.totalTasks}
              </div>
              <div className="text-[10px] sm:text-xs text-text-muted">Tareas</div>
            </div>
            <div className="text-center p-2.5 bg-mint-500/10 border border-mint-500/20 rounded-lg">
              <div className="text-lg sm:text-xl font-bold text-mint-400">
                {summary.totalHours}h
              </div>
              <div className="text-[10px] sm:text-xs text-text-muted">Total</div>
            </div>
            <div className="text-center p-2.5 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="text-lg sm:text-xl font-bold text-warning">
                {summary.totalTasks > 0
                  ? Math.round(summary.totalSeconds / summary.totalTasks / 60)
                  : 0}m
              </div>
              <div className="text-[10px] sm:text-xs text-text-muted">Promedio</div>
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <>
          {/* Filters */}
          <div className="p-3 sm:p-4 border-b border-dark-border bg-dark-bg/50">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-text-muted">
                <Filter size={14} />
                <span className="hidden sm:inline">Filtrar:</span>
              </div>

              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="input px-2 py-1.5 text-xs sm:text-sm"
              >
                <option value="today">Hoy</option>
                <option value="week">Semana</option>
                <option value="month">Mes</option>
              </select>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input px-2 py-1.5 text-xs sm:text-sm"
              >
                <option value="all">Todas</option>
                <option value="Estudio">Estudio</option>
                <option value="Trabajo">Trabajo</option>
                <option value="Proyecto">Proyecto</option>
                <option value="Lectura">Lectura</option>
                <option value="Ejercicio">Ejercicio</option>
                <option value="Hobbies">Hobbies</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>

          {/* Task list */}
          <div className="max-h-80 sm:max-h-96 overflow-y-auto">
            {Object.keys(groupedLogs).length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay tareas registradas</p>
                <p className="text-xs mt-1">Inicia una tarea para ver tu historial</p>
              </div>
            ) : (
              Object.entries(groupedLogs).map(([date, logs]) => (
                <div key={date}>
                  {/* Date header */}
                  <div className="px-4 py-2 bg-dark-bg text-xs font-medium text-text-muted sticky top-0 border-b border-dark-border">
                    <Calendar size={12} className="inline mr-1" />
                    {formatDate(logs[0].startTime)}
                  </div>

                  {/* Day's tasks */}
                  {logs.map((log) => {
                    const categoryInfo = getCategoryInfo(log.category);
                    return (
                      <div
                        key={log._id}
                        className="px-4 py-3 border-b border-dark-border/50 hover:bg-dark-elevated/30 transition group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-2 h-2 rounded-full bg-ocean-500"></span>
                              <span className="text-xs text-text-muted flex items-center gap-1">
                                {ICON_MAP[categoryInfo.icon] && (() => { const Icon = ICON_MAP[categoryInfo.icon]; return <Icon size={10} />; })()}
                                {categoryInfo.label}
                              </span>
                            </div>
                            <h4 className="font-medium text-text-primary text-sm truncate">
                              {log.title}
                            </h4>
                            {log.description && (
                              <p className="text-xs text-text-muted truncate mt-0.5">
                                {log.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                              <span>{formatTime(log.startTime)}</span>
                              <span className="text-text-muted/50">→</span>
                              <span>{log.endTime ? formatTime(log.endTime) : '-'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-semibold text-mint-400 whitespace-nowrap">
                              {formatDuration(log.duration)}
                            </span>
                            <button
                              onClick={() => deleteTaskLog(log._id)}
                              className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg opacity-0 group-hover:opacity-100 transition"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Category summary */}
          {summary && summary.byCategory && Object.keys(summary.byCategory).length > 0 && (
            <div className="p-4 border-t border-dark-border bg-dark-bg/50">
              <h4 className="text-xs font-medium text-text-muted mb-2">Tiempo por categoría</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary.byCategory).map(([category, seconds]) => {
                  const categoryInfo = getCategoryInfo(category);
                  return (
                    <div
                      key={category}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-dark-elevated rounded-lg text-xs border border-dark-border"
                    >
                      {ICON_MAP[categoryInfo.icon] && (() => { const Icon = ICON_MAP[categoryInfo.icon]; return <Icon size={12} className="text-text-muted" />; })()}
                      <span className="text-text-secondary">{formatDuration(seconds)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
