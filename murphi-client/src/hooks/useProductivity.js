import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useProductivity() {
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await api.get('/api/productivity/tasks');
      setTasks(response.data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await api.get('/api/productivity/sessions');
      setSessions(response.data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await api.get('/api/productivity/summary');
      setSummary(response.data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTasks(), fetchSessions(), fetchSummary()]);
    setLoading(false);
  }, [fetchTasks, fetchSessions, fetchSummary]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Tasks
  const addTask = async (data) => {
    const response = await api.post('/api/productivity/tasks', data);
    setTasks((prev) => [...prev, response.data]);
    return response.data;
  };

  const updateTask = async (id, data) => {
    const response = await api.put(`/api/productivity/tasks/${id}`, data);
    setTasks((prev) => prev.map((t) => (t._id === id ? response.data : t)));
    return response.data;
  };

  const deleteTask = async (id) => {
    await api.delete(`/api/productivity/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  };

  // Sessions
  const addSession = async (data) => {
    const response = await api.post('/api/productivity/sessions', data);
    setSessions((prev) => [response.data, ...prev]);
    fetchSummary(); // Actualizar racha
    return response.data;
  };

  return {
    tasks,
    sessions,
    summary,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    addSession,
    refresh: fetchAll
  };
}
