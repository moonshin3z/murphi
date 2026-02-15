import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  User,
  Settings as SettingsIcon,
  Bell,
  DollarSign,
  Calendar,
  Shield,
  LogOut,
  Github,
  Mail,
  ChevronRight,
  Check,
  Plug,
  RefreshCw,
  Unlink,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { connectCanvas, disconnectCanvas, syncCanvas } from '../services/api';
import Sidebar from '../components/common/Sidebar';

const CURRENCIES = [
  { code: 'MXN', label: 'Peso Mexicano', symbol: '$' },
  { code: 'USD', label: 'Dólar Estadounidense', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GTQ', label: 'Quetzal Guatemalteco', symbol: 'Q' },
  { code: 'COP', label: 'Peso Colombiano', symbol: '$' },
  { code: 'ARS', label: 'Peso Argentino', symbol: '$' },
  { code: 'CLP', label: 'Peso Chileno', symbol: '$' },
  { code: 'PEN', label: 'Sol Peruano', symbol: 'S/' }
];

const WEEK_STARTS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' }
];

export default function Settings() {
  const { user, logout, updatePreferences } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  const [preferences, setPreferences] = useState({
    currency: user?.preferences?.currency || 'MXN',
    weekStartsOn: user?.preferences?.weekStartsOn ?? 1,
    notificationsEnabled: user?.preferences?.notificationsEnabled ?? true
  });

  // Canvas state
  const [canvasUrl, setCanvasUrl] = useState('');
  const [canvasToken, setCanvasToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [canvasLoading, setCanvasLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const isCanvasConnected = user?.preferences?.canvasEnabled || false;

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await toast.promise(
        updatePreferences(preferences),
        {
          loading: 'Guardando...',
          success: 'Preferencias actualizadas',
          error: 'Error al guardar'
        }
      );
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectCanvas = async () => {
    if (!canvasUrl.trim() || !canvasToken.trim()) {
      toast.error('Ingresa la URL de Canvas y tu token');
      return;
    }
    setCanvasLoading(true);
    try {
      const response = await connectCanvas({ canvasUrl: canvasUrl.trim(), canvasToken: canvasToken.trim() });
      toast.success(`Canvas conectado - ${response.data.canvasUser?.name || 'OK'}`);
      setCanvasUrl('');
      setCanvasToken('');
      setShowToken(false);
      // Refresh user data
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al conectar con Canvas');
    } finally {
      setCanvasLoading(false);
    }
  };

  const handleDisconnectCanvas = async () => {
    setCanvasLoading(true);
    try {
      await disconnectCanvas();
      toast.success('Canvas desconectado');
      window.location.reload();
    } catch (error) {
      toast.error('Error al desconectar Canvas');
    } finally {
      setCanvasLoading(false);
    }
  };

  const handleSyncCanvas = async () => {
    setSyncing(true);
    try {
      const response = await syncCanvas();
      const { created, updated, coursesFound } = response.data;
      toast.success(`Sincronizado: ${coursesFound} cursos, ${created} nuevas, ${updated} actualizadas`);
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  const hasChanges = () => {
    if (!user?.preferences) return false;
    return (
      preferences.currency !== user.preferences.currency ||
      preferences.weekStartsOn !== user.preferences.weekStartsOn ||
      preferences.notificationsEnabled !== user.preferences.notificationsEnabled
    );
  };

  const sections = [
    { id: 'profile', icon: User, label: 'Perfil' },
    { id: 'preferences', icon: SettingsIcon, label: 'Preferencias' },
    { id: 'integrations', icon: Plug, label: 'Integraciones' },
    { id: 'notifications', icon: Bell, label: 'Notificaciones' },
    { id: 'account', icon: Shield, label: 'Cuenta' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-1">Perfil</h2>
              <p className="text-sm text-text-muted">Información de tu cuenta</p>
            </div>

            <div className="flex items-center gap-4 p-4 bg-dark-bg/50 rounded-xl">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-xl object-cover ring-2 ring-dark-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-mint flex items-center justify-center text-dark-bg font-bold text-xl">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{user?.name}</h3>
                <p className="text-sm text-text-muted flex items-center gap-1.5">
                  <Mail size={14} />
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-dark-bg/50 rounded-xl">
                <label className="block text-sm text-text-secondary mb-1">Nombre</label>
                <p className="text-text-primary">{user?.name}</p>
              </div>

              <div className="p-4 bg-dark-bg/50 rounded-xl">
                <label className="block text-sm text-text-secondary mb-1">Correo electrónico</label>
                <p className="text-text-primary">{user?.email}</p>
              </div>

              <p className="text-xs text-text-muted">
                Tu información de perfil proviene de tu cuenta de Google o GitHub y no puede ser modificada aquí.
              </p>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-1">Preferencias</h2>
              <p className="text-sm text-text-muted">Personaliza tu experiencia</p>
            </div>

            {/* Currency */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <DollarSign size={16} className="text-mint-400" />
                Moneda
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CURRENCIES.map(currency => (
                  <button
                    key={currency.code}
                    onClick={() => handlePreferenceChange('currency', currency.code)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      preferences.currency === currency.code
                        ? 'bg-mint-500/10 border-mint-500/50 text-mint-400'
                        : 'bg-dark-bg/50 border-dark-border text-text-secondary hover:border-dark-elevated'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{currency.code}</span>
                      {preferences.currency === currency.code && (
                        <Check size={16} className="text-mint-400" />
                      )}
                    </div>
                    <span className="text-xs text-text-muted">{currency.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Week Starts On */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <Calendar size={16} className="text-ocean-400" />
                La semana comienza en
              </label>
              <div className="flex gap-2">
                {WEEK_STARTS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handlePreferenceChange('weekStartsOn', option.value)}
                    className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                      preferences.weekStartsOn === option.value
                        ? 'bg-ocean-500/10 border-ocean-500/50 text-ocean-400'
                        : 'bg-dark-bg/50 border-dark-border text-text-secondary hover:border-dark-elevated'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-medium">{option.label}</span>
                      {preferences.weekStartsOn === option.value && (
                        <Check size={16} className="text-ocean-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            {hasChanges() && (
              <div className="pt-4 border-t border-dark-border">
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="btn btn-primary w-full sm:w-auto"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            )}
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-1">Integraciones</h2>
              <p className="text-sm text-text-muted">Conecta servicios externos con Murphi</p>
            </div>

            {/* Canvas LMS */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-text-primary">Canvas LMS</h3>
                  <p className="text-xs text-text-muted">Sincroniza tareas y calendario de Canvas</p>
                </div>
                {isCanvasConnected && (
                  <div className="px-2 py-1 bg-mint-500/10 text-mint-400 text-xs font-medium rounded-lg">
                    Conectado
                  </div>
                )}
              </div>

              {isCanvasConnected ? (
                <div className="space-y-3">
                  {/* Connection info */}
                  <div className="p-4 bg-dark-bg/50 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Servidor</span>
                      <span className="text-sm text-text-primary">{user?.preferences?.canvasUrl}</span>
                    </div>
                    {user?.preferences?.canvasLastSync && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">Última sincronización</span>
                        <span className="text-sm text-text-primary">
                          {new Date(user.preferences.canvasLastSync).toLocaleString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sync button */}
                  <button
                    onClick={handleSyncCanvas}
                    disabled={syncing}
                    className="flex items-center justify-center gap-2 w-full p-3 bg-ocean-500/10 text-ocean-400 hover:bg-ocean-500/20 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {syncing ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <RefreshCw size={18} />
                    )}
                    <span className="font-medium">
                      {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
                    </span>
                  </button>

                  {/* Disconnect button */}
                  <button
                    onClick={handleDisconnectCanvas}
                    disabled={canvasLoading}
                    className="flex items-center justify-center gap-2 w-full p-3 text-danger hover:bg-danger/10 rounded-xl transition-colors"
                  >
                    <Unlink size={18} />
                    <span className="font-medium">Desconectar Canvas</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Instructions */}
                  <div className="p-4 bg-dark-bg/50 rounded-xl">
                    <p className="text-sm text-text-secondary mb-2">Para conectar Canvas necesitas tu token de acceso personal:</p>
                    <ol className="text-xs text-text-muted space-y-1.5 list-decimal list-inside">
                      <li>Ve a tu Canvas y entra a <strong className="text-text-secondary">Configuraciones</strong> (Account → Settings)</li>
                      <li>Busca la sección <strong className="text-text-secondary">"Nuevo token de acceso"</strong></li>
                      <li>Crea un token con cualquier nombre y copia el código generado</li>
                    </ol>
                  </div>

                  {/* Canvas URL input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">URL de Canvas</label>
                    <input
                      type="text"
                      value={canvasUrl}
                      onChange={(e) => setCanvasUrl(e.target.value)}
                      placeholder="miescuela.instructure.com"
                      className="w-full px-4 py-2.5 bg-dark-bg/50 border border-dark-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-ocean-500/50 transition"
                    />
                  </div>

                  {/* Token input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">Token de acceso</label>
                    <div className="relative">
                      <input
                        type={showToken ? 'text' : 'password'}
                        value={canvasToken}
                        onChange={(e) => setCanvasToken(e.target.value)}
                        placeholder="Tu token de Canvas"
                        className="w-full px-4 py-2.5 pr-12 bg-dark-bg/50 border border-dark-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-ocean-500/50 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                      >
                        {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Connect button */}
                  <button
                    onClick={handleConnectCanvas}
                    disabled={canvasLoading || !canvasUrl.trim() || !canvasToken.trim()}
                    className="flex items-center justify-center gap-2 w-full p-3 bg-mint-500/10 text-mint-400 hover:bg-mint-500/20 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {canvasLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Plug size={18} />
                    )}
                    <span className="font-medium">
                      {canvasLoading ? 'Conectando...' : 'Conectar Canvas'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-1">Notificaciones</h2>
              <p className="text-sm text-text-muted">Controla tus alertas</p>
            </div>

            <div className="space-y-3">
              <div
                className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-xl cursor-pointer hover:bg-dark-elevated transition"
                onClick={() => handlePreferenceChange('notificationsEnabled', !preferences.notificationsEnabled)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    preferences.notificationsEnabled ? 'bg-mint-500/10' : 'bg-dark-elevated'
                  }`}>
                    <Bell size={18} className={preferences.notificationsEnabled ? 'text-mint-400' : 'text-text-muted'} />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Notificaciones</p>
                    <p className="text-sm text-text-muted">Recibe alertas y recordatorios</p>
                  </div>
                </div>
                <div className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  preferences.notificationsEnabled ? 'bg-mint-500' : 'bg-dark-border'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    preferences.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </div>

              <p className="text-xs text-text-muted">
                Las notificaciones incluyen alertas de gastos, recordatorios de tareas y consejos de IA.
              </p>
            </div>

            {/* Save Button */}
            {hasChanges() && (
              <div className="pt-4 border-t border-dark-border">
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="btn btn-primary w-full sm:w-auto"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            )}
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-1">Cuenta</h2>
              <p className="text-sm text-text-muted">Gestiona tu cuenta y sesión</p>
            </div>

            {/* Connected Account */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-text-secondary">Cuenta conectada</label>
              <div className="p-4 bg-dark-bg/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-dark-elevated flex items-center justify-center">
                    {user?.googleId ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    ) : (
                      <Github size={20} className="text-text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      {user?.googleId ? 'Google' : 'GitHub'}
                    </p>
                    <p className="text-sm text-text-muted">{user?.email}</p>
                  </div>
                  <div className="ml-auto px-2 py-1 bg-mint-500/10 text-mint-400 text-xs font-medium rounded-lg">
                    Conectado
                  </div>
                </div>
              </div>
            </div>

            {/* Member Since */}
            <div className="p-4 bg-dark-bg/50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Miembro desde</span>
                <span className="text-sm text-text-primary">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long'
                      })
                    : 'Reciente'
                  }
                </span>
              </div>
            </div>

            {/* Logout */}
            <div className="pt-4 border-t border-dark-border">
              <button
                onClick={logout}
                className="flex items-center justify-center gap-2 w-full p-3 text-danger hover:bg-danger/10 rounded-xl transition-colors"
              >
                <LogOut size={18} />
                <span className="font-medium">Cerrar sesión</span>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Ajustes</h1>
          <p className="text-sm text-text-muted mt-1">Personaliza tu experiencia en Murphi</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-dark-surface rounded-xl border border-dark-border p-2">
              <nav className="space-y-1">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                      activeSection === section.id
                        ? 'bg-mint-500/10 text-mint-400'
                        : 'text-text-secondary hover:bg-dark-elevated hover:text-text-primary'
                    }`}
                  >
                    <section.icon size={18} />
                    <span className="text-sm font-medium flex-1">{section.label}</span>
                    <ChevronRight size={16} className={activeSection === section.id ? 'text-mint-400' : 'text-text-muted'} />
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-dark-surface rounded-xl border border-dark-border p-5 lg:p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
