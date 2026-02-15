import { useState, useEffect } from 'react';
import {
  Target, X, Hand, Home, Wallet, FileText, BookOpen,
  TrendingUp, AlertTriangle, Star, AlertCircle, Banknote,
  ListTodo, TrendingDown, CreditCard, CheckCircle, Clock
} from 'lucide-react';
import api from '../../services/api';

// Mapa de iconos para renderizar desde strings del backend
const ICON_MAP = {
  Hand, Home, Wallet, FileText, BookOpen, TrendingUp,
  AlertTriangle, Star, AlertCircle, Banknote, ListTodo,
  TrendingDown, CreditCard, CheckCircle, Clock, Target
};

const FIRST_STEPS_DISMISSED_KEY = 'murphi_first_steps_dismissed';

// Colores para los marcadores de actividad
const activityColors = {
  income: { bg: 'bg-mint-400', ring: 'ring-mint-500/30' },
  expense: { bg: 'bg-danger', ring: 'ring-danger/30' },
  study: { bg: 'bg-ocean-400', ring: 'ring-ocean-500/30' },
  task: { bg: 'bg-purple-400', ring: 'ring-purple-500/30' }
};

// Header visual minimalista - firma visual del producto
const VisualHeader = ({ activities = [] }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Obtiene la hora en zona horaria de Guatemala (GMT-6)
  const guatemalaTime = new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(time);

  const guatemalaDate = new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    hour: 'numeric',
    minute: 'numeric'
  });

  // Obtiene horas y minutos para el cálculo del progreso
  const timeParts = guatemalaDate.formatToParts(time);
  const hours = parseInt(timeParts.find(p => p.type === 'hour')?.value || '0');
  const minutes = parseInt(timeParts.find(p => p.type === 'minute')?.value || '0');

  // Calcula el progreso del día (0-100)
  const dayProgress = ((hours * 60 + minutes) / 1440) * 100;

  return (
    <div className="relative overflow-hidden rounded-2xl h-28 sm:h-32 bg-gradient-to-br from-dark-surface via-dark-elevated to-dark-surface border border-dark-border group">
      {/* Capa de gradiente animado sutil */}
      <div
        className="absolute inset-0 opacity-40 transition-opacity duration-1000 group-hover:opacity-60"
        style={{
          background: `linear-gradient(120deg,
            transparent 0%,
            rgba(63, 182, 139, 0.06) 25%,
            rgba(88, 166, 255, 0.05) 50%,
            rgba(63, 182, 139, 0.06) 75%,
            transparent 100%)`
        }}
      />

      {/* Línea de progreso del día - elemento central */}
      <div className="absolute inset-0 flex items-center justify-center px-10 sm:px-24">
        <div className="relative w-full max-w-md">
          {/* Track base */}
          <div className="h-0.5 bg-dark-border rounded-full" />

          {/* Línea de progreso activa */}
          <div
            className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-mint-500 to-ocean-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${dayProgress}%` }}
          />

          {/* Marcadores de actividades */}
          {activities.map((activity, index) => {
            const colors = activityColors[activity.type] || activityColors.task;
            return (
              <div
                key={activity.id || index}
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
                style={{ left: `${activity.timePercent}%` }}
              >
                <div className="relative group/marker">
                  {/* Punto del marcador */}
                  <div className={`relative w-2 h-2 rounded-full ${colors.bg} ring-2 ring-dark-bg cursor-pointer hover:scale-125 transition-transform`} />
                </div>
              </div>
            );
          })}

          {/* Punto indicador actual con pulso */}
          <div
            className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out z-10"
            style={{ left: `${dayProgress}%` }}
          >
            <div className="relative">
              {/* Pulso sutil */}
              <div className="absolute -inset-2 rounded-full bg-mint-500/20 animate-ping" style={{ animationDuration: '3s' }} />
              {/* Punto central */}
              <div className="relative w-2.5 h-2.5 rounded-full bg-mint-500 ring-2 ring-dark-bg" />
            </div>
          </div>
        </div>
      </div>

      {/* Contador de actividades - solo si hay */}
      {activities.length > 0 && (
        <div className="absolute top-3 left-4 sm:left-6">
          <div className="flex items-center gap-1.5 text-text-muted">
            <span className="text-xs font-medium">{activities.length}</span>
            <div className="flex gap-0.5">
              {activities.slice(0, 3).map((a, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${activityColors[a.type]?.bg || 'bg-text-muted'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reloj */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-6">
        <span className="text-2xl sm:text-3xl font-light tracking-tight text-text-primary tabular-nums">
          {guatemalaTime}
        </span>
      </div>

      {/* Indicador de fecha */}
      <div className="absolute bottom-3 left-4 sm:left-6">
        <span className="text-xs text-text-muted capitalize">
          {new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'short' })}
        </span>
      </div>

      {/* Efecto de brillo en hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
    </div>
  );
};

export default function AdvancedInsights({ quickActions }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayActivities, setTodayActivities] = useState([]);
  const [showFirstSteps, setShowFirstSteps] = useState(() => {
    return localStorage.getItem(FIRST_STEPS_DISMISSED_KEY) !== 'true';
  });

  const dismissFirstSteps = () => {
    localStorage.setItem(FIRST_STEPS_DISMISSED_KEY, 'true');
    setShowFirstSteps(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [insightsRes, activitiesRes] = await Promise.all([
        api.get('/api/ai/advanced-insights'),
        api.get('/api/timeline/today-activities').catch(() => ({ data: { activities: [] } }))
      ]);
      setInsights(insightsRes.data);
      setTodayActivities(activitiesRes.data.activities || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!insights) return null;

  // Estado de usuario nuevo - mostrar bienvenida
  if (insights.isNewUser) {
    return (
      <div className="space-y-6">
        {/* Header visual minimalista */}
        <VisualHeader activities={todayActivities} />

        {/* Quick Actions - Rendered from parent */}
        {quickActions}

        {/* Pasos para comenzar - Dismissible */}
        {showFirstSteps && (
          <div className="bg-dark-surface rounded-xl p-6 border border-mint-500/30 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-mint-500/20 rounded-xl">
                  <Target className="text-mint-400" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary text-lg">Primeros Pasos</h3>
                  <p className="text-sm text-text-muted">Configura tu perfil financiero</p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); dismissFirstSteps(); }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-muted hover:text-text-primary bg-dark-elevated hover:bg-dark-border rounded-lg transition"
              >
                <X size={16} />
                <span className="hidden sm:inline">Ocultar</span>
              </button>
            </div>

            <div className="space-y-3">
              {insights.advice.map((adv, index) => (
                <div
                  key={index}
                  className="rounded-lg p-4 bg-mint-500/10 border-l-4 border-mint-500"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-mint-400">
                      {ICON_MAP[adv.icon] ? (() => { const Icon = ICON_MAP[adv.icon]; return <Icon size={24} />; })() : null}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-text-primary mb-1">{adv.message}</p>
                      <p className="text-sm text-text-secondary">
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
    );
  }

  // Dashboard limpio - solo header visual y acciones rápidas
  return (
    <div className="space-y-6">
      {/* Header visual minimalista */}
      <VisualHeader activities={todayActivities} />

      {/* Quick Actions - Rendered from parent */}
      {quickActions}
    </div>
  );
}
