import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Pause, X, Maximize2, SkipForward, Clock, RotateCcw } from 'lucide-react';
import { usePomodoro } from '../../context/PomodoroContext';

export default function FloatingTimer() {
  const {
    timeLeft,
    isRunning,
    mode,
    completedPomodoros,
    currentSubject,
    showFloating,
    formattedTime,
    progress,
    pauseTimer,
    resumeTimer,
    resetTimer,
    stopTimer,
    skipToNext,
    hideFloating
  } = usePomodoro();

  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // No mostrar si estamos en la página de productividad o si no debe mostrarse
  if (!showFloating || location.pathname === '/productivity') {
    return null;
  }

  const getModeColor = () => {
    if (mode === 'work') return 'from-danger to-red-400';
    if (mode === 'shortBreak') return 'from-mint-500 to-mint-400';
    return 'from-ocean-500 to-ocean-400';
  };

  const getModeBg = () => {
    if (mode === 'work') return 'bg-danger/20 border-danger/30';
    if (mode === 'shortBreak') return 'bg-mint-500/20 border-mint-500/30';
    return 'bg-ocean-500/20 border-ocean-500/30';
  };

  const getModeLabel = () => {
    if (mode === 'work') return 'Trabajando';
    if (mode === 'shortBreak') return 'Descanso corto';
    return 'Descanso largo';
  };

  const handleDragStart = (e) => {
    if (e.target.closest('button')) return;
    setIsDragging(true);
  };

  const handleDrag = (e) => {
    if (!isDragging) return;
    const newX = Math.max(0, Math.min(window.innerWidth - 200, e.clientX - 100));
    const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - 30));
    setPosition({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const goToProductivity = () => {
    navigate('/productivity');
  };

  // Versión minimizada - solo muestra tiempo
  if (isMinimized) {
    return (
      <div
        className="fixed z-50 cursor-move select-none"
        style={{ left: position.x, bottom: position.y }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <div
          className={`bg-dark-surface border ${getModeBg()} text-text-primary px-4 py-2 rounded-full shadow-lg flex items-center gap-2 cursor-pointer hover:bg-dark-elevated transition`}
          onClick={() => setIsMinimized(false)}
        >
          <Clock size={16} className={mode === 'work' ? 'text-danger' : mode === 'shortBreak' ? 'text-mint-400' : 'text-ocean-400'} />
          <span className="font-mono font-bold">{formattedTime}</span>
          {isRunning && <span className={`w-2 h-2 rounded-full animate-ping ${mode === 'work' ? 'bg-danger' : mode === 'shortBreak' ? 'bg-mint-400' : 'bg-ocean-400'}`}></span>}
        </div>
      </div>
    );
  }

  // Versión expandida
  return (
    <div
      className="fixed z-50 cursor-move select-none"
      style={{ left: position.x, bottom: position.y }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDrag}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      <div className="bg-dark-surface rounded-2xl shadow-2xl border border-dark-border overflow-hidden w-64 sm:w-72">
        {/* Header */}
        <div className={`${getModeBg()} border-b border-dark-border p-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className={mode === 'work' ? 'text-danger' : mode === 'shortBreak' ? 'text-mint-400' : 'text-ocean-400'} />
              <span className="font-medium text-sm text-text-primary">{getModeLabel()}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 hover:bg-dark-elevated rounded-lg transition text-text-muted hover:text-text-primary"
                title="Minimizar"
              >
                <Maximize2 size={14} />
              </button>
              <button
                onClick={stopTimer}
                className="p-1.5 hover:bg-dark-elevated rounded-lg transition text-text-muted hover:text-danger"
                title="Cerrar"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="p-4 bg-dark-bg">
          {/* Materia actual */}
          {currentSubject && (
            <div className="text-center text-sm text-text-secondary mb-2">
              {currentSubject}
            </div>
          )}

          {/* Tiempo */}
          <div className="text-center mb-3">
            <span className={`text-4xl font-mono font-bold ${mode === 'work' ? 'text-danger' : mode === 'shortBreak' ? 'text-mint-400' : 'text-ocean-400'}`}>
              {formattedTime}
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="h-2 bg-dark-elevated rounded-full mb-3 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getModeColor()} transition-all duration-1000`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controles - 3 botones principales */}
          <div className="flex items-center justify-center gap-2 mb-3">
            {isRunning ? (
              <button
                onClick={pauseTimer}
                className="p-3 bg-warning/20 text-warning border border-warning/30 rounded-full hover:bg-warning/30 transition"
                title="Pausar"
              >
                <Pause size={20} />
              </button>
            ) : (
              <button
                onClick={resumeTimer}
                className="p-3 bg-mint-500/20 text-mint-400 border border-mint-500/30 rounded-full hover:bg-mint-500/30 transition"
                title="Reanudar"
              >
                <Play size={20} />
              </button>
            )}

            <button
              onClick={resetTimer}
              className="p-2.5 bg-dark-elevated text-text-secondary border border-dark-border rounded-full hover:bg-dark-border hover:text-text-primary transition"
              title="Reiniciar"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={skipToNext}
              className="p-2.5 bg-dark-elevated text-text-secondary border border-dark-border rounded-full hover:bg-dark-border hover:text-text-primary transition"
              title="Saltar"
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Botón para ir a productividad */}
          <div className="flex justify-center">
            <button
              onClick={goToProductivity}
              className="px-4 py-2 bg-ocean-500/20 text-ocean-400 border border-ocean-500/30 rounded-lg hover:bg-ocean-500/30 transition text-sm font-medium"
            >
              Ir a Productividad
            </button>
          </div>

          {/* Pomodoros completados */}
          <div className="mt-3 text-center">
            <span className="text-xs text-text-muted">
              Pomodoros hoy: <span className="font-bold text-text-primary">{completedPomodoros}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
