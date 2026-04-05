import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../config/db';
import { requireAuth } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();
const SALT_ROUNDS = 10;

// ─── Register ────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, firstName, lastName, dob } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    // Check if email or username already exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existing.length > 0) {
      res.status(409).json({ error: 'Email or username already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (username, email, password_hash, first_name, last_name, dob) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, passwordHash, firstName || null, lastName || null, dob || null]
    );

    // Auto-login after registration
    req.session.userId = result.insertId;
    req.session.username = username;

    // First login immediately happens at registration
    await pool.query('UPDATE users SET login_count = 1 WHERE id = ?', [result.insertId]);

    res.status(201).json({
      message: 'Registration successful',
      user: { id: result.insertId, username, email, first_name: firstName, last_name: lastName, login_count: 1 },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Login ───────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, email, password_hash, avatar_url, first_name, last_name, login_count FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Increment login counter
    await pool.query('UPDATE users SET login_count = login_count + 1 WHERE id = ?', [user.id]);

    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({
      message: 'Login successful',
      user: { 
         id: user.id, 
         username: user.username, 
         email: user.email, 
         avatar_url: user.avatar_url,
         first_name: user.first_name,
         last_name: user.last_name,
         login_count: user.login_count + 1 
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Logout ──────────────────────────────────────────────
router.post('/logout', (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to logout' });
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// ─── Get Current User ────────────────────────────────────
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, email, avatar_url, first_name, last_name, login_count, created_at FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
