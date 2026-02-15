import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, TrendingDown, Clock, X, DollarSign, BookOpen, Filter, Plus, Timer, CheckCircle, Play, Trash2, Edit2, Save, CalendarDays, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../components/common/Sidebar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useFormatMoney } from '../hooks/useFormatMoney';
import api from '../services/api';

const EXPENSE_CATEGORIES = ['Comida', 'Transporte', 'Ocio', 'Educación', 'Salud', 'Vivienda', 'Servicios', 'Otros'];
const TASK_CATEGORIES = ['Estudio', 'Trabajo', 'Proyecto', 'Lectura', 'Ejercicio', 'Hobbies', 'Otros'];

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function Timeline() {
  const { formatMoney } = useFormatMoney();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [timeline, setTimeline] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayDetails, setDayDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDay, setLoadingDay] = useState(false);
  const [dayTypeFilter, setDayTypeFilter] = useState('all');
  const [showOnlyWithActivity, setShowOnlyWithActivity] = useState(false);

  const [modalMode, setModalMode] = useState('view');
  const [addType, setAddType] = useState('expense');
  const [editingItem, setEditingItem] = useState(null); // { type: 'transaction'|'session'|'taskLog', data: {...} }
  const [editForm, setEditForm] = useState({});

  const [transactionForm, setTransactionForm] = useState({
    amount: '',
    category: 'Comida',
    description: '',
    type: 'expense'
  });

  const [studyForm, setStudyForm] = useState({
    subject: '',
    duration: 25,
    pomodorosCompleted: 1
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    category: 'Estudio',
    description: '',
    duration: 30
  });

  const filteredDays = useMemo(() => {
    if (!timeline?.days) return [];

    return timeline.days.map(day => {
      const hasActivity = day.transactions.length > 0 || day.sessions.length > 0 || (day.taskLogs && day.taskLogs.length > 0) || (day.tasks && day.tasks.length > 0);
      let show = true;

      if (dayTypeFilter !== 'all' && day.type !== dayTypeFilter) {
        show = false;
      }

      if (showOnlyWithActivity && !hasActivity) {
        show = false;
      }

      return { ...day, filtered: !show };
    });
  }, [timeline, dayTypeFilter, showOnlyWithActivity]);

  useEffect(() => {
    fetchTimeline();
  }, [currentYear, currentMonth]);

  const fetchTimeline = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get(`/api/timeline/month/${currentYear}/${currentMonth}`);
      setTimeline(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching timeline:', error);
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchDayDetails = async (dateString, silent = false) => {
    try {
      if (!silent) setLoadingDay(true);
      const response = await api.get(`/api/timeline/day/${dateString}`);
      setDayDetails(response.data);
    } catch (error) {
      console.error('Error fetching day details:', error);
    } finally {
      if (!silent) setLoadingDay(false);
    }
  };

  // Refrescar timeline + selectedDay + dayDetails después de una operación
  const refreshAfterChange = async (dayDate) => {
    const freshData = await fetchTimeline(true);
    if (freshData && dayDate) {
      const freshDay = freshData.days.find(d => d.date === dayDate);
      if (freshDay) setSelectedDay(freshDay);
    }
    // Silent: no mostrar spinner, mantener datos actuales visibles mientras carga
    await fetchDayDetails(dayDate, true);
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setModalMode('view');
    handleCancelEdit();
    fetchDayDetails(day.date);
  };

  const resetForms = () => {
    setTransactionForm({ amount: '', category: 'Comida', description: '', type: 'expense' });
    setStudyForm({ subject: '', duration: 25, pomodorosCompleted: 1 });
    setTaskForm({ title: '', category: 'Estudio', description: '', duration: 30 });
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!selectedDay) return;

    try {
      await api.post('/api/finances/transactions', {
        ...transactionForm,
        amount: parseFloat(transactionForm.amount),
        date: new Date(selectedDay.date)
      });
      toast.success(transactionForm.type === 'expense' ? 'Gasto registrado' : 'Ingreso registrado');
      resetForms();
      setModalMode('view');
      refreshAfterChange(selectedDay.date);
    } catch (error) {
      toast.error('Error al registrar transacción');
    }
  };

  const handleAddStudySession = async (e) => {
    e.preventDefault();
    if (!selectedDay) return;

    try {
      await api.post('/api/productivity/sessions', {
        ...studyForm,
        date: new Date(selectedDay.date)
      });
      toast.success('Sesión de estudio registrada');
      resetForms();
      setModalMode('view');
      refreshAfterChange(selectedDay.date);
    } catch (error) {
      toast.error('Error al registrar sesión');
    }
  };

  const handleAddTaskLog = async (e) => {
    e.preventDefault();
    if (!selectedDay) return;

    try {
      await api.post('/api/productivity/task-logs/completed', {
        title: taskForm.title,
        category: taskForm.category,
        description: taskForm.description,
        duration: taskForm.duration,
        date: new Date(selectedDay.date)
      });
      toast.success('Tarea registrada');
      resetForms();
      setModalMode('view');
      refreshAfterChange(selectedDay.date);
    } catch (error) {
      toast.error('Error al registrar tarea');
    }
  };

  const handleStartEdit = (type, item) => {
    setEditingItem({ type, id: item._id });
    if (type === 'transaction') {
      setEditForm({
        amount: item.amount,
        category: item.category,
        description: item.description || '',
        type: item.type,
        date: item.date?.split('T')[0] || selectedDay.date
      });
    } else if (type === 'session') {
      setEditForm({
        subject: item.subject,
        duration: item.duration,
        pomodorosCompleted: item.pomodorosCompleted,
        date: item.date?.split('T')[0] || selectedDay.date
      });
    } else if (type === 'taskLog') {
      setEditForm({
        title: item.title,
        category: item.category,
        description: item.description || '',
        startTime: item.startTime?.split('T')[0] || selectedDay.date
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    const newDate = editingItem.type === 'taskLog' ? editForm.startTime : editForm.date;
    const movedToOtherDay = newDate !== selectedDay.date;

    try {
      let response;

      if (editingItem.type === 'transaction') {
        const updateData = {
          amount: parseFloat(editForm.amount),
          category: editForm.category,
          description: editForm.description
        };
        if (movedToOtherDay) {
          const [y, m, d] = editForm.date.split('-').map(Number);
          updateData.date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        }
        response = await api.put(`/api/finances/transactions/${editingItem.id}`, updateData);
      } else if (editingItem.type === 'session') {
        const updateData = {
          subject: editForm.subject,
          duration: parseInt(editForm.duration),
          pomodorosCompleted: parseInt(editForm.pomodorosCompleted)
        };
        if (movedToOtherDay) {
          const [y, m, d] = editForm.date.split('-').map(Number);
          updateData.date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        }
        response = await api.put(`/api/productivity/sessions/${editingItem.id}`, updateData);
      } else if (editingItem.type === 'taskLog') {
        const updateData = {
          title: editForm.title,
          category: editForm.category,
          description: editForm.description
        };
        if (movedToOtherDay) {
          const [y, m, d] = editForm.startTime.split('-').map(Number);
          updateData.startTime = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        }
        response = await api.put(`/api/productivity/task-logs/${editingItem.id}`, updateData);
      }

      // Actualizar dayDetails inmediatamente con la respuesta del PUT
      if (!movedToOtherDay && response?.data) {
        setDayDetails(prev => {
          if (!prev) return prev;
          const updated = { ...prev };
          if (editingItem.type === 'transaction') {
            updated.transactions = prev.transactions.map(t =>
              t._id === editingItem.id ? response.data : t
            );
            const expenses = updated.transactions.filter(t => t.type === 'expense');
            const income = updated.transactions.filter(t => t.type === 'income');
            const totalExp = expenses.reduce((sum, t) => sum + t.amount, 0);
            const totalInc = income.reduce((sum, t) => sum + t.amount, 0);
            updated.summary = {
              ...updated.summary,
              totalExpenses: totalExp.toFixed(2),
              totalIncome: totalInc.toFixed(2),
              balance: (totalInc - totalExp).toFixed(2)
            };
          } else if (editingItem.type === 'session') {
            updated.sessions = prev.sessions.map(s =>
              s._id === editingItem.id ? response.data : s
            );
            const totalStudyMin = updated.sessions.reduce((sum, s) => sum + s.duration, 0);
            updated.summary = { ...updated.summary, studyHours: (totalStudyMin / 60).toFixed(1) };
          } else if (editingItem.type === 'taskLog') {
            updated.taskLogs = prev.taskLogs.map(t =>
              t._id === editingItem.id ? response.data : t
            );
          }
          return updated;
        });
      }

      if (movedToOtherDay) {
        const targetDate = new Date(newDate + 'T12:00:00');
        const targetLabel = targetDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
        toast.success(`Movido al ${targetLabel}`);
      } else {
        toast.success('Actualizado correctamente');
      }

      handleCancelEdit();
      // Refrescar timeline en background para actualizar calendario
      await refreshAfterChange(selectedDay.date);
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('¿Eliminar este registro?')) return;
    try {
      if (type === 'transaction') {
        await api.delete(`/api/finances/transactions/${id}`);
      } else if (type === 'session') {
        await api.delete(`/api/productivity/sessions/${id}`);
      } else if (type === 'taskLog') {
        await api.delete(`/api/productivity/task-logs/${id}`);
      }
      toast.success('Eliminado correctamente');
      refreshAfterChange(selectedDay.date);
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  const getDayColor = (type, score) => {
    if (type === 'good') return 'bg-mint-500/15 border-mint-500/40 hover:bg-mint-500/25';
    if (type === 'regular') return 'bg-warning/15 border-warning/40 hover:bg-warning/25';
    if (type === 'bad') return 'bg-danger/15 border-danger/40 hover:bg-danger/25';
    return 'bg-dark-elevated border-dark-border hover:bg-dark-hover';
  };

  const getCalendarDays = () => {
    if (!filteredDays.length) return [];
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const emptyDays = Array(firstDay).fill(null);
    return [...emptyDays, ...filteredDays];
  };

  const hasActiveFilters = dayTypeFilter !== 'all' || showOnlyWithActivity;
  const visibleDays = filteredDays.filter(d => !d.filtered).length;

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
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Timeline</h1>
            <p className="text-sm text-text-secondary">Vista de calendario de tus finanzas y estudio</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-dark-surface rounded-xl p-4 border border-dark-border mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-dark-elevated rounded-lg transition text-text-secondary hover:text-text-primary"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="text-center">
              <h2 className="text-lg font-bold text-text-primary">
                {MONTHS[currentMonth - 1]} {currentYear}
              </h2>
              <button
                onClick={goToToday}
                className="text-sm text-mint-400 hover:text-mint-300 mt-1"
              >
                Ir a Hoy
              </button>
            </div>

            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-dark-elevated rounded-lg transition text-text-secondary hover:text-text-primary"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-dark-border">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-text-muted" />
              <span className="text-sm text-text-secondary">Filtrar:</span>
            </div>

            <select
              value={dayTypeFilter}
              onChange={(e) => setDayTypeFilter(e.target.value)}
              className="input px-3 py-1.5 text-sm"
            >
              <option value="all">Todos los días</option>
              <option value="good">Solo días buenos</option>
              <option value="regular">Solo días regulares</option>
              <option value="bad">Solo días malos</option>
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyWithActivity}
                onChange={(e) => setShowOnlyWithActivity(e.target.checked)}
                className="w-4 h-4 rounded border-dark-border bg-dark-bg text-mint-500 focus:ring-mint-500"
              />
              <span className="text-sm text-text-secondary">Solo días con actividad</span>
            </label>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setDayTypeFilter('all');
                  setShowOnlyWithActivity(false);
                }}
                className="text-sm text-danger hover:text-danger/80 flex items-center gap-1"
              >
                <X size={16} />
                Limpiar
              </button>
            )}

            {hasActiveFilters && (
              <span className="text-sm text-text-muted ml-auto">
                {visibleDays} de {filteredDays.length} días
              </span>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        {timeline && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-dark-surface rounded-xl p-4 border border-dark-border">
              <div className="text-xs text-text-muted mb-1">Gastos del Mes</div>
              <div className="text-xl font-bold text-danger">{formatMoney(timeline.summary.totalExpenses)}</div>
            </div>
            <div className="bg-dark-surface rounded-xl p-4 border border-dark-border">
              <div className="text-xs text-text-muted mb-1">Horas de Estudio</div>
              <div className="text-xl font-bold text-ocean-400">{timeline.summary.totalStudyHours}h</div>
            </div>
            <div className="bg-dark-surface rounded-xl p-4 border border-dark-border">
              <div className="text-xs text-text-muted mb-1">Horas en Tareas</div>
              <div className="text-xl font-bold text-purple-400">{timeline.summary.totalTaskHours}h</div>
            </div>
            <div className="bg-dark-surface rounded-xl p-4 border border-dark-border">
              <div className="text-xs text-text-muted mb-1">Días Buenos</div>
              <div className="text-xl font-bold text-mint-400">{timeline.summary.goodDays}</div>
            </div>
            <div className="bg-dark-surface rounded-xl p-4 border border-dark-border">
              <div className="text-xs text-text-muted mb-1">Score Promedio</div>
              <div className="text-xl font-bold text-text-primary">{timeline.summary.avgScore}/100</div>
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="bg-dark-surface rounded-xl p-4 lg:p-6 border border-dark-border">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="text-center font-medium text-text-muted text-xs py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {getCalendarDays().map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square"></div>;
              }

              const isToday = day.date === today.toISOString().split('T')[0];
              const hasActivity = day.transactions.length > 0 || day.sessions.length > 0 || (day.taskLogs && day.taskLogs.length > 0) || (day.tasks && day.tasks.length > 0);
              const isFiltered = day.filtered;

              return (
                <div
                  key={day.date}
                  onClick={() => !isFiltered && handleDayClick(day)}
                  className={`
                    aspect-square border rounded-lg p-1.5 lg:p-2 transition cursor-pointer group
                    ${isFiltered ? 'bg-dark-bg border-dark-border opacity-30 cursor-default' : getDayColor(day.type, day.score)}
                    ${isToday && !isFiltered ? 'ring-2 ring-mint-500' : ''}
                    ${!isFiltered ? 'hover:scale-[1.02]' : ''}
                  `}
                >
                  <div className="flex flex-col h-full justify-between relative">
                    <div className="text-right">
                      <span className={`text-xs font-bold ${isToday ? 'text-mint-400' : 'text-text-primary'}`}>
                        {day.day}
                      </span>
                    </div>

                    {hasActivity ? (
                      <div className="space-y-0.5">
                        {day.income > 0 && (
                          <div className="flex items-center gap-0.5 text-[10px] text-mint-400">
                            <TrendingUp size={10} />
                            <span className="truncate">{formatMoney(day.income)}</span>
                          </div>
                        )}
                        {day.expenses > 0 && (
                          <div className="flex items-center gap-0.5 text-[10px] text-danger">
                            <TrendingDown size={10} />
                            <span className="truncate">{formatMoney(day.expenses)}</span>
                          </div>
                        )}
                        {day.studyHours > 0 && (
                          <div className="flex items-center gap-0.5 text-[10px] text-ocean-400">
                            <Clock size={10} />
                            <span>{day.studyHours}h</span>
                          </div>
                        )}
                        {day.taskHours > 0 && (
                          <div className="flex items-center gap-0.5 text-[10px] text-purple-400">
                            <CheckCircle size={10} />
                            <span>{day.taskHours}h</span>
                          </div>
                        )}
                        {day.tasks?.filter(t => t.status !== 'completed').length > 0 && (
                          <div className="flex items-center gap-0.5 text-[10px] text-cyan-400">
                            <ClipboardList size={10} />
                            <span>{day.tasks.filter(t => t.status !== 'completed').length} pend.</span>
                          </div>
                        )}
                        {day.taskLogs?.some(t => t.status === 'active') && (
                          <div className="flex items-center gap-0.5 text-[10px] text-amber-400 animate-pulse">
                            <Play size={10} />
                            <span>Activa</span>
                          </div>
                        )}
                      </div>
                    ) : !isFiltered && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Plus size={20} className="text-text-muted/100" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-dark-border">
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-mint-500/15 border border-mint-500/40 rounded"></div>
                <span className="text-text-secondary">Día Bueno (70-100)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-warning/15 border border-warning/40 rounded"></div>
                <span className="text-text-secondary">Día Regular (40-69)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-danger/15 border border-danger/40 rounded"></div>
                <span className="text-text-secondary">Día Malo (0-39)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-dark-elevated border border-dark-border rounded"></div>
                <span className="text-text-secondary">Sin actividad</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Day Details Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-surface rounded-xl border border-dark-border max-w-2xl w-full max-h-[85vh] overflow-hidden animate-scaleIn">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-dark-border">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">
                    {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('es-MX', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </h2>
                  {selectedDay.score !== null && (
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                      selectedDay.type === 'good' ? 'bg-mint-500/15 text-mint-400' :
                      selectedDay.type === 'regular' ? 'bg-warning/15 text-warning' :
                      selectedDay.type === 'bad' ? 'bg-danger/15 text-danger' :
                      'bg-dark-elevated text-text-muted'
                    }`}>
                      Score: {selectedDay.score}/100
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setSelectedDay(null); setModalMode('view'); resetForms(); }}
                  className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-dark-elevated rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setModalMode('view')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
                    modalMode === 'view'
                      ? 'bg-mint-500/15 text-mint-400 border border-mint-500/30'
                      : 'bg-dark-elevated text-text-muted border border-dark-border hover:border-dark-hover'
                  }`}
                >
                  Ver Detalles
                </button>
                <button
                  onClick={() => setModalMode('add')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                    modalMode === 'add'
                      ? 'bg-mint-500/15 text-mint-400 border border-mint-500/30'
                      : 'bg-dark-elevated text-text-muted border border-dark-border hover:border-dark-hover'
                  }`}
                >
                  <Plus size={16} />
                  Agregar
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
              {modalMode === 'view' ? (
                <>
                  {loadingDay ? (
                    <div className="flex justify-center py-8">
                      <div className="spinner w-6 h-6" />
                    </div>
                  ) : dayDetails ? (
                    <div className="space-y-6">
                      {/* Summary */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-danger/10 border border-danger/20 rounded-lg p-3 text-center">
                          <div className="text-xs text-danger mb-1">Gastos</div>
                          <div className="text-base font-bold text-danger">{formatMoney(dayDetails.summary.totalExpenses)}</div>
                        </div>
                        <div className="bg-mint-500/10 border border-mint-500/20 rounded-lg p-3 text-center">
                          <div className="text-xs text-mint-400 mb-1">Ingresos</div>
                          <div className="text-base font-bold text-mint-400">{formatMoney(dayDetails.summary.totalIncome)}</div>
                        </div>
                        <div className="bg-ocean-500/10 border border-ocean-500/20 rounded-lg p-3 text-center">
                          <div className="text-xs text-ocean-400 mb-1">Estudio</div>
                          <div className="text-base font-bold text-ocean-400">{dayDetails.summary.studyHours}h</div>
                        </div>
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
                          <div className="text-xs text-purple-400 mb-1">Tareas</div>
                          <div className="text-base font-bold text-purple-400">{dayDetails.summary.taskHours}h</div>
                        </div>
                      </div>

                      {/* Transactions */}
                      {dayDetails.transactions.length > 0 && (
                        <div>
                          <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2 text-sm">
                            <DollarSign size={16} className="text-mint-400" />
                            Transacciones ({dayDetails.transactions.length})
                          </h3>
                          <div className="space-y-2">
                            {dayDetails.transactions.map(t => (
                              editingItem?.type === 'transaction' && editingItem?.id === t._id ? (
                                <div key={t._id} className="p-3 bg-dark-bg rounded-lg border border-mint-500/30 space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs text-text-muted mb-1">Monto</label>
                                      <input type="number" step="0.01" value={editForm.amount} onChange={(e) => setEditForm({...editForm, amount: e.target.value})} className="input w-full text-sm" />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-text-muted mb-1">Categoría</label>
                                      <select value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value})} className="input w-full text-sm">
                                        {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                      </select>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-text-muted mb-1">Descripción</label>
                                    <input type="text" value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="input w-full text-sm" placeholder="Descripción..." />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-text-muted mb-1 flex items-center gap-1"><CalendarDays size={12} /> Fecha</label>
                                    <input type="date" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} className="input w-full text-sm" />
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={handleSaveEdit} className="flex-1 py-1.5 bg-mint-500 text-dark-bg rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-mint-400 transition"><Save size={14} /> Guardar</button>
                                    <button onClick={handleCancelEdit} className="px-3 py-1.5 bg-dark-elevated text-text-muted rounded-lg text-sm hover:text-text-secondary transition">Cancelar</button>
                                  </div>
                                </div>
                              ) : (
                                <div key={t._id} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg border border-dark-border group">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${t.type === 'expense' ? 'bg-danger/10' : 'bg-mint-500/10'}`}>
                                      {t.type === 'expense' ?
                                        <TrendingDown size={14} className="text-danger" /> :
                                        <TrendingUp size={14} className="text-mint-400" />
                                      }
                                    </div>
                                    <div>
                                      <div className="font-medium text-text-primary text-sm">{t.category}</div>
                                      {t.description && <div className="text-xs text-text-muted">{t.description}</div>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold text-sm ${t.type === 'expense' ? 'text-danger' : 'text-mint-400'}`}>
                                      {t.type === 'expense' ? '-' : '+'}{formatMoney(t.amount)}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleStartEdit('transaction', t)} className="p-1.5 hover:bg-dark-elevated rounded-lg text-text-muted hover:text-ocean-400 transition"><Edit2 size={13} /></button>
                                      <button onClick={() => handleDelete('transaction', t._id)} className="p-1.5 hover:bg-dark-elevated rounded-lg text-text-muted hover:text-danger transition"><Trash2 size={13} /></button>
                                    </div>
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Study Sessions */}
                      {dayDetails.sessions.length > 0 && (
                        <div>
                          <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2 text-sm">
                            <BookOpen size={16} className="text-ocean-400" />
                            Sesiones de Estudio ({dayDetails.sessions.length})
                          </h3>
                          <div className="space-y-2">
                            {dayDetails.sessions.map(s => (
                              editingItem?.type === 'session' && editingItem?.id === s._id ? (
                                <div key={s._id} className="p-3 bg-dark-bg rounded-lg border border-ocean-500/30 space-y-3">
                                  <div>
                                    <label className="block text-xs text-text-muted mb-1">Materia</label>
                                    <input type="text" value={editForm.subject} onChange={(e) => setEditForm({...editForm, subject: e.target.value})} className="input w-full text-sm" />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs text-text-muted mb-1">Duración (min)</label>
                                      <input type="number" min="1" value={editForm.duration} onChange={(e) => setEditForm({...editForm, duration: e.target.value})} className="input w-full text-sm" />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-text-muted mb-1">Pomodoros</label>
                                      <input type="number" min="0" value={editForm.pomodorosCompleted} onChange={(e) => setEditForm({...editForm, pomodorosCompleted: e.target.value})} className="input w-full text-sm" />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-text-muted mb-1 flex items-center gap-1"><CalendarDays size={12} /> Fecha</label>
                                    <input type="date" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} className="input w-full text-sm" />
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={handleSaveEdit} className="flex-1 py-1.5 bg-ocean-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-ocean-400 transition"><Save size={14} /> Guardar</button>
                                    <button onClick={handleCancelEdit} className="px-3 py-1.5 bg-dark-elevated text-text-muted rounded-lg text-sm hover:text-text-secondary transition">Cancelar</button>
                                  </div>
                                </div>
                              ) : (
                                <div key={s._id} className="flex items-center justify-between p-3 bg-ocean-500/10 border border-ocean-500/20 rounded-lg group">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-ocean-500/15 rounded-lg">
                                      <Clock size={14} className="text-ocean-400" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-text-primary text-sm">{s.subject}</div>
                                      <div className="text-xs text-text-muted">{s.pomodorosCompleted} pomodoros</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-ocean-400 text-sm">{(s.duration / 60).toFixed(1)}h</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleStartEdit('session', s)} className="p-1.5 hover:bg-ocean-500/20 rounded-lg text-text-muted hover:text-ocean-400 transition"><Edit2 size={13} /></button>
                                      <button onClick={() => handleDelete('session', s._id)} className="p-1.5 hover:bg-danger/10 rounded-lg text-text-muted hover:text-danger transition"><Trash2 size={13} /></button>
                                    </div>
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Task Logs */}
                      {dayDetails.taskLogs && dayDetails.taskLogs.length > 0 && (
                        <div>
                          <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2 text-sm">
                            <CheckCircle size={16} className="text-purple-400" />
                            Tareas ({dayDetails.taskLogs.length})
                          </h3>
                          <div className="space-y-2">
                            {dayDetails.taskLogs.map(t => (
                              editingItem?.type === 'taskLog' && editingItem?.id === t._id ? (
                                <div key={t._id} className="p-3 bg-dark-bg rounded-lg border border-purple-500/30 space-y-3">
                                  <div>
                                    <label className="block text-xs text-text-muted mb-1">Título</label>
                                    <input type="text" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="input w-full text-sm" />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs text-text-muted mb-1">Categoría</label>
                                      <select value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value})} className="input w-full text-sm">
                                        {TASK_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-text-muted mb-1 flex items-center gap-1"><CalendarDays size={12} /> Fecha</label>
                                      <input type="date" value={editForm.startTime} onChange={(e) => setEditForm({...editForm, startTime: e.target.value})} className="input w-full text-sm" />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-text-muted mb-1">Descripción</label>
                                    <input type="text" value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="input w-full text-sm" placeholder="Descripción..." />
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={handleSaveEdit} className="flex-1 py-1.5 bg-purple-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-purple-400 transition"><Save size={14} /> Guardar</button>
                                    <button onClick={handleCancelEdit} className="px-3 py-1.5 bg-dark-elevated text-text-muted rounded-lg text-sm hover:text-text-secondary transition">Cancelar</button>
                                  </div>
                                </div>
                              ) : (
                                <div key={t._id} className={`flex items-center justify-between p-3 rounded-lg border group ${
                                  t.status === 'active'
                                    ? 'bg-amber-500/10 border-amber-500/30 animate-pulse'
                                    : 'bg-purple-500/10 border-purple-500/20'
                                }`}>
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${t.status === 'active' ? 'bg-amber-500/15' : 'bg-purple-500/15'}`}>
                                      {t.status === 'active'
                                        ? <Play size={14} className="text-amber-400" />
                                        : <CheckCircle size={14} className="text-purple-400" />
                                      }
                                    </div>
                                    <div>
                                      <div className="font-medium text-text-primary text-sm flex items-center gap-2">
                                        {t.title}
                                        {t.status === 'active' && (
                                          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-medium">
                                            EN CURSO
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-text-muted">{t.category}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {t.status === 'completed' && t.duration > 0 && (
                                      <span className="font-bold text-purple-400 text-sm">
                                        {t.duration >= 3600
                                          ? `${(t.duration / 3600).toFixed(1)}h`
                                          : `${Math.round(t.duration / 60)}min`
                                        }
                                      </span>
                                    )}
                                    {t.status !== 'active' && (
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleStartEdit('taskLog', t)} className="p-1.5 hover:bg-purple-500/20 rounded-lg text-text-muted hover:text-purple-400 transition"><Edit2 size={13} /></button>
                                        <button onClick={() => handleDelete('taskLog', t._id)} className="p-1.5 hover:bg-danger/10 rounded-lg text-text-muted hover:text-danger transition"><Trash2 size={13} /></button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pending Tasks */}
                      {dayDetails.tasks && dayDetails.tasks.length > 0 && (
                        <div>
                          <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2 text-sm">
                            <ClipboardList size={16} className="text-cyan-400" />
                            Tareas Pendientes ({dayDetails.tasks.filter(t => t.status !== 'completed').length})
                          </h3>
                          <div className="space-y-2">
                            {dayDetails.tasks.map(t => (
                              <div key={t._id} className={`flex items-center justify-between p-3 rounded-lg border ${
                                t.status === 'completed'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 opacity-60'
                                  : t.priority === 'high'
                                    ? 'bg-danger/10 border-danger/20'
                                    : t.priority === 'medium'
                                      ? 'bg-amber-500/10 border-amber-500/20'
                                      : 'bg-cyan-500/10 border-cyan-500/20'
                              }`}>
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${
                                    t.status === 'completed' ? 'bg-emerald-500/15' :
                                    t.priority === 'high' ? 'bg-danger/15' :
                                    t.priority === 'medium' ? 'bg-amber-500/15' : 'bg-cyan-500/15'
                                  }`}>
                                    {t.status === 'completed'
                                      ? <CheckCircle size={14} className="text-emerald-400" />
                                      : <ClipboardList size={14} className={
                                          t.priority === 'high' ? 'text-danger' :
                                          t.priority === 'medium' ? 'text-amber-400' : 'text-cyan-400'
                                        } />
                                    }
                                  </div>
                                  <div>
                                    <div className={`font-medium text-sm ${t.status === 'completed' ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                                      {t.title}
                                    </div>
                                    <div className="text-xs text-text-muted flex items-center gap-2">
                                      {t.subject && <span>{t.subject}</span>}
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                        t.priority === 'high' ? 'bg-danger/20 text-danger' :
                                        t.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-cyan-500/20 text-cyan-400'
                                      }`}>
                                        {t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Media' : 'Baja'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {t.estimatedTime > 0 && (
                                  <span className="text-xs text-text-muted">{t.estimatedTime} min</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No activity message */}
                      {dayDetails.transactions.length === 0 && dayDetails.sessions.length === 0 && (!dayDetails.taskLogs || dayDetails.taskLogs.length === 0) && (!dayDetails.tasks || dayDetails.tasks.length === 0) && (
                        <div className="text-center py-8 text-text-muted">
                          <Calendar size={40} className="mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No hay actividad registrada</p>
                          <button
                            onClick={() => setModalMode('add')}
                            className="mt-3 text-mint-400 hover:text-mint-300 font-medium text-sm"
                          >
                            + Agregar entrada
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-text-muted">
                      <Calendar size={40} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No hay actividad registrada</p>
                      <button
                        onClick={() => setModalMode('add')}
                        className="mt-3 text-mint-400 hover:text-mint-300 font-medium text-sm"
                      >
                        + Agregar entrada
                      </button>
                    </div>
                  )}
                </>
              ) : (
                // ADD MODE
                <div className="space-y-4">
                  {/* Type selector */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => { setAddType('expense'); setTransactionForm({...transactionForm, type: 'expense'}); }}
                      className={`p-3 rounded-lg text-sm font-medium transition flex flex-col items-center gap-1 border ${
                        addType === 'expense' ? 'bg-danger/15 text-danger border-danger/30' : 'bg-dark-elevated text-text-muted border-dark-border'
                      }`}
                    >
                      <TrendingDown size={18} />
                      <span>Gasto</span>
                    </button>
                    <button
                      onClick={() => { setAddType('income'); setTransactionForm({...transactionForm, type: 'income'}); }}
                      className={`p-3 rounded-lg text-sm font-medium transition flex flex-col items-center gap-1 border ${
                        addType === 'income' ? 'bg-mint-500/15 text-mint-400 border-mint-500/30' : 'bg-dark-elevated text-text-muted border-dark-border'
                      }`}
                    >
                      <TrendingUp size={18} />
                      <span>Ingreso</span>
                    </button>
                    <button
                      onClick={() => setAddType('study')}
                      className={`p-3 rounded-lg text-sm font-medium transition flex flex-col items-center gap-1 border ${
                        addType === 'study' ? 'bg-ocean-500/15 text-ocean-400 border-ocean-500/30' : 'bg-dark-elevated text-text-muted border-dark-border'
                      }`}
                    >
                      <BookOpen size={18} />
                      <span>Estudio</span>
                    </button>
                    <button
                      onClick={() => setAddType('task')}
                      className={`p-3 rounded-lg text-sm font-medium transition flex flex-col items-center gap-1 border ${
                        addType === 'task' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' : 'bg-dark-elevated text-text-muted border-dark-border'
                      }`}
                    >
                      <Timer size={18} />
                      <span>Tarea</span>
                    </button>
                  </div>

                  {/* Transaction Form */}
                  {(addType === 'expense' || addType === 'income') && (
                    <form onSubmit={handleAddTransaction} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Monto</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={transactionForm.amount}
                          onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                          className="input w-full"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Categoría</label>
                        <select
                          value={transactionForm.category}
                          onChange={(e) => setTransactionForm({...transactionForm, category: e.target.value})}
                          className="input w-full"
                        >
                          {EXPENSE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Descripción (opcional)</label>
                        <input
                          type="text"
                          value={transactionForm.description}
                          onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                          className="input w-full"
                          placeholder="Descripción..."
                        />
                      </div>
                      <button
                        type="submit"
                        className={`w-full py-3 rounded-lg font-semibold transition ${
                          addType === 'expense'
                            ? 'bg-danger text-white hover:bg-danger/90'
                            : 'bg-mint-500 text-dark-bg hover:bg-mint-400'
                        }`}
                      >
                        Registrar {addType === 'expense' ? 'Gasto' : 'Ingreso'}
                      </button>
                    </form>
                  )}

                  {/* Study Session Form */}
                  {addType === 'study' && (
                    <form onSubmit={handleAddStudySession} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Materia</label>
                        <input
                          type="text"
                          required
                          value={studyForm.subject}
                          onChange={(e) => setStudyForm({...studyForm, subject: e.target.value})}
                          className="input w-full"
                          placeholder="Ej: Matemáticas, Física..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1.5">Duración (min)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={studyForm.duration}
                            onChange={(e) => setStudyForm({...studyForm, duration: parseInt(e.target.value) || 0})}
                            className="input w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1.5">Pomodoros</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={studyForm.pomodorosCompleted}
                            onChange={(e) => setStudyForm({...studyForm, pomodorosCompleted: parseInt(e.target.value) || 0})}
                            className="input w-full"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3 bg-ocean-500 text-white rounded-lg font-semibold hover:bg-ocean-400 transition"
                      >
                        Registrar Sesión de Estudio
                      </button>
                    </form>
                  )}

                  {/* Task Log Form */}
                  {addType === 'task' && (
                    <form onSubmit={handleAddTaskLog} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">¿Qué hiciste?</label>
                        <input
                          type="text"
                          required
                          value={taskForm.title}
                          onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                          className="input w-full"
                          placeholder="Ej: Estudiar para examen..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Categoría</label>
                        <div className="grid grid-cols-4 gap-2">
                          {TASK_CATEGORIES.slice(0, 4).map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setTaskForm({...taskForm, category: cat})}
                              className={`py-2 px-2 rounded-lg text-xs font-medium transition border ${
                                taskForm.category === cat
                                  ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                                  : 'bg-dark-elevated text-text-muted border-dark-border'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Duración (minutos)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={taskForm.duration}
                          onChange={(e) => setTaskForm({...taskForm, duration: parseInt(e.target.value) || 0})}
                          className="input w-full"
                          placeholder="30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Descripción (opcional)</label>
                        <textarea
                          value={taskForm.description}
                          onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                          className="input w-full resize-none"
                          rows="2"
                          placeholder="Detalles..."
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-400 transition"
                      >
                        Registrar Tarea
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
