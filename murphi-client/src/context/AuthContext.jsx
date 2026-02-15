import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, logout as logoutApi, updatePreferences as updatePreferencesApi, syncCanvas } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await getCurrentUser();
      setUser(response.data);

      // Auto-sync Canvas en background si está conectado
      if (response.data?.preferences?.canvasEnabled) {
        syncCanvas().catch(() => {});
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const loginWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  const loginWithGithub = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/github`;
  };

  const updatePreferences = async (preferences) => {
    try {
      const response = await updatePreferencesApi(preferences);
      setUser(prev => ({
        ...prev,
        preferences: response.data.preferences
      }));
      return response.data;
    } catch (error) {
      console.error('Error al actualizar preferencias:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      logout,
      loginWithGoogle,
      loginWithGithub,
      checkAuth,
      updatePreferences
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
