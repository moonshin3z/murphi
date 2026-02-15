import { useState, useEffect } from 'react';
import {
  Brain, TrendingUp, BookOpen, AlertTriangle, Sparkles, RefreshCw, Calendar, Target, Zap,
  Hand, Home, Wallet, FileText, AlertCircle, Banknote, ListTodo, TrendingDown,
  CreditCard, CheckCircle, Clock, Star, Lightbulb, Coffee, Timer, Moon, Sun,
  DollarSign, PiggyBank, ShoppingCart, Utensils, Car, Gift, Scale, XCircle, ThumbsUp,
  PieChart, ArrowRight
} from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import { useFormatMoney } from '../hooks/useFormatMoney';
import api from '../services/api';

// Mapa de iconos para renderizar desde strings del backend
const ICON_MAP = {
  Hand, Home, Wallet, FileText, BookOpen, TrendingUp, AlertTriangle, Star,
  AlertCircle, Banknote, ListTodo, TrendingDown, CreditCard, CheckCircle,
  Clock, Target, Lightbulb, Coffee, Timer, Moon, Sun, DollarSign, PiggyBank,
  ShoppingCart, Utensils, Car, Gift, Brain, Zap, Sparkles, Calendar, Scale,
  XCircle, ThumbsUp
};

// Helper para renderizar iconos dinámicos
const DynamicIcon = ({ name, size = 18, className = '' }) => {
  const Icon = ICON_MAP[name];
  if (Icon) return <Icon size={size} className={className} />;
  return null;
};

export default function Insights() {
  const { formatMoney } = useFormatMoney();
  const [data, setData] = useState(null);
  const [advancedInsights, setAdvancedInsights] = useState(null);
  const [budgetAllocation, setBudgetAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const [response, advancedRes, budgetRes] = await Promise.all([
        api.get('/api/ai/all'),
        api.get('/api/ai/advanced-insights').catch(() => ({ data: null })),
        api.get('/api/ai/budget-allocation').catch(() => ({ data: null }))
      ]);
      setData(response.data);
      setAdvancedInsights(advancedRes.data);
      setBudgetAllocation(budgetRes.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar insights');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-dark-bg">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner w-10 h-10 mx-auto mb-4" />
            <p className="text-text-muted">Analizando tus datos...</p>
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
              <Brain className="text-purple-400" />
              Insights IA
            </h1>
            <p className="text-sm text-text-secondary">Análisis inteligente de tus patrones</p>
          </div>
          <button
            onClick={fetchInsights}
            className="flex items-center gap-2 px-4 py-2 bg-dark-surface border border-dark-border rounded-lg hover:bg-dark-elevated transition text-text-secondary hover:text-text-primary"
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Alertas */}
        {data?.alerts?.alerts?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
              <AlertTriangle className="text-warning" size={18} />
              Alertas
            </h2>
            <div className="space-y-3">
              {data.alerts.alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'critical'
                      ? 'bg-danger/10 border-danger'
                      : 'bg-warning/10 border-warning'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={alert.severity === 'critical' ? 'text-danger' : 'text-warning'}>
                      <DynamicIcon name={alert.icon} size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-text-primary text-sm">{alert.title}</h3>
                      <p className="text-xs text-text-secondary">{alert.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sección de Análisis Avanzado */}
        {advancedInsights && !advancedInsights.isNewUser && (
          <div className="mb-6 space-y-4">
            {/* Modo Supervivencia */}
            {advancedInsights.survival && (
              <div className="bg-dark-surface rounded-xl p-5 border border-dark-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-purple-500/15 rounded-xl">
                    <Calendar className="text-purple-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Modo Supervivencia</h3>
                    <p className="text-xs text-text-muted">Específico para estudiantes foráneos</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className={`rounded-lg p-4 border ${
                    advancedInsights.survival.status === 'danger' ? 'bg-danger/10 border-danger/30' :
                    advancedInsights.survival.status === 'warning' ? 'bg-warning/10 border-warning/30' :
                    'bg-mint-500/10 border-mint-500/30'
                  }`}>
                    <div className="text-xs text-text-muted mb-1">Días de Supervivencia</div>
                    <div className="text-2xl font-bold text-text-primary">{advancedInsights.survival.daysRemaining}</div>
                    <div className="text-[10px] text-text-muted mt-1">Con tu ritmo actual de gastos</div>
                  </div>

                  <div className="bg-ocean-500/10 border border-ocean-500/30 rounded-lg p-4">
                    <div className="text-xs text-text-muted mb-1">Presupuesto Diario</div>
                    <div className="text-2xl font-bold text-ocean-400">{formatMoney(advancedInsights.survival.dailyBudget)}</div>
                    <div className="text-[10px] text-text-muted mt-1">Por día hasta fin de mes</div>
                  </div>

                  <div className="bg-dark-elevated border border-dark-border rounded-lg p-4">
                    <div className="text-xs text-text-muted mb-1">Balance Actual</div>
                    <div className={`text-2xl font-bold ${parseFloat(advancedInsights.survival.currentBalance) >= 0 ? 'text-mint-400' : 'text-danger'}`}>
                      {formatMoney(advancedInsights.survival.currentBalance)}
                    </div>
                    <div className="text-[10px] text-text-muted mt-1">Disponible ahora</div>
                  </div>
                </div>
              </div>
            )}

            {/* Predicciones del Mes */}
            {advancedInsights.predictions && (
              <div className="bg-dark-surface rounded-xl p-5 border border-dark-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-cyan-500/15 rounded-xl">
                    <TrendingUp className="text-cyan-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Predicción del Mes</h3>
                    <p className="text-xs text-text-muted">Basado en tus patrones actuales</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className={`${advancedInsights.predictions.willSurvive ? 'bg-mint-500/10 border-mint-500/30' : 'bg-danger/10 border-danger/30'} border rounded-lg p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-text-secondary">Balance al final del mes:</span>
                      <span className={`text-xl font-bold ${parseFloat(advancedInsights.predictions.endMonthBalance) >= 0 ? 'text-mint-400' : 'text-danger'}`}>
                        {formatMoney(advancedInsights.predictions.endMonthBalance)}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted">
                      {advancedInsights.predictions.willSurvive
                        ? 'Proyección positiva: Terminarás el mes en verde'
                        : 'Proyección negativa: Necesitas reducir gastos'
                      }
                    </div>
                  </div>

                  <div className="bg-dark-elevated rounded-lg p-4 border border-dark-border">
                    <div className="text-xs text-text-muted mb-1">Gastos proyectados del mes</div>
                    <div className="text-lg font-bold text-text-primary">{formatMoney(advancedInsights.predictions.totalExpensesProjected)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Correlaciones Inteligentes */}
            {advancedInsights.correlations && advancedInsights.correlations.length > 0 && (
              <div className="bg-dark-surface rounded-xl p-5 border border-dark-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-pink-500/15 rounded-xl">
                    <Zap className="text-pink-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Correlaciones Inteligentes</h3>
                    <p className="text-xs text-text-muted">Patrones entre tus finanzas y productividad</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {advancedInsights.correlations.map((corr, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-3 border ${
                        corr.impact === 'positive' ? 'bg-mint-500/10 border-mint-500/30' :
                        corr.impact === 'high' ? 'bg-danger/10 border-danger/30' :
                        'bg-ocean-500/10 border-ocean-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={corr.impact === 'positive' ? 'text-mint-400' : corr.impact === 'high' ? 'text-danger' : 'text-ocean-400'}>
                          <DynamicIcon name={corr.icon} size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-text-primary">{corr.message}</p>
                          {corr.impact === 'high' && (
                            <p className="text-xs text-danger mt-1">Impacto significativo en tus resultados</p>
                          )}
                          {corr.impact === 'positive' && (
                            <p className="text-xs text-mint-400 mt-1">¡Sigue así!</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Consejos Personalizados */}
            {advancedInsights.advice && advancedInsights.advice.length > 0 && (
              <div className="bg-dark-surface rounded-xl p-5 border border-dark-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-purple-500/15 rounded-xl">
                    <Target className="text-purple-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Consejos Personalizados</h3>
                    <p className="text-xs text-text-muted">Basados en tu situación actual</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {advancedInsights.advice.map((adv, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-3 border-l-4 ${
                        adv.priority === 'urgent' ? 'bg-danger/10 border-danger' :
                        adv.priority === 'high' ? 'bg-warning/10 border-warning' :
                        adv.priority === 'positive' ? 'bg-mint-500/10 border-mint-500' :
                        'bg-ocean-500/10 border-ocean-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={
                          adv.priority === 'urgent' ? 'text-danger' :
                          adv.priority === 'high' ? 'text-warning' :
                          adv.priority === 'positive' ? 'text-mint-400' :
                          'text-ocean-400'
                        }>
                          <DynamicIcon name={adv.icon} size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-text-primary mb-1">{adv.message}</p>
                          <p className="text-xs text-text-secondary">
                            <span className="font-medium">Acción:</span> {adv.action}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mensaje si no hay datos suficientes */}
        {advancedInsights?.hasInsufficientData && (
          <div className="mb-6 bg-ocean-500/10 border border-ocean-500/30 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="text-ocean-400">
                <Lightbulb size={20} />
              </div>
              <div>
                <h3 className="font-medium text-ocean-400 text-sm">{advancedInsights.status?.message || 'Registra más datos para ver análisis avanzado'}</h3>
                <p className="text-xs text-text-muted mt-1">
                  Agrega ingresos y gastos para ver predicciones de supervivencia y consejos personalizados.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Distribución de Presupuesto */}
        {budgetAllocation && budgetAllocation.totalExpenses > 0 && (
          <div className="mb-6">
            <div className="bg-dark-surface rounded-xl p-5 border border-dark-border">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-mint-500/15 rounded-xl">
                  <PieChart className="text-mint-400" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Distribución de Presupuesto</h3>
                  <p className="text-xs text-text-muted">Regla 50/30/20 adaptada a tu situación</p>
                </div>
              </div>

              {/* Resumen de ingresos y gastos */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-dark-bg rounded-lg p-3 border border-dark-border">
                  <div className="text-xs text-text-muted mb-1">Ingresos</div>
                  <div className="text-lg font-bold text-mint-400">{formatMoney(budgetAllocation.totalIncome)}</div>
                </div>
                <div className="bg-dark-bg rounded-lg p-3 border border-dark-border">
                  <div className="text-xs text-text-muted mb-1">Gastos</div>
                  <div className="text-lg font-bold text-danger">{formatMoney(budgetAllocation.totalExpenses)}</div>
                </div>
                <div className="bg-dark-bg rounded-lg p-3 border border-dark-border">
                  <div className="text-xs text-text-muted mb-1">Disponible</div>
                  <div className={`text-lg font-bold ${(budgetAllocation.totalIncome - budgetAllocation.totalExpenses) >= 0 ? 'text-mint-400' : 'text-danger'}`}>
                    {formatMoney(budgetAllocation.totalIncome - budgetAllocation.totalExpenses)}
                  </div>
                </div>
              </div>

              {/* Barras de distribución 50/30/20 */}
              <div className="space-y-4 mb-5">
                {Object.entries(budgetAllocation.allocation).map(([key, data]) => {
                  const colors = {
                    necesidades: { bar: 'bg-ocean-500', bg: 'bg-ocean-500/15', text: 'text-ocean-400', border: 'border-ocean-500/30' },
                    deseos: { bar: 'bg-purple-500', bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
                    ahorro: { bar: 'bg-mint-500', bg: 'bg-mint-500/15', text: 'text-mint-400', border: 'border-mint-500/30' }
                  };
                  const color = colors[key];
                  const isOver = data.current > data.recommended;
                  const barWidth = Math.min(data.current, 100);

                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-sm ${color.bar}`} />
                          <span className="text-sm font-medium text-text-primary">{data.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-semibold ${isOver ? 'text-warning' : color.text}`}>
                            {data.current}%
                          </span>
                          <ArrowRight size={12} className="text-text-muted" />
                          <span className={`text-xs ${color.text} font-medium`}>
                            {data.recommended}%
                          </span>
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      <div className="relative h-2.5 bg-dark-bg rounded-full overflow-hidden">
                        {/* Marca del porcentaje recomendado */}
                        <div
                          className="absolute top-0 bottom-0 w-px bg-text-muted/40 z-10"
                          style={{ left: `${data.recommended}%` }}
                        />
                        {/* Barra actual */}
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-warning' : color.bar}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>

                      {/* Categorías y descripción */}
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-[11px] text-text-muted">{data.description}</p>
                        {data.categories?.length > 0 && (
                          <p className="text-[10px] text-text-muted">{data.categories.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Barra visual combinada */}
              <div className="mb-5">
                <div className="text-xs text-text-muted mb-2">Tu distribución actual</div>
                <div className="flex h-3 rounded-full overflow-hidden bg-dark-bg">
                  <div
                    className="bg-ocean-500 transition-all duration-700"
                    style={{ width: `${Math.min(budgetAllocation.allocation.necesidades.current, 100)}%` }}
                  />
                  <div
                    className="bg-purple-500 transition-all duration-700"
                    style={{ width: `${Math.min(budgetAllocation.allocation.deseos.current, 100 - budgetAllocation.allocation.necesidades.current)}%` }}
                  />
                  <div
                    className="bg-mint-500 transition-all duration-700"
                    style={{ width: `${Math.max(budgetAllocation.allocation.ahorro.current, 0)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-ocean-400">Necesidades</span>
                  <span className="text-[10px] text-purple-400">Deseos</span>
                  <span className="text-[10px] text-mint-400">Ahorro</span>
                </div>
              </div>

              {/* Metas de ahorro activas */}
              {budgetAllocation.savingGoals?.length > 0 && (
                <div className="mb-5">
                  <div className="text-xs font-medium text-text-secondary mb-3">Metas de Ahorro</div>
                  <div className="space-y-2">
                    {budgetAllocation.savingGoals.map((goal, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 bg-dark-bg rounded-lg border border-dark-border">
                        <PiggyBank size={14} className="text-mint-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-text-primary truncate">{goal.name}</span>
                            <span className="text-xs text-mint-400 font-medium">{goal.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-dark-elevated rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="h-full bg-mint-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(goal.progress, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-text-muted">{formatMoney(goal.current)}</span>
                            <span className="text-[10px] text-text-muted">{formatMoney(goal.target)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recomendación de IA */}
              {budgetAllocation.aiRecommendation && (
                <div className="p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <div className="flex items-start gap-2.5">
                    <Sparkles size={14} className="text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-purple-300 leading-relaxed">{budgetAllocation.aiRecommendation}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Predicción de Gastos */}
          <div className="bg-dark-surface rounded-xl p-5 border border-dark-border">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="text-mint-400" size={18} />
              Predicción de Gastos
            </h2>

            {data?.predictions?.prediction ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-dark-bg rounded-lg border border-dark-border">
                  <p className="text-xs text-text-muted">Gasto estimado este mes</p>
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {formatMoney(data.predictions.prediction.total)}
                  </p>
                  {data.predictions.prediction.vsbudget && (
                    <p className={`text-xs mt-1 ${
                      data.predictions.prediction.vsbudget > 100
                        ? 'text-danger'
                        : 'text-mint-400'
                    }`}>
                      {data.predictions.prediction.vsbudget}% del presupuesto
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-text-secondary">Por categoría:</p>
                  {Object.entries(data.predictions.prediction.byCategory).map(([cat, info]) => (
                    <div key={cat} className="flex justify-between items-center py-2 border-b border-dark-border">
                      <span className="text-sm text-text-secondary">
                        {cat}
                        {info.isFixed && (
                          <span className="ml-2 text-[10px] bg-ocean-500/15 text-ocean-400 px-1.5 py-0.5 rounded">
                            Fijo
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-medium text-text-primary">{formatMoney(info.average)}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-text-muted">{data.predictions.message}</p>

                {data.predictions.aiInsight && (
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <p className="text-xs text-purple-300 flex items-start gap-2">
                      <Sparkles size={14} className="mt-0.5 flex-shrink-0" />
                      {data.predictions.aiInsight}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-text-muted text-center py-8 text-sm">
                {data?.predictions?.message || 'Agrega más transacciones para ver predicciones'}
              </p>
            )}
          </div>

          {/* Sugerencias de Estudio */}
          <div className="bg-dark-surface rounded-xl p-5 border border-dark-border">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <BookOpen className="text-ocean-400" size={18} />
              Sugerencias de Estudio
            </h2>

            {data?.suggestions?.suggestions?.length > 0 ? (
              <div className="space-y-3">
                {data.suggestions.suggestions.map((suggestion, i) => (
                  <div key={i} className="p-3 bg-dark-bg rounded-lg border border-dark-border">
                    <div className="flex items-start gap-3">
                      <div className="text-ocean-400">
                        <DynamicIcon name={suggestion.icon} size={18} />
                      </div>
                      <div>
                        <h3 className="font-medium text-text-primary text-sm">{suggestion.title}</h3>
                        <p className="text-xs text-text-muted mt-1">{suggestion.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-center py-8 text-sm">
                {data?.suggestions?.message || 'Registra sesiones de estudio para ver sugerencias'}
              </p>
            )}
          </div>

          {/* Insights Cruzados */}
          <div className="bg-dark-surface rounded-xl p-5 border border-dark-border lg:col-span-2">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Brain className="text-purple-400" size={18} />
              Correlaciones Finanzas + Productividad
            </h2>

            {data?.crossInsights?.insights?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.crossInsights.insights.map((insight, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                      insight.sentiment === 'positive'
                        ? 'bg-mint-500/10 border-mint-500/30'
                        : insight.sentiment === 'warning'
                        ? 'bg-warning/10 border-warning/30'
                        : 'bg-dark-bg border-dark-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={
                        insight.sentiment === 'positive' ? 'text-mint-400' :
                        insight.sentiment === 'warning' ? 'text-warning' :
                        'text-text-secondary'
                      }>
                        <DynamicIcon name={insight.icon} size={18} />
                      </div>
                      <div>
                        <h3 className="font-medium text-text-primary text-sm">{insight.title}</h3>
                        <p className="text-xs text-text-muted mt-1">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-center py-8 text-sm">
                {data?.crossInsights?.message || 'Necesitas más datos para ver correlaciones'}
              </p>
            )}
          </div>
        </div>

        {/* Nota sobre IA */}
        <div className="mt-6 text-center text-xs text-text-muted">
          <p>
            Los insights se generan con IA analizando tus patrones de gasto y estudio.
          </p>
        </div>
      </main>
    </div>
  );
}
