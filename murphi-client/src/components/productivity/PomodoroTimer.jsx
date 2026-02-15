import { useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, SkipForward } from 'lucide-react';
import { usePomodoro } from '../../context/PomodoroContext';

const MODES = {
  work: { label: 'Trabajo', shortLabel: 'Trabajo', color: 'bg-danger', ring: 'ring-danger/30' },
  shortBreak: { label: 'Descanso corto', shortLabel: 'Corto', color: 'bg-mint-500', ring: 'ring-mint-500/30' },
  longBreak: { label: 'Descanso largo', shortLabel: 'Largo', color: 'bg-ocean-500', ring: 'ring-ocean-500/30' }
};

export default function PomodoroTimer({ onComplete, subject }) {
  const {
    timeLeft,
    isRunning,
    mode,
    completedPomodoros,
    formattedTime,
    progress,
    settings,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipToNext,
    setOnComplete,
    setCurrentSubject,
    hideFloating,
    showFloatingTimer
  } = usePomodoro();

  useEffect(() => {
    if (onComplete) {
      setOnComplete(onComplete);
    }
  }, [onComplete, setOnComplete]);

  useEffect(() => {
    if (subject) {
      setCurrentSubject(subject);
    }
  }, [subject, setCurrentSubject]);

  useEffect(() => {
    hideFloating();
    return () => {
      showFloatingTimer();
    };
  }, [hideFloating, showFloatingTimer]);

  const handleToggleTimer = () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer(subject, onComplete);
    }
  };

  const getStrokeColor = () => {
    if (mode === 'work') return '#F85149';
    if (mode === 'shortBreak') return '#3FB68B';
    return '#58A6FF';
  };

  const circumference = 2 * Math.PI * 70;

  return (
    <div className="bg-dark-surface rounded-xl p-4 sm:p-6 border border-dark-border">
      <h3 className="font-semibold text-text-primary mb-3 sm:mb-4 text-center text-base sm:text-lg">
        Pomodoro Timer
      </h3>

      {/* Mode Indicator */}
      <div className="flex gap-1.5 mb-4 sm:mb-6">
        {Object.entries(MODES).map(([key, { label, shortLabel }]) => (
          <button
            key={key}
            className={`flex-1 min-w-0 py-2 px-2 sm:px-3 rounded-lg text-[10px] sm:text-xs font-medium text-center transition-all truncate ${
              mode === key
                ? key === 'work'
                  ? 'bg-danger/15 text-danger border border-danger/30'
                  : key === 'shortBreak'
                  ? 'bg-mint-500/15 text-mint-400 border border-mint-500/30'
                  : 'bg-ocean-500/15 text-ocean-400 border border-ocean-500/30'
                : 'bg-dark-elevated text-text-muted border border-dark-border'
            }`}
          >
            <span className="hidden md:inline">{label}</span>
            <span className="md:hidden">{shortLabel}</span>
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div className="mb-4 sm:mb-6">
        <div className="w-40 h-40 sm:w-52 sm:h-52 mx-auto relative">
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="#21262D"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke={getStrokeColor()}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
              className="transition-all duration-1000 ease-linear"
              style={{ filter: `drop-shadow(0 0 8px ${getStrokeColor()}40)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl sm:text-5xl font-bold text-text-primary font-mono">
              {formattedTime}
            </span>
            {isRunning && (
              <span className={`text-xs mt-1.5 animate-pulse ${
                mode === 'work' ? 'text-danger' : 'text-mint-400'
              }`}>
                {mode === 'work' ? 'Enfócate' : 'Relájate'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 mb-4">
        <button
          onClick={handleToggleTimer}
          className={`p-3.5 sm:p-4 rounded-xl flex items-center justify-center transition-all transform hover:scale-105 ${
            isRunning
              ? 'bg-warning/15 text-warning border border-warning/30 hover:bg-warning/20'
              : 'bg-mint-500/15 text-mint-400 border border-mint-500/30 hover:bg-mint-500/20'
          }`}
        >
          {isRunning ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
        <button
          onClick={resetTimer}
          className="p-3.5 sm:p-4 rounded-xl bg-dark-elevated text-text-muted border border-dark-border hover:text-text-secondary hover:border-dark-hover transition-all"
          title="Reiniciar"
        >
          <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={skipToNext}
          className="p-3.5 sm:p-4 rounded-xl bg-dark-elevated text-text-muted border border-dark-border hover:text-text-secondary hover:border-dark-hover transition-all"
          title="Saltar al siguiente"
        >
          <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Pomodoro Count */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-text-secondary text-sm">
          <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
          <span className="font-medium">{completedPomodoros} pomodoros</span>
        </div>
        {completedPomodoros > 0 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {Array.from({ length: Math.min(completedPomodoros, 8) }).map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-danger"
                style={{ boxShadow: '0 0 6px rgba(248, 81, 73, 0.4)' }}
                title={`Pomodoro ${i + 1}`}
              />
            ))}
            {completedPomodoros > 8 && (
              <span className="text-xs text-text-muted ml-1">+{completedPomodoros - 8}</span>
            )}
          </div>
        )}
      </div>

      {/* Tip */}
      {!isRunning && completedPomodoros === 0 && timeLeft === settings.workDuration && (
        <div className="mt-4 p-3 bg-ocean-500/10 border border-ocean-500/20 rounded-lg text-xs sm:text-sm text-ocean-400 text-center">
          Ingresa una materia arriba y presiona play
        </div>
      )}
    </div>
  );
}
