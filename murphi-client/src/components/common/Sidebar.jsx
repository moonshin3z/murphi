import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Clock,
  Brain,
  FileText,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/finances', icon: Wallet, label: 'Finanzas' },
  { to: '/productivity', icon: Clock, label: 'Productividad' },
  { to: '/timeline', icon: Calendar, label: 'Timeline' },
  { to: '/insights', icon: Brain, label: 'Insights', badge: 'IA' },
  { to: '/reports', icon: FileText, label: 'Reportes' },
  { to: '/settings', icon: Settings, label: 'Ajustes' }
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-dark-surface/90 backdrop-blur-md border-b border-dark-border px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 -ml-2 text-text-secondary hover:text-text-primary hover:bg-dark-elevated rounded-lg transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-mint flex items-center justify-center">
              <Zap size={14} className="text-dark-bg" />
            </div>
            <span className="text-lg font-bold text-text-primary">Murphi</span>
          </div>

          <div className="w-10" />
        </div>
      </header>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-dark-bg/80 backdrop-blur-sm z-40 animate-fadeIn"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50
          w-[280px] lg:w-60 h-screen
          bg-dark-surface border-r border-dark-border
          flex flex-col
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-mint flex items-center justify-center shadow-glow-mint">
              <Zap size={18} className="text-dark-bg" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Murphi</h1>
              <p className="text-[11px] text-text-muted leading-none">Tu asistente</p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 text-text-muted hover:text-text-secondary hover:bg-dark-elevated rounded-lg transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <ul className="space-y-0.5">
            {navItems.map(({ to, icon: Icon, label, badge }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-mint-500/10 text-mint-400'
                        : 'text-text-secondary hover:bg-dark-elevated hover:text-text-primary'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={18}
                        className={isActive ? 'text-mint-400' : 'text-text-muted group-hover:text-text-secondary'}
                      />
                      <span className="text-sm font-medium">{label}</span>
                      {badge && (
                        <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-mint-500/20 text-mint-400'
                            : 'bg-ocean-500/15 text-ocean-400'
                        }`}>
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-dark-border">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-bg/50 mb-2">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-9 h-9 rounded-lg object-cover ring-1 ring-dark-border"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-mint flex items-center justify-center text-dark-bg font-semibold text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-text-muted hover:bg-danger/10 hover:text-danger rounded-lg transition-all text-sm"
          >
            <LogOut size={16} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile spacer */}
      <div className="lg:hidden h-14" />
    </>
  );
}
