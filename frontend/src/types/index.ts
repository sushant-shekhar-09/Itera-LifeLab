// ─── User ────────────────────────────────────────────────
export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  first_name?: string;
  last_name?: string;
  login_count?: number;
  created_at: string;
}

// ─── Category ────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  icon: string;
}

// ─── Experiment (Seed) ───────────────────────────────────
export interface Experiment {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  duration_days: number | null;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  current_streak: number;
  longest_streak: number;
  completed_days?: number;
  total_logged_days?: number;
  categories?: Category[];
  logs?: DailyLog[];
  created_at: string;
  updated_at: string;
}

// ─── Daily Log ───────────────────────────────────────────
export interface DailyLog {
  id: number;
  experiment_id: number;
  log_date: string;
  status: 'completed' | 'missed';
  note: string | null;
  created_at: string;
}

// ─── Notification ────────────────────────────────────────
export interface Notification {
  id: number;
  user_id: number;
  daily_log_id: number | null;
  type: 'completion' | 'miss' | 'streak' | 'milestone' | 'reminder';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ─── API Responses ───────────────────────────────────────
export interface StatsOverview {
  total_experiments: number;
  active_experiments: number;
  completed_experiments: number;
  completion_rate: number;
  best_streak: number;
  today_logs: (DailyLog & { experiment_title: string })[];
  weekly_data: { log_date: string; status: string; count: number }[];
}

export interface LogResponse {
  log: DailyLog;
  notification: {
    type: string;
    title: string;
    message: string;
  };
  streak: {
    current: number;
    longest: number;
  };
}
