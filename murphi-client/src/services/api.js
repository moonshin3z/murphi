import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

// Auth
export const getCurrentUser = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');
export const updatePreferences = (preferences) => api.put('/auth/preferences', preferences);

// Finances
export const getTransactions = (params) => api.get('/api/finances/transactions', { params });
export const createTransaction = (data) => api.post('/api/finances/transactions', data);
export const updateTransaction = (id, data) => api.put(`/api/finances/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/api/finances/transactions/${id}`);
export const getBudget = () => api.get('/api/finances/budget');
export const saveBudget = (data) => api.post('/api/finances/budget', data);
export const getSavings = () => api.get('/api/finances/savings');
export const createSavingGoal = (data) => api.post('/api/finances/savings', data);
export const updateSavingGoal = (id, data) => api.put(`/api/finances/savings/${id}`, data);
export const getFinanceSummary = () => api.get('/api/finances/summary');

// Productivity
export const getStudySessions = (params) => api.get('/api/productivity/sessions', { params });
export const createStudySession = (data) => api.post('/api/productivity/sessions', data);
export const updateStudySession = (id, data) => api.put(`/api/productivity/sessions/${id}`, data);
export const deleteStudySession = (id) => api.delete(`/api/productivity/sessions/${id}`);
export const getTasks = (params) => api.get('/api/productivity/tasks', { params });
export const createTask = (data) => api.post('/api/productivity/tasks', data);
export const updateTask = (id, data) => api.put(`/api/productivity/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/api/productivity/tasks/${id}`);
export const getStreak = () => api.get('/api/productivity/streak');
export const getProductivitySummary = () => api.get('/api/productivity/summary');
export const updateTaskLog = (id, data) => api.put(`/api/productivity/task-logs/${id}`, data);
export const deleteTaskLog = (id) => api.delete(`/api/productivity/task-logs/${id}`);

// AI
export const getPredictedExpenses = () => api.get('/api/ai/predict-expenses');
export const getStudySuggestions = () => api.get('/api/ai/study-suggestions');
export const getCrossInsights = () => api.get('/api/ai/insights');
export const getAlerts = () => api.get('/api/ai/alerts');
export const getAllInsights = () => api.get('/api/ai/all');
export const getBudgetAllocation = () => api.get('/api/ai/budget-allocation');
export const getDailyDigest = () => api.get('/api/ai/daily-digest');

// Canvas
export const connectCanvas = (data) => api.post('/api/canvas/connect', data);
export const disconnectCanvas = () => api.post('/api/canvas/disconnect');
export const syncCanvas = () => api.post('/api/canvas/sync');
export const getCanvasStatus = () => api.get('/api/canvas/status');

export default api;
