-- ============================================================
-- Itera LifeLab - Database Schema
-- Demonstrates: Normalization (3NF), Primary Keys, Foreign Keys,
-- Unique Constraints, NOT NULL, CHECK, DEFAULT, Indexes
-- ============================================================

CREATE DATABASE IF NOT EXISTS itera_lifelab
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE itera_lifelab;

-- ============================================================
-- TABLE: users
-- Stores user account information
-- ============================================================
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL,
  email         VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(50)  DEFAULT NULL,
  last_name     VARCHAR(50)  DEFAULT NULL,
  dob           DATE         DEFAULT NULL,
  login_count   INT          DEFAULT 0,
  avatar_url    VARCHAR(500) DEFAULT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_users_email    UNIQUE (email),
  CONSTRAINT uq_users_username UNIQUE (username)
) ENGINE=InnoDB;

-- Index for login lookups
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- TABLE: categories
-- Normalized lookup table for experiment categories
-- ============================================================
CREATE TABLE categories (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(50) DEFAULT '🌱',

  CONSTRAINT uq_categories_name UNIQUE (name)
) ENGINE=InnoDB;

-- Seed default categories
INSERT INTO categories (name, icon) VALUES
  ('Health',      '💚'),
  ('Fitness',     '💪'),
  ('Diet',        '🥗'),
  ('Mindfulness', '🧘'),
  ('Productivity','⚡'),
  ('Learning',    '📚'),
  ('Social',      '🤝'),
  ('Creative',    '🎨'),
  ('Finance',     '💰'),
  ('Other',       '🌱');

-- ============================================================
-- TABLE: experiments
-- User-created habit experiments (seeds)
-- ============================================================
CREATE TABLE experiments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT          NOT NULL,
  title         VARCHAR(150) NOT NULL,
  description   TEXT         DEFAULT NULL,
  duration_days INT          DEFAULT NULL,
  start_date    DATE         NOT NULL,
  end_date      DATE         DEFAULT NULL,
  status        ENUM('active', 'completed', 'paused', 'abandoned')
                             DEFAULT 'active',
  current_streak INT         DEFAULT 0,
  longest_streak INT         DEFAULT 0,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key constraint
  CONSTRAINT fk_experiments_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  -- Check constraint: duration must be positive if set
  CONSTRAINT chk_experiments_duration
    CHECK (duration_days IS NULL OR duration_days > 0),

  -- Check constraint: end_date must be after start_date if set
  CONSTRAINT chk_experiments_dates
    CHECK (end_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB;

-- Indexes for common queries
CREATE INDEX idx_experiments_user_id ON experiments(user_id);
CREATE INDEX idx_experiments_status  ON experiments(status);

-- ============================================================
-- TABLE: experiment_categories (Junction / Bridge table)
-- Many-to-many relationship between experiments and categories
-- Demonstrates composite primary key
-- ============================================================
CREATE TABLE experiment_categories (
  experiment_id INT NOT NULL,
  category_id   INT NOT NULL,

  -- Composite primary key
  PRIMARY KEY (experiment_id, category_id),

  -- Foreign keys
  CONSTRAINT fk_ec_experiment
    FOREIGN KEY (experiment_id) REFERENCES experiments(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_ec_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: daily_logs
-- Daily completion/miss records for each experiment
-- ============================================================
CREATE TABLE daily_logs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  experiment_id INT  NOT NULL,
  log_date      DATE NOT NULL,
  status        ENUM('completed', 'missed') NOT NULL,
  note          TEXT DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraint
  CONSTRAINT fk_logs_experiment
    FOREIGN KEY (experiment_id) REFERENCES experiments(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  -- Unique constraint: one log per experiment per day
  CONSTRAINT uq_logs_experiment_date
    UNIQUE (experiment_id, log_date)
) ENGINE=InnoDB;

-- Index for date-range queries
CREATE INDEX idx_logs_date ON daily_logs(log_date);
CREATE INDEX idx_logs_experiment_date ON daily_logs(experiment_id, log_date);

-- ============================================================
-- TABLE: notifications
-- Notification records triggered on daily log entries
-- ============================================================
CREATE TABLE notifications (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT          NOT NULL,
  daily_log_id INT          DEFAULT NULL,
  type         ENUM('completion', 'miss', 'streak', 'milestone', 'reminder')
                            NOT NULL,
  title        VARCHAR(200) NOT NULL,
  message      TEXT         NOT NULL,
  is_read      BOOLEAN      DEFAULT FALSE,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  CONSTRAINT fk_notif_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_notif_log
    FOREIGN KEY (daily_log_id) REFERENCES daily_logs(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Indexes
CREATE INDEX idx_notif_user    ON notifications(user_id);
CREATE INDEX idx_notif_is_read ON notifications(user_id, is_read);

-- ============================================================
-- TABLE: sessions (for express-session with MySQL store)
-- ============================================================
CREATE TABLE sessions (
  session_id VARCHAR(128) PRIMARY KEY,
  expires    INT UNSIGNED NOT NULL,
  data       MEDIUMTEXT,

  INDEX idx_sessions_expires (expires)
) ENGINE=InnoDB;
