import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { requireAuth } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// ─── Get Notifications ───────────────────────────────────
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session.userId;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unread === 'true';

    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params: (number | string)[] = [userId!];

    if (unreadOnly) {
      query += ' AND is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    // Get unread count
    const [countResult] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({
      notifications: rows,
      unread_count: countResult[0].unread_count,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Mark Notification as Read ───────────────────────────
router.put('/:id/read', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session.userId;
    const notifId = req.params.id;

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notifId, userId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Mark All as Read ────────────────────────────────────
router.put('/read-all', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session.userId;

    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
