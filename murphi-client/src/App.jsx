import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PomodoroProvider } from './context/PomodoroContext';
import { TaskTrackerProvider } from './context/TaskTrackerContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Finances from './pages/Finances';
import Productivity from './pages/Productivity';
import Insights from './pages/Insights';
import Reports from './pages/Reports';
import Timeline from './pages/Timeline';
import Settings from './pages/Settings';
import ChatMurphi from './components/ai/ChatMurphi';
import FloatingTimer from './components/common/FloatingTimer';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="spinner w-10 h-10"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/finances"
        element={
          <ProtectedRoute>
            <Finances />
          </ProtectedRoute>
        }
      />
      <Route
        path="/productivity"
        element={
          <ProtectedRoute>
            <Productivity />
          </ProtectedRoute>
        }
      />
      <Route
        path="/insights"
        element={
          <ProtectedRoute>
            <Insights />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/timeline"
        element={
          <ProtectedRoute>
            <Timeline />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const ChatWrapper = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  if (!user || isDashboard) return null;
  return <ChatMurphi mode="floating" />;
};

const FloatingTimerWrapper = () => {
  const { user } = useAuth();
  return user ? <FloatingTimer /> : null;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <PomodoroProvider>
          <TaskTrackerProvider>
            <AppRoutes />
            <ChatWrapper />
            <FloatingTimerWrapper />
            <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#161B22',
                color: '#E6EDF3',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #30363D',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              },
              success: {
                iconTheme: {
                  primary: '#3FB68B',
                  secondary: '#161B22',
                },
                style: {
                  borderLeft: '4px solid #3FB68B',
                },
              },
              error: {
                iconTheme: {
                  primary: '#F85149',
                  secondary: '#161B22',
                },
                style: {
                  borderLeft: '4px solid #F85149',
                },
              },
            }}
          />
          </TaskTrackerProvider>
        </PomodoroProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
