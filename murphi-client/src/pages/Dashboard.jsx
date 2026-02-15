import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Wallet,
  Clock,
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Plus,
  X,
  Play,
  Calendar,
  ArrowUpRight,
  Lightbulb,
  Flame,
  RefreshCw,
  Settings
} from 'lucide-react';
import { getDailyDigest } from '../services/api';
import Sidebar from '../components/common/Sidebar';
import ChatMurphi from '../components/ai/ChatMurphi';
import { useAuth } from '../context/AuthContext';
import { useFormatMoney } from '../hooks/useFormatMoney';
import api from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const { formatMoney } = useFormatMoney();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);

  const [refreshingInsight, setRefreshingInsight] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ amount: '' });
  const [submitting, setSubmitting] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: 'Comida',
    description: '',
    type: 'expense'
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const today = new Date();
      const [summaryRes, timelineRes, digestRes] = await Promise.all([
        api.get('/api/finances/summary'),
        api.get(`/api/timeline/month/${today.getFullYear()}/${today.getMonth() + 1}`),
        getDailyDigest().catch(() => null)
      ]);
      setSummary(summaryRes.data);
      setTimeline(timelineRes.data);
      if (digestRes) setDigest(digestRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshInsight = async () => {
    if (refreshingInsight) return;
    setRefreshingInsight(true);
    try {
      const res = await getDailyDigest();
      if (res?.data?.dailyInsight) {
        setDigest(prev => ({ ...prev, dailyInsight: res.data.dailyInsight }));
      }
    } catch {}
    setRefreshingInsight(false);
  };

  const handleQuickExpense = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post('/api/finances/transactions', {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        date: new Date()
      });
      setShowExpenseModal(false);
      setExpenseForm({ amount: '', category: 'Comida', description: '', type: 'expense' });
      fetchData();
      toast.success('Gasto registrado', {
        style: { background: '#161B22', color: '#E6EDF3', border: '1px solid #30363D' }
      });
    } catch (error) {
      toast.error('Error al registrar gasto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickTask = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post('/api/productivity/tasks', taskForm);
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', priority: 'medium' });
      toast.success('Tarea creada', {
        style: { background: '#161B22', color: '#E6EDF3', border: '1px solid #30363D' }
      });
    } catch (error) {
      toast.error('Error al crear tarea');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (submitting || !budgetForm.amount) return;
    setSubmitting(true);
    try {
      await api.post('/api/finances/budget', { amount: parseFloat(budgetForm.amount) });
      setShowBudgetModal(false);
      setBudgetForm({ amount: '' });
      fetchData();
      toast.success('Presupuesto actualizado', {
        style: { background: '#161B22', color: '#E6EDF3', border: '1px solid #30363D' }
      });
    } catch {
      toast.error('Error al guardar presupuesto');
    } finally {
      setSubmitting(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const categories = ['Comida', 'Transporte', 'Ocio', 'Educación', 'Salud', 'Vivienda', 'Otros'];

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6 pt-4 lg:pt-6 overflow-x-hidden">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl lg:text-2xl font-bold text-text-primary flex items-center gap-2">
            <span>{getGreeting()}, <span className="text-gradient-mint">{user?.name?.split(' ')[0]}</span></span>
            {digest?.streak?.current > 1 && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-400/80">
                <Flame size={16} />
                {digest.streak.current}
              </span>
            )}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Aquí está tu resumen del día</p>
        </div>

        {/* Chat Inline - Prominente */}
        <ChatMurphi mode="inline" />

        {/* Daily Insight */}
        {digest?.dailyInsight && (
          <div className="mb-4 p-3.5 bg-dark-surface/50 rounded-xl border border-dark-border flex items-center gap-3">
            <Lightbulb size={16} className={`flex-shrink-0 ${
              digest.dailyInsight.type === 'positive' ? 'text-mint-400/80' :
              digest.dailyInsight.type === 'warning' ? 'text-amber-400/80' :
              'text-ocean-400/80'
            }`} />
            <p className="text-sm text-text-secondary flex-1">{digest.dailyInsight.text}</p>
            <button
              onClick={refreshInsight}
              disabled={refreshingInsight}
              className="flex-shrink-0 p-1 rounded-md text-text-muted hover:text-text-secondary transition-colors"
            >
              <RefreshCw size={13} className={refreshingInsight ? 'animate-spin' : ''} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner w-8 h-8" />
          </div>
        ) : (
          <>
            {/* Bento Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">

              {/* Quick Actions - spans 2 cols */}
              <div className="col-span-2 bg-dark-surface rounded-xl border border-dark-border p-5">
                <h2 className="text-sm font-medium text-text-secondary mb-4">Acciones rápidas</h2>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="flex flex-col items-center gap-2 p-4 bg-dark-bg rounded-xl border border-dark-border hover:border-danger/30 hover:bg-danger/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center group-hover:bg-danger/15 transition-colors">
                      <Plus size={18} className="text-danger" />
                    </div>
                    <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">Gasto</span>
                  </button>

                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="flex flex-col items-center gap-2 p-4 bg-dark-bg rounded-xl border border-dark-border hover:border-ocean-500/30 hover:bg-ocean-500/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-ocean-500/10 flex items-center justify-center group-hover:bg-ocean-500/15 transition-colors">
                      <Plus size={18} className="text-ocean-400" />
                    </div>
                    <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">Tarea</span>
                  </button>

                  <button
                    onClick={() => navigate('/productivity')}
                    className="flex flex-col items-center gap-2 p-4 bg-dark-bg rounded-xl border border-dark-border hover:border-mint-500/30 hover:bg-mint-500/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-mint-500/10 flex items-center justify-center group-hover:bg-mint-500/15 transition-colors">
                      <Play size={18} className="text-mint-400" />
                    </div>
                    <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">Pomodoro</span>
                  </button>
                </div>
              </div>

              {/* Balance Card */}
              <div className="bg-dark-surface rounded-xl border border-dark-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-text-secondary">Balance</span>
                  <div className="w-8 h-8 rounded-lg bg-mint-500/10 flex items-center justify-center">
                    <Wallet size={16} className="text-mint-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-text-primary">
                  {formatMoney((summary?.month?.income || 0) - (summary?.month?.expenses || 0))}
                </p>
                <p className="text-xs text-text-muted mt-1">Este mes</p>
                {digest?.forecast && (
                  <p className={`text-[11px] mt-0.5 ${digest.forecast.onTrack ? 'text-mint-400/70' : 'text-amber-400/70'}`}>
                    Proyección: {formatMoney(digest.forecast.projectedBalance)}
                  </p>
                )}
              </div>

              {/* Budget Progress */}
              <div className="bg-dark-surface rounded-xl border border-dark-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-text-secondary">Presupuesto</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${
                      (summary?.budget?.percentage || 0) > 80 ? 'text-danger' : 'text-mint-400'
                    }`}>
                      {summary?.budget?.percentage || 0}%
                    </span>
                    <button
                      onClick={() => {
                        setBudgetForm({ amount: summary?.budget?.limit || '' });
                        setShowBudgetModal(true);
                      }}
                      className="p-1 rounded-md text-text-muted hover:text-text-secondary transition-colors"
                    >
                      <Settings size={13} />
                    </button>
                  </div>
                </div>
                <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (summary?.budget?.percentage || 0) > 80 ? 'bg-danger' : 'bg-gradient-mint'
                    }`}
                    style={{ width: `${Math.min(summary?.budget?.percentage || 0, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-2">
                  {formatMoney(summary?.budget?.spent)} de {formatMoney(summary?.budget?.limit)}
                </p>
              </div>

              {/* Income Card */}
              <div className="bg-dark-surface rounded-xl border border-dark-border p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-mint-400" />
                  <span className="text-sm text-text-secondary">Ingresos</span>
                </div>
                <p className="text-xl font-bold text-text-primary">{formatMoney(summary?.month?.income)}</p>
              </div>

              {/* Expenses Card */}
              <div className="bg-dark-surface rounded-xl border border-dark-border p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown size={16} className="text-danger" />
                  <span className="text-sm text-text-secondary">Gastos</span>
                </div>
                <p className="text-xl font-bold text-text-primary">{formatMoney(summary?.month?.expenses)}</p>
              </div>

              {/* Goals Card */}
              <div className="bg-dark-surface rounded-xl border border-dark-border p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={16} className="text-ocean-400" />
                  <span className="text-sm text-text-secondary">Metas activas</span>
                </div>
                <p className="text-xl font-bold text-text-primary">{summary?.savingGoals?.active || 0}</p>
              </div>

              {/* Study Hours */}
              <div className="bg-dark-surface rounded-xl border border-dark-border p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-warning" />
                  <span className="text-sm text-text-secondary">Horas estudio</span>
                </div>
                <p className="text-xl font-bold text-text-primary">{timeline?.summary?.totalStudyHours || 0}h</p>
              </div>

              {/* Calendar Preview - spans 2 cols */}
              {timeline && (
                <div
                  onClick={() => navigate('/timeline')}
                  className="col-span-2 bg-dark-surface rounded-xl border border-dark-border p-5 cursor-pointer hover:border-mint-500/20 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-text-muted" />
                      <span className="text-sm font-medium text-text-primary">
                        {new Date().toLocaleDateString('es-MX', { month: 'long' })}
                      </span>
                    </div>
                    <ArrowUpRight size={16} className="text-text-muted group-hover:text-mint-400 transition-colors" />
                  </div>

                  {/* Mini Calendar */}
                  <div className="grid grid-cols-7 gap-2">
                    {(() => {
                      const today = new Date();
                      const days = [];
                      for (let i = 6; i >= 0; i--) {
                        const date = new Date(today);
                        date.setDate(today.getDate() - i);
                        const dateKey = date.toISOString().split('T')[0];
                        const dayData = timeline.days?.find(d => d.date === dateKey);
                        const isToday = i === 0;

                        days.push(
                          <div key={dateKey} className="text-center">
                            <div className="text-[10px] text-text-muted mb-1">
                              {date.toLocaleDateString('es-MX', { weekday: 'short' }).slice(0, 2)}
                            </div>
                            <div className={`
                              w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium mx-auto transition-all
                              ${isToday ? 'ring-1 ring-mint-500' : ''}
                              ${dayData?.type === 'good' ? 'bg-mint-500/20 text-mint-400' :
                                dayData?.type === 'regular' ? 'bg-warning/20 text-warning' :
                                dayData?.type === 'bad' ? 'bg-danger/20 text-danger' :
                                'bg-dark-bg text-text-muted'}
                            `}>
                              {date.getDate()}
                            </div>
                          </div>
                        );
                      }
                      return days;
                    })()}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-dark-border">
                    <div className="text-center">
                      <p className="text-lg font-bold text-text-primary">{timeline.summary?.goodDays || 0}</p>
                      <p className="text-xs text-text-muted">Buenos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-text-primary">{timeline.summary?.regularDays || 0}</p>
                      <p className="text-xs text-text-muted">Regular</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-text-primary">{timeline.summary?.avgScore || 0}</p>
                      <p className="text-xs text-text-muted">Score</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Links - spans 2 cols */}
              <div className="col-span-2 grid grid-cols-3 gap-3">
                <Link
                  to="/finances"
                  className="bg-dark-surface rounded-xl border border-dark-border p-4 hover:border-mint-500/20 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-mint-500/10 flex items-center justify-center mb-3 group-hover:bg-mint-500/15 transition-colors">
                    <Wallet size={18} className="text-mint-400" />
                  </div>
                  <p className="text-sm font-medium text-text-primary">Finanzas</p>
                  <p className="text-xs text-text-muted mt-0.5 hidden sm:block">Ver detalles</p>
                </Link>

                <Link
                  to="/productivity"
                  className="bg-dark-surface rounded-xl border border-dark-border p-4 hover:border-ocean-500/20 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-ocean-500/10 flex items-center justify-center mb-3 group-hover:bg-ocean-500/15 transition-colors">
                    <Clock size={18} className="text-ocean-400" />
                  </div>
                  <p className="text-sm font-medium text-text-primary">Productividad</p>
                  <p className="text-xs text-text-muted mt-0.5 hidden sm:block">Tareas y timer</p>
                </Link>

                <Link
                  to="/insights"
                  className="bg-dark-surface rounded-xl border border-dark-border p-4 hover:border-warning/20 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center mb-3 group-hover:bg-warning/15 transition-colors">
                    <Brain size={18} className="text-warning" />
                  </div>
                  <p className="text-sm font-medium text-text-primary">Insights</p>
                  <p className="text-xs text-text-muted mt-0.5 hidden sm:block">IA y predicciones</p>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-dark-surface rounded-2xl border border-dark-border p-6 max-w-md w-full animate-scaleIn">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-text-primary">Registrar gasto</h2>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-dark-elevated rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickExpense} className="space-y-4">
              <div>
                <label className="label">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  className="input"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="label">Categoría</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                  className="input"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Descripción (opcional)</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  className="input"
                  placeholder="Ej: Almuerzo"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-danger w-full py-3 disabled:opacity-50"
              >
                {submitting ? 'Registrando...' : 'Registrar gasto'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-dark-surface rounded-2xl border border-dark-border p-6 max-w-sm w-full animate-scaleIn">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-text-primary">Presupuesto mensual</h2>
              <button
                onClick={() => setShowBudgetModal(false)}
                className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-dark-elevated rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="label">Monto (Q)</label>
                <input
                  type="number"
                  value={budgetForm.amount}
                  onChange={e => setBudgetForm({ amount: e.target.value })}
                  className="input w-full"
                  placeholder="5000"
                  min="0"
                  step="100"
                  required
                />
                <p className="text-xs text-text-muted mt-1.5">
                  Límite máximo de gastos para este mes
                </p>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full py-3 disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : 'Guardar presupuesto'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-dark-surface rounded-2xl border border-dark-border p-6 max-w-md w-full animate-scaleIn">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-text-primary">Crear tarea</h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-dark-elevated rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickTask} className="space-y-4">
              <div>
                <label className="label">Título</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  className="input"
                  placeholder="Ej: Estudiar para examen"
                />
              </div>

              <div>
                <label className="label">Prioridad</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'low', label: 'Baja', color: 'mint' },
                    { value: 'medium', label: 'Media', color: 'warning' },
                    { value: 'high', label: 'Alta', color: 'danger' }
                  ].map(({ value, label, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTaskForm({...taskForm, priority: value})}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        taskForm.priority === value
                          ? `bg-${color}/15 text-${color === 'mint' ? 'mint-400' : color} ring-1 ring-${color === 'mint' ? 'mint-500' : color}/30`
                          : 'bg-dark-bg text-text-muted hover:bg-dark-elevated'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Descripción (opcional)</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  className="input resize-none"
                  rows="3"
                  placeholder="Detalles de la tarea..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full py-3 disabled:opacity-50"
              >
                {submitting ? 'Creando...' : 'Crear tarea'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
