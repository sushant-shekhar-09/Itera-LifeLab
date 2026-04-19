-- Add auto_miss setting to users table
ALTER TABLE users ADD COLUMN auto_miss TINYINT NOT NULL DEFAULT 0 AFTER login_count;
