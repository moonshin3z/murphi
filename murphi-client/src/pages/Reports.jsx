import { useState, useEffect } from 'react';
import { FileText, Heart, TrendingUp, TrendingDown, Clock, CheckCircle, RefreshCw, Calendar, Sparkles } from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import { useFormatMoney } from '../hooks/useFormatMoney';
import api from '../services/api';

export default function Reports() {
  const { formatMoney } = useFormatMoney();
  const [report, setReport] = useState(null);
  const [healthScore, setHealthScore] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportRes, scoreRes] = await Promise.all([
        api.get('/api/ai/weekly-report'),
        api.get('/api/ai/health-score')
      ]);
      setReport(reportRes.data);
      setHealthScore(scoreRes.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-mint-400';
    if (score >= 60) return 'text-ocean-400';
    if (score >= 40) return 'text-warning';
    return 'text-danger';
  };

  const getScoreStroke = (score) => {
    if (score >= 80) return '#3FB68B';
    if (score >= 60) return '#58A6FF';
    if (score >= 40) return '#D29922';
    return '#F85149';
  };

  const getFactorColor = (status) => {
    switch (status) {
      case 'excellent': return 'bg-mint-500/10 text-mint-400 border-mint-500/30';
      case 'good': return 'bg-ocean-500/10 text-ocean-400 border-ocean-500/30';
      case 'fair': return 'bg-warning/10 text-warning border-warning/30';
      case 'poor': return 'bg-danger/10 text-danger border-danger/30';
      default: return 'bg-dark-elevated text-text-muted border-dark-border';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-dark-bg">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner w-10 h-10 mx-auto mb-4" />
            <p className="text-text-muted">Generando reportes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-text-primary flex items-center gap-2">
              <FileText className="text-purple-400" />
              Reportes
            </h1>
            <p className="text-sm text-text-secondary">Tu resumen semanal y salud financiera</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-dark-surface border border-dark-border rounded-lg hover:bg-dark-elevated transition text-text-secondary hover:text-text-primary"
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Health Score - Columna izquierda */}
          <div className="lg:col-span-1">
            <div className="bg-dark-surface rounded-xl p-5 border border-dark-border">
              <h2 className="text-base font-semibold text-text-primary mb-5 flex items-center gap-2">
                <Heart className="text-danger" size={18} />
                Salud Financiera
              </h2>

              {healthScore && (
                <>
                  {/* Score Circle */}
                  <div className="relative w-40 h-40 mx-auto mb-5">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#21262D"
                        strokeWidth="10"
                        fill="none"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke={getScoreStroke(healthScore.score)}
                        strokeWidth="10"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 70}
                        strokeDashoffset={2 * Math.PI * 70 * (1 - healthScore.score / 100)}
                        className="transition-all duration-1000"
                        style={{ filter: `drop-shadow(0 0 6px ${getScoreStroke(healthScore.score)}40)` }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl mb-1">{healthScore.emoji}</span>
                      <span className={`text-3xl font-bold ${getScoreColor(healthScore.score)}`}>
                        {healthScore.score}
                      </span>
                      <span className="text-xs text-text-muted">{healthScore.level}</span>
                    </div>
                  </div>

                  {/* Factors */}
                  <div className="space-y-2">
                    {healthScore.factors?.map((factor, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border ${getFactorColor(factor.status)}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-sm">{factor.name}</span>
                          <span className="text-xs font-semibold">
                            {factor.points > 0 ? '+' : ''}{factor.points} pts
                          </span>
                        </div>
                        <p className="text-[10px] opacity-80">{factor.detail}</p>
                      </div>
                    ))}
                  </div>

                  {/* AI Tip */}
                  {healthScore.aiTip && (
                    <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Sparkles size={14} className="text-purple-400 mt-0.5" />
                        <p className="text-xs text-purple-300">{healthScore.aiTip}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Weekly Report - Columna derecha */}
          <div className="lg:col-span-2 space-y-4">
            {/* Period Header */}
            {report && (
              <div className="bg-gradient-to-r from-purple-500/20 to-ocean-500/20 rounded-xl p-5 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-purple-400" />
                  <span className="text-xs text-text-muted">Reporte Semanal</span>
                </div>
                <h2 className="text-lg font-semibold text-text-primary mb-3">
                  {new Date(report.period.start).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - {new Date(report.period.end).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </h2>
                {report.aiSummary && (
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {report.aiSummary}
                  </p>
                )}
              </div>
            )}

            {/* Stats Grid */}
            {report && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-dark-surface rounded-xl p-4 border border-dark-border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-mint-400" size={16} />
                    <span className="text-xs text-text-muted">Ingresos</span>
                  </div>
                  <p className="text-lg font-bold text-text-primary">
                    {formatMoney(report.finances.income)}
                  </p>
                </div>

                <div className="bg-dark-surface rounded-xl p-4 border border-dark-border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="text-danger" size={16} />
                    <span className="text-xs text-text-muted">Gastos</span>
                  </div>
                  <p className="text-lg font-bold text-text-primary">
                    {formatMoney(report.finances.expenses)}
                  </p>
                </div>

                <div className="bg-dark-surface rounded-xl p-4 border border-dark-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="text-ocean-400" size={16} />
                    <span className="text-xs text-text-muted">Horas estudio</span>
                  </div>
                  <p className="text-lg font-bold text-text-primary">
                    {report.productivity.studyHours}h
                  </p>
                </div>

                <div className="bg-dark-surface rounded-xl p-4 border border-dark-border">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="text-purple-400" size={16} />
                    <span className="text-xs text-text-muted">Tareas</span>
                  </div>
                  <p className="text-lg font-bold text-text-primary">
                    {report.productivity.tasksCompleted}
                  </p>
                </div>
              </div>
            )}

            {/* Balance & Details */}
            {report && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Financial Balance */}
                <div className="bg-dark-surface rounded-xl p-5 border border-dark-border">
                  <h3 className="font-semibold text-text-primary mb-4 text-sm">Balance Semanal</h3>
                  <div className={`text-2xl font-bold mb-2 ${report.finances.balance >= 0 ? 'text-mint-400' : 'text-danger'}`}>
                    {report.finances.balance >= 0 ? '+' : ''}{formatMoney(report.finances.balance)}
                  </div>
                  <p className="text-xs text-text-muted">
                    {report.finances.transactionCount} transacciones registradas
                  </p>

                  {/* Categories */}
                  {Object.keys(report.finances.byCategory).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-dark-border">
                      <p className="text-xs font-medium text-text-secondary mb-3">Gastos por categoría:</p>
                      <div className="space-y-2">
                        {Object.entries(report.finances.byCategory)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 5)
                          .map(([cat, amount]) => (
                            <div key={cat} className="flex justify-between items-center">
                              <span className="text-xs text-text-muted">{cat}</span>
                              <span className="text-xs font-medium text-text-primary">{formatMoney(amount)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Productivity Details */}
                <div className="bg-dark-surface rounded-xl p-5 border border-dark-border">
                  <h3 className="font-semibold text-text-primary mb-4 text-sm">Productividad</h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-ocean-500/10 border border-ocean-500/20 rounded-lg">
                      <span className="text-xs text-ocean-400">Sesiones de estudio</span>
                      <span className="font-bold text-ocean-400">{report.productivity.sessionsCount}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <span className="text-xs text-purple-400">Pomodoros completados</span>
                      <span className="font-bold text-purple-400">{report.productivity.pomodoros}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-mint-500/10 border border-mint-500/20 rounded-lg">
                      <span className="text-xs text-mint-400">Minutos totales</span>
                      <span className="font-bold text-mint-400">{report.productivity.studyMinutes} min</span>
                    </div>

                    {report.productivity.mostProductiveDay && (
                      <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                        <p className="text-xs text-warning">
                          <span className="font-semibold">Día más productivo:</span> {report.productivity.mostProductiveDay}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
