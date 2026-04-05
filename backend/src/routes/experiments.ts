import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { requireAuth } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// ─── List Experiments ────────────────────────────────────
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session.userId;
    const status = req.query.status as string | undefined;

    let query = `
      SELECT e.*,
        (SELECT COUNT(*) FROM daily_logs dl WHERE dl.experiment_id = e.id AND dl.status = 'completed') as completed_days,
        (SELECT COUNT(*) FROM daily_logs dl WHERE dl.experiment_id = e.id) as total_logged_days
      FROM experiments e
      WHERE e.user_id = ?
    `;
    const params: (string | number)[] = [userId!];

    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }

    query += ' ORDER BY e.created_at DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.json({ experiments: rows });
  } catch (error) {
    console.error('List experiments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Create Experiment ───────────────────────────────────
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session.userId;
    const { title, description, duration_days, start_date, category_ids } = req.body;

    if (!title || !start_date) {
      res.status(400).json({ error: 'Title and start date are required' });
      return;
    }

    // Calculate end_date if duration is provided
    let endDate = null;
    if (duration_days) {
      const start = new Date(start_date);
      start.setDate(start.getDate() + duration_days);
      endDate = start.toISOString().split('T')[0];
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO experiments (user_id, title, description, duration_days, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, title, description || null, duration_days || null, start_date, endDate]
      );

      const experimentId = result.insertId;

      // Insert category associations if provided
      if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
        const categoryValues = category_ids.map((catId: number) => [experimentId, catId]);
        await conn.query(
          'INSERT INTO experiment_categories (experiment_id, category_id) VALUES ?',
          [categoryValues]
        );
      }

      await conn.commit();

      // Fetch the created experiment
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM experiments WHERE id = ?',
        [experimentId]
      );

      res.status(201).json({ experiment: rows[0] });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Create experiment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Get Single Experiment ───────────────────────────────
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session.userId;
    const experimentId = req.params.id;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT e.*,
        (SELECT COUNT(*) FROM daily_logs dl WHERE dl.experiment_id = e.id AND dl.status = 'completed') as completed_days,
        (SELECT COUNT(*) FROM daily_logs dl WHERE dl.experiment_id = e.id) as total_logged_days
       FROM experiments e
       WHERE e.id = ? AND e.user_id = ?`,
      [experimentId, userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Experiment not found' });
      return;
    }

    // Get categories
    const [categories] = await pool.query<RowDataPacket[]>(
      `SELECT c.* FROM categories c
       INNER JOIN experiment_categories ec ON c.id = ec.category_id
       WHERE ec.experiment_id = ?`,
      [experimentId]
    );

    // Get recent logs
    const [logs] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM daily_logs WHERE experiment_id = ? ORDER BY log_date DESC LIMIT 30',
      [experimentId]
    );

    res.json({ experiment: { ...rows[0], categories, logs } });
  } catch (error) {
    console.error('Get experiment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Update Experiment ───────────────────────────────────
router.put('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session.userId;
    const experimentId = req.params.id;
    const { title, description, status } = req.body;

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE experiments SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status)
       WHERE id = ? AND user_id = ?`,
      [title, description, status, experimentId, userId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Experiment not found' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM experiments WHERE id = ?',
      [experimentId]
    );

    res.json({ experiment: rows[0] });
  } catch (error) {
    console.error('Update experiment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Reset All Experiments ──────────────────────────────
router.delete('/reset', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session.userId;

    const [exps] = await pool.query<RowDataPacket[]>('SELECT id FROM experiments WHERE user_id = ?', [userId]);
    const expIds = exps.map(e => e.id);

    if (expIds.length > 0) {
      // Execute manual cascading deletes
      await pool.query('DELETE FROM notifications WHERE daily_log_id IN (SELECT id FROM daily_logs WHERE experiment_id IN (?))', [expIds]);
      await pool.query('DELETE FROM daily_logs WHERE experiment_id IN (?)', [expIds]);
      await pool.query('DELETE FROM experiment_categories WHERE experiment_id IN (?)', [expIds]);
      await pool.query('DELETE FROM experiments WHERE id IN (?)', [expIds]);
    }

    res.json({ message: 'All demo data reset successfully' });
  } catch (error) {
    console.error('Reset experiments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Delete Experiment (smart: abandon if watered, hard-delete if never watered) ───
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const conn = await pool.getConnection();
  try {
    const userId = req.session.userId;
    const experimentId = req.params.id;

    // Verify ownership
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT id FROM experiments WHERE id = ? AND user_id = ?',
      [experimentId, userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Experiment not found' });
      conn.release();
      return;
    }

    // Check if any daily logs exist (i.e., was it ever watered?)
    const [logs] = await conn.query<RowDataPacket[]>(
      'SELECT COUNT(*) as log_count FROM daily_logs WHERE experiment_id = ?',
      [experimentId]
    );
    const hasLogs = Number(logs[0].log_count) > 0;

    await conn.beginTransaction();

    if (hasLogs) {
      // Soft delete: mark as abandoned
      await conn.query(
        "UPDATE experiments SET status = 'abandoned' WHERE id = ?",
        [experimentId]
      );
      await conn.commit();
      res.json({ message: 'Seed marked as abandoned', action: 'abandoned' });
    } else {
      // Hard delete: no logs, remove everything
      await conn.query('DELETE FROM notifications WHERE daily_log_id IN (SELECT id FROM daily_logs WHERE experiment_id = ?)', [experimentId]);
      await conn.query('DELETE FROM daily_logs WHERE experiment_id = ?', [experimentId]);
      await conn.query('DELETE FROM experiment_categories WHERE experiment_id = ?', [experimentId]);
      await conn.query('DELETE FROM experiments WHERE id = ?', [experimentId]);
      await conn.commit();
      res.json({ message: 'Seed permanently deleted', action: 'deleted' });
    }
  } catch (error) {
    await conn.rollback();
    console.error('Delete experiment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

export default router;
