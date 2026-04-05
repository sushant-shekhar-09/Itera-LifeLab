import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { requireAuth } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = Router();

// ─── Dashboard Overview Stats ────────────────────────────
router.get('/overview', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session.userId;

    // Total experiments
    const [totalExp] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM experiments WHERE user_id = ?',
      [userId]
    );

    // Active experiments
    const [activeExp] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as active FROM experiments WHERE user_id = ? AND status = 'active'",
      [userId]
    );

    // Completed experiments
    const [completedExp] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as completed FROM experiments WHERE user_id = ? AND status = 'completed'",
      [userId]
    );

    // Today's logs
    const today = new Date().toISOString().split('T')[0];
    const [todayLogs] = await pool.query<RowDataPacket[]>(
      `SELECT dl.*, e.title as experiment_title
       FROM daily_logs dl
       INNER JOIN experiments e ON dl.experiment_id = e.id
       WHERE e.user_id = ? AND dl.log_date = ?`,
      [userId, today]
    );

    // Overall completion rate
    const [completionRate] = await pool.query<RowDataPacket[]>(
      `SELECT
        COUNT(*) as total_logs,
        SUM(CASE WHEN dl.status = 'completed' THEN 1 ELSE 0 END) as completed_logs
       FROM daily_logs dl
       INNER JOIN experiments e ON dl.experiment_id = e.id
       WHERE e.user_id = ?`,
      [userId]
    );

    const totalLogs = completionRate[0].total_logs || 0;
    const completedLogs = completionRate[0].completed_logs || 0;
    const rate = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;

    // Best streak across all experiments
    const [bestStreak] = await pool.query<RowDataPacket[]>(
      'SELECT MAX(longest_streak) as best_streak FROM experiments WHERE user_id = ?',
      [userId]
    );

    // Weekly completion data (last 7 days)
    const [weeklyData] = await pool.query<RowDataPacket[]>(
      `SELECT dl.log_date, dl.status, COUNT(*) as count
       FROM daily_logs dl
       INNER JOIN experiments e ON dl.experiment_id = e.id
       WHERE e.user_id = ? AND dl.log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY dl.log_date, dl.status
       ORDER BY dl.log_date ASC`,
      [userId]
    );

    res.json({
      stats: {
        total_experiments: totalExp[0].total,
        active_experiments: activeExp[0].active,
        completed_experiments: completedExp[0].completed,
        completion_rate: rate,
        best_streak: bestStreak[0].best_streak || 0,
        today_logs: todayLogs,
        weekly_data: weeklyData,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
