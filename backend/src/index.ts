import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import { pool } from './config/db';
import { RowDataPacket } from 'mysql2';
import authRoutes from './routes/auth';
import experimentRoutes from './routes/experiments';
import logRoutes from './routes/logs';
import notificationRoutes from './routes/notifications';
import statsRoutes from './routes/stats';

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// ─── Middleware ───────────────────────────────────────────

// Trust proxy in production (Render sits behind a reverse proxy)
if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration — uses MySQL store in production for persistence
const MySQLStore = MySQLStoreFactory(session as any);
const sessionStore = new MySQLStore({}, pool as any);

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'itera-lifelab-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,          // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,   // 24 hours
    sameSite: isProduction ? 'none' : 'lax',  // 'none' needed for cross-origin (Vercel ↔ Render)
  },
}));

// ─── Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/experiments', experimentRoutes);
app.use('/api/experiments', logRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// ─── Auto-migrations ─────────────────────────────────────
async function runMigrations() {
  try {
    // Add auto_miss column if it doesn't exist
    const [cols] = await pool.query<RowDataPacket[]>(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'auto_miss'"
    );
    if (cols.length === 0) {
      await pool.query('ALTER TABLE users ADD COLUMN auto_miss TINYINT NOT NULL DEFAULT 0 AFTER login_count');
      console.log('  ✅ Added auto_miss column to users');
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
}

// ─── Start Server ────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🌱 Itera LifeLab API running on http://localhost:${PORT}`);
  await runMigrations();
});

export default app;
