import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const PomodoroContext = createContext();

const TIMER_STORAGE_KEY = 'murphi_pomodoro_state';

// Configuración por defecto
const DEFAULT_SETTINGS = {
  workDuration: 25 * 60, // 25 minutos en segundos
  shortBreak: 5 * 60,    // 5 minutos
  longBreak: 15 * 60,    // 15 minutos
  longBreakInterval: 4   // Después de 4 pomodoros
};

export function PomodoroProvider({ children }) {
  // Estado del timer
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work'); // 'work', 'shortBreak', 'longBreak'
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [currentSubject, setCurrentSubject] = useState('');
  const [showFloating, setShowFloating] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const onCompleteRef = useRef(null);

  // Restaurar estado desde localStorage al iniciar
  useEffect(() => {
    const saved = localStorage.getItem(TIMER_STORAGE_KEY);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        const now = Date.now();

        // Restaurar configuración primero
        if (state.settings) setSettings(state.settings);
        setMode(state.mode || 'work');
        setCompletedPomodoros(state.completedPomodoros || 0);
        setCurrentSubject(state.currentSubject || '');

        // Si el timer estaba corriendo, calcular el tiempo transcurrido
        if (state.isRunning && state.startTime) {
          const elapsed = Math.floor((now - state.startTime) / 1000);
          const remaining = state.timeLeft - elapsed;

          if (remaining > 0) {
            setTimeLeft(remaining);
            setIsRunning(true);
            // Actualizar startTime al momento actual para que el cálculo de persistencia sea correcto
            startTimeRef.current = now;
            setShowFloating(true);
          } else {
            // Timer terminó mientras la página estaba cerrada - manejar completado
            setTimeLeft(0);
            setIsRunning(false);
            setShowFloating(false);
            // El timer completó mientras estaba cerrado
            console.log('Timer completado mientras la página estaba cerrada');
          }
        } else {
          // Timer estaba pausado o no iniciado
          setTimeLeft(state.timeLeft || DEFAULT_SETTINGS.workDuration);
          setIsRunning(false);
          // Mostrar floating si hay una sesión activa (timer pausado con tiempo diferente)
          const hasActiveSession = state.timeLeft !== (state.settings?.workDuration || DEFAULT_SETTINGS.workDuration) ||
            state.mode !== 'work' ||
            state.completedPomodoros > 0;
          setShowFloating(hasActiveSession);
        }
      } catch (e) {
        console.error('Error restoring pomodoro state:', e);
      }
    }
  }, []);

  // Función para guardar estado
  const saveState = useCallback(() => {
    const state = {
      timeLeft,
      isRunning,
      mode,
      completedPomodoros,
      currentSubject,
      settings,
      startTime: isRunning ? Date.now() : null
    };
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  }, [timeLeft, isRunning, mode, completedPomodoros, currentSubject, settings]);

  // Guardar estado en localStorage cuando cambia
  useEffect(() => {
    saveState();
  }, [saveState]);

  // Guardar estado antes de cerrar/recargar la página
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Guardar estado inmediatamente antes de cerrar
      const state = {
        timeLeft,
        isRunning,
        mode,
        completedPomodoros,
        currentSubject,
        settings,
        startTime: isRunning ? Date.now() : null
      };
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [timeLeft, isRunning, mode, completedPomodoros, currentSubject, settings]);

  // Lógica del timer
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Notificación cuando termina el timer
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);

    // Sonido de notificación
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleEs3h9markup');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}

    // Notificación del navegador
    if (Notification.permission === 'granted') {
      new Notification(mode === 'work' ? '¡Pomodoro completado!' : '¡Descanso terminado!', {
        body: mode === 'work'
          ? 'Buen trabajo. Toma un descanso.'
          : 'Es hora de volver al trabajo.',
        icon: '/favicon.ico'
      });
    }

    if (mode === 'work') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);

      // Llamar callback si existe
      if (onCompleteRef.current) {
        onCompleteRef.current(newCount);
      }

      // Determinar siguiente descanso
      if (newCount % settings.longBreakInterval === 0) {
        setMode('longBreak');
        setTimeLeft(settings.longBreak);
      } else {
        setMode('shortBreak');
        setTimeLeft(settings.shortBreak);
      }
    } else {
      // Volver a trabajo
      setMode('work');
      setTimeLeft(settings.workDuration);
    }
  }, [mode, completedPomodoros, settings]);

  // Controles
  const startTimer = useCallback((subject = '', onComplete = null) => {
    if (subject) setCurrentSubject(subject);
    if (onComplete) onCompleteRef.current = onComplete;

    setIsRunning(true);
    setShowFloating(true);
    startTimeRef.current = Date.now();

    // Pedir permiso de notificaciones
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    startTimeRef.current = null;
  }, []);

  const resumeTimer = useCallback(() => {
    setIsRunning(true);
    startTimeRef.current = Date.now();
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    startTimeRef.current = null;
    setTimeLeft(
      mode === 'work' ? settings.workDuration :
      mode === 'shortBreak' ? settings.shortBreak :
      settings.longBreak
    );
  }, [mode, settings]);

  const stopTimer = useCallback(() => {
    setIsRunning(false);
    setShowFloating(false);
    setMode('work');
    setTimeLeft(settings.workDuration);
    startTimeRef.current = null;
  }, [settings]);

  const skipToNext = useCallback(() => {
    if (mode === 'work') {
      setMode('shortBreak');
      setTimeLeft(settings.shortBreak);
    } else {
      setMode('work');
      setTimeLeft(settings.workDuration);
    }
    setIsRunning(false);
  }, [mode, settings]);

  const setOnComplete = useCallback((callback) => {
    onCompleteRef.current = callback;
  }, []);

  const hideFloating = useCallback(() => {
    setShowFloating(false);
  }, []);

  const showFloatingTimer = useCallback(() => {
    // Mostrar si el timer está corriendo O si hay un timer activo (tiempo diferente al inicial)
    const hasActiveSession = isRunning ||
      timeLeft !== settings.workDuration ||
      mode !== 'work' ||
      completedPomodoros > 0;

    if (hasActiveSession) {
      setShowFloating(true);
    }
  }, [isRunning, timeLeft, settings, mode, completedPomodoros]);

  // Formatear tiempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const value = {
    // Estado
    timeLeft,
    isRunning,
    mode,
    completedPomodoros,
    currentSubject,
    showFloating,
    settings,
    formattedTime: formatTime(timeLeft),

    // Acciones
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    stopTimer,
    skipToNext,
    setCurrentSubject,
    setSettings,
    setOnComplete,
    hideFloating,
    showFloatingTimer,

    // Helpers
    formatTime,
    progress: mode === 'work'
      ? ((settings.workDuration - timeLeft) / settings.workDuration) * 100
      : mode === 'shortBreak'
        ? ((settings.shortBreak - timeLeft) / settings.shortBreak) * 100
        : ((settings.longBreak - timeLeft) / settings.longBreak) * 100
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
}

export default PomodoroContext;
