import { Flame, Trophy, Calendar } from 'lucide-react';

export default function StreakBadge({ current, longest, totalDays }) {
  return (
    <div className="bg-dark-surface rounded-xl p-5 border border-dark-border">
      <h3 className="font-semibold text-text-primary mb-4 text-sm">Tu Racha</h3>

      <div className="flex items-center justify-center mb-4">
        <div className="relative">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            current > 0
              ? 'bg-warning/15 border border-warning/30'
              : 'bg-dark-elevated border border-dark-border'
          }`}>
            <Flame
              size={40}
              className={current > 0 ? 'text-warning' : 'text-text-muted'}
              style={current > 0 ? { filter: 'drop-shadow(0 0 8px rgba(210, 153, 34, 0.4))' } : {}}
            />
          </div>
          <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${
            current > 0
              ? 'bg-warning text-dark-bg'
              : 'bg-dark-elevated text-text-muted border border-dark-border'
          }`}>
            {current} días
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="text-center p-3 bg-dark-bg rounded-lg border border-dark-border">
          <Trophy size={18} className="mx-auto text-warning mb-1.5" />
          <p className="text-xl font-bold text-text-primary">{longest}</p>
          <p className="text-[10px] text-text-muted">Mejor racha</p>
        </div>
        <div className="text-center p-3 bg-dark-bg rounded-lg border border-dark-border">
          <Calendar size={18} className="mx-auto text-ocean-400 mb-1.5" />
          <p className="text-xl font-bold text-text-primary">{totalDays}</p>
          <p className="text-[10px] text-text-muted">Días productivos</p>
        </div>
      </div>

      {current === 0 && (
        <p className="text-center text-xs text-text-muted mt-4 p-3 bg-dark-bg rounded-lg border border-dark-border">
          ¡Completa una sesión de estudio para iniciar tu racha!
        </p>
      )}
    </div>
  );
}
