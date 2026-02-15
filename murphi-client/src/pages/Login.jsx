import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, ArrowRight, Wallet, Clock, Brain } from 'lucide-react';

const Login = () => {
  const { user, loading, loginWithGoogle, loginWithGithub } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-mint flex items-center justify-center">
            <Zap size={20} className="text-dark-bg" />
          </div>
          <div className="spinner w-6 h-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-mint-500/5 via-dark-bg to-ocean-500/5" />

        {/* Decorative elements - intentionally not perfectly symmetric */}
        <div className="absolute top-[15%] left-[10%] w-72 h-72 bg-mint-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[15%] w-64 h-64 bg-ocean-500/8 rounded-full blur-[80px]" />
        <div className="absolute top-[60%] left-[30%] w-40 h-40 bg-mint-400/5 rounded-full blur-[60px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-20 max-w-2xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-11 h-11 rounded-xl bg-gradient-mint flex items-center justify-center shadow-glow-mint">
              <Zap size={22} className="text-dark-bg" />
            </div>
            <span className="text-2xl font-bold text-text-primary">Murphi</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl xl:text-5xl font-bold text-text-primary leading-tight mb-4">
            Organiza tu vida
            <br />
            <span className="text-gradient-mint">de estudiante</span>
          </h1>

          <p className="text-lg text-text-secondary mb-12 max-w-md leading-relaxed">
            Finanzas, productividad y asistencia con IA. Todo en un solo lugar, diseñado para ti.
          </p>

          {/* Features */}
          <div className="space-y-5">
            <div className="flex items-start gap-4 group">
              <div className="w-10 h-10 rounded-lg bg-dark-surface border border-dark-border flex items-center justify-center flex-shrink-0 group-hover:border-mint-500/30 transition-colors">
                <Wallet size={18} className="text-mint-400" />
              </div>
              <div>
                <h3 className="text-text-primary font-medium mb-0.5">Control financiero</h3>
                <p className="text-sm text-text-muted">Rastrea gastos, presupuestos y metas de ahorro</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-10 h-10 rounded-lg bg-dark-surface border border-dark-border flex items-center justify-center flex-shrink-0 group-hover:border-ocean-500/30 transition-colors">
                <Clock size={18} className="text-ocean-400" />
              </div>
              <div>
                <h3 className="text-text-primary font-medium mb-0.5">Productividad</h3>
                <p className="text-sm text-text-muted">Pomodoro, tareas y seguimiento de estudio</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-10 h-10 rounded-lg bg-dark-surface border border-dark-border flex items-center justify-center flex-shrink-0 group-hover:border-warning/30 transition-colors">
                <Brain size={18} className="text-warning" />
              </div>
              <div>
                <h3 className="text-text-primary font-medium mb-0.5">Insights con IA</h3>
                <p className="text-sm text-text-muted">Predicciones y consejos personalizados</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-mint flex items-center justify-center shadow-glow-mint">
              <Zap size={20} className="text-dark-bg" />
            </div>
            <span className="text-2xl font-bold text-text-primary">Murphi</span>
          </div>

          {/* Login Card */}
          <div className="bg-dark-surface rounded-2xl border border-dark-border p-7">
            <div className="text-center mb-7">
              <h2 className="text-xl font-bold text-text-primary mb-1">Bienvenido</h2>
              <p className="text-sm text-text-secondary">Inicia sesión para continuar</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={loginWithGoogle}
                className="group w-full flex items-center justify-center gap-3 bg-dark-bg border border-dark-border rounded-xl px-4 py-3.5 text-text-primary font-medium hover:border-dark-hover hover:bg-dark-elevated transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continuar con Google</span>
                <ArrowRight size={16} className="text-text-muted group-hover:text-text-secondary group-hover:translate-x-0.5 transition-all ml-auto" />
              </button>

              <button
                onClick={loginWithGithub}
                className="group w-full flex items-center justify-center gap-3 bg-text-primary rounded-xl px-4 py-3.5 text-dark-bg font-medium hover:bg-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                <span>Continuar con GitHub</span>
                <ArrowRight size={16} className="opacity-60 group-hover:translate-x-0.5 transition-all ml-auto" />
              </button>
            </div>

            <div className="mt-6 pt-5 border-t border-dark-border">
              <p className="text-center text-xs text-text-muted leading-relaxed">
                Al continuar, aceptas nuestros términos de servicio y política de privacidad.
              </p>
            </div>
          </div>

          {/* Mobile Features */}
          <div className="lg:hidden mt-8 text-center">
            <p className="text-sm text-text-secondary mb-4">
              Tu asistente para finanzas y productividad
            </p>
            <div className="flex justify-center gap-6 text-text-muted">
              <div className="flex items-center gap-1.5">
                <Wallet size={14} />
                <span className="text-xs">Finanzas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span className="text-xs">Pomodoro</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Brain size={14} />
                <span className="text-xs">IA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
