import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useFinances() {
  const [transactions, setTransactions] = useState([]);
  const [budget, setBudget] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await api.get('/api/finances/transactions');
      setTransactions(response.data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchBudget = useCallback(async () => {
    try {
      const response = await api.get('/api/finances/budget');
      setBudget(response.data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await api.get('/api/finances/summary');
      setSummary(response.data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTransactions(), fetchBudget(), fetchSummary()]);
    setLoading(false);
  }, [fetchTransactions, fetchBudget, fetchSummary]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addTransaction = async (data) => {
    const response = await api.post('/api/finances/transactions', data);
    setTransactions((prev) => [response.data, ...prev]);
    await fetchSummary();
    return response.data;
  };

  const updateTransaction = async (id, data) => {
    const response = await api.put(`/api/finances/transactions/${id}`, data);
    setTransactions((prev) =>
      prev.map((t) => (t._id === id ? response.data : t))
    );
    await fetchSummary();
    return response.data;
  };

  const deleteTransaction = async (id) => {
    await api.delete(`/api/finances/transactions/${id}`);
    setTransactions((prev) => prev.filter((t) => t._id !== id));
    await fetchSummary();
  };

  const saveBudget = async (data) => {
    const response = await api.post('/api/finances/budget', data);
    setBudget(response.data);
    return response.data;
  };

  return {
    transactions,
    budget,
    summary,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    saveBudget,
    refresh: fetchAll
  };
}
