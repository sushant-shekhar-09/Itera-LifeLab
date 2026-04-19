import axios from 'axios';
import type { Experiment, LogResponse, Notification, StatsOverview, User } from '@/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Auth ────────────────────────────────────────────────
export const authAPI = {
  register: (data: { username: string; email: string; password: string; firstName?: string; lastName?: string; dob?: string }) =>
    api.post<{ message: string; user: User }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ message: string; user: User }>('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get<{ user: User }>('/auth/me'),

  updateProfile: (data: { first_name?: string; last_name?: string; username?: string }) =>
    api.put<{ message: string; user: User }>('/auth/profile', data),

  updateSettings: (data: { auto_miss?: boolean }) =>
    api.put<{ message: string; user: User }>('/auth/settings', data),
};

// ─── Experiments ─────────────────────────────────────────
export const experimentsAPI = {
  list: (status?: string) =>
    api.get<{ experiments: Experiment[] }>('/experiments', { params: status ? { status } : {} }),

  create: (data: {
    title: string;
    description?: string;
    duration_days?: number;
    start_date: string;
    category_ids?: number[];
  }) => api.post<{ experiment: Experiment }>('/experiments', data),

  get: (id: number) =>
    api.get<{ experiment: Experiment }>(`/experiments/${id}`),

  update: (id: number, data: Partial<Experiment>) =>
    api.put<{ experiment: Experiment }>(`/experiments/${id}`, data),

  delete: (id: number) =>
    api.delete(`/experiments/${id}`),

  resetAll: () =>
    api.delete('/experiments/reset'),

  autoMiss: () =>
    api.post<{ message: string; filled: number }>('/experiments/auto-miss'),
};

// ─── Daily Logs ──────────────────────────────────────────
export const logsAPI = {
  create: (experimentId: number, data: { status: 'completed' | 'missed'; note?: string; log_date?: string }) =>
    api.post<LogResponse>(`/experiments/${experimentId}/logs`, data),

  list: (experimentId: number) =>
    api.get<{ logs: import('@/types').DailyLog[] }>(`/experiments/${experimentId}/logs`),
};

// ─── Notifications ───────────────────────────────────────
export const notificationsAPI = {
  list: (limit?: number, unread?: boolean) =>
    api.get<{ notifications: Notification[]; unread_count: number }>('/notifications', {
      params: { limit, unread: unread ? 'true' : undefined },
    }),

  markRead: (id: number) =>
    api.put(`/notifications/${id}/read`),

  markAllRead: () =>
    api.put('/notifications/read-all'),
};

// ─── Stats ───────────────────────────────────────────────
export const statsAPI = {
  overview: () => api.get<{ stats: StatsOverview }>('/stats/overview'),
};

export default api;
