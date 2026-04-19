import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { requireAuth } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// ─── Log Daily Entry (TRANSACTION) ───────────────────────
// This route demonstrates a MySQL TRANSACTION:
// 1. INSERT the daily log
// 2. UPDATE experiment streaks
// 3. INSERT a notification
// All three succeed or all roll back
router.post('/:id/logs', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const conn = await pool.getConnection();

  try {
    const userId = req.session.userId;
    const experimentId = parseInt(req.params.id);
    const { status, note, log_date } = req.body;

    if (!status || !['completed', 'missed'].includes(status)) {
      res.status(400).json({ error: 'Status must be "completed" or "missed"' });
      conn.release();
      return;
    }


    // Verify experiment belongs to user
    const [experiments] = await conn.query<RowDataPacket[]>(
      'SELECT * FROM experiments WHERE id = ? AND user_id = ?',
      [experimentId, userId]
    );

    if (experiments.length === 0) {
      res.status(404).json({ error: 'Experiment not found' });
      conn.release();
      return;
    }

    const experiment = experiments[0];

    // Guard: prevent logging before start_date (use local dates to avoid UTC timezone shift)
    const now = new Date();
    const todayLocal = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const sd = new Date(experiment.start_date);
    const startLocal = `${sd.getFullYear()}-${String(sd.getMonth()+1).padStart(2,'0')}-${String(sd.getDate()).padStart(2,'0')}`;
    if (todayLocal < startLocal) {
      res.status(400).json({ error: `This seed starts on ${startLocal}. You can water it from that day onwards.` });
      conn.release();
      return;
    }

    // Use local date for log_date default (not UTC)
    let date = log_date || todayLocal;

    // Detect demo profile early — needed for auto-advance logic
    const [userRows] = await conn.query<RowDataPacket[]>(
      'SELECT email FROM users WHERE id = ?',
      [userId]
    );
    const isDemoProfile = userRows.length > 0 && userRows[0].email === 'demo@itera.lab';

    // Demo profile: auto-advance to the next calendar day after the last log
    // This lets the demo user rapidly click through days to show progression
    if (isDemoProfile && !log_date) {
      const [latestLogs] = await conn.query<RowDataPacket[]>(
        'SELECT log_date FROM daily_logs WHERE experiment_id = ? ORDER BY log_date DESC LIMIT 1',
        [experimentId]
      );

      if (latestLogs.length > 0) {
        // Advance to the day after the most recent log
        const lastDate = new Date(latestLogs[0].log_date);
        lastDate.setDate(lastDate.getDate() + 1);
        date = `${lastDate.getFullYear()}-${String(lastDate.getMonth()+1).padStart(2,'0')}-${String(lastDate.getDate()).padStart(2,'0')}`;
      }
      // If no logs exist, use todayLocal (already set above)
    }

    // Guard: prevent duplicate logging per day for non-demo profiles
    if (!isDemoProfile) {
      const [existingLogs] = await conn.query<RowDataPacket[]>(
        'SELECT id FROM daily_logs WHERE experiment_id = ? AND log_date = ?',
        [experimentId, date]
      );
      if (existingLogs.length > 0) {
        res.status(409).json({ error: 'You have already logged this experiment for today' });
        conn.release();
        return;
      }
    }

    // ─── BEGIN TRANSACTION ─────────────────────────────
    await conn.beginTransaction();

    // Step 1: Insert the daily log
    const [logResult] = await conn.query<ResultSetHeader>(
      'INSERT INTO daily_logs (experiment_id, log_date, status, note) VALUES (?, ?, ?, ?)',
      [experimentId, date, status, note || null]
    );

    const logId = logResult.insertId;

    // Step 2: Update streaks
    let newCurrentStreak = experiment.current_streak;
    let newLongestStreak = experiment.longest_streak;

    if (status === 'completed') {
      newCurrentStreak += 1;
      if (newCurrentStreak > newLongestStreak) {
        newLongestStreak = newCurrentStreak;
      }
    } else {
      newCurrentStreak = 0; // Reset streak on miss
    }

    await conn.query(
      'UPDATE experiments SET current_streak = ?, longest_streak = ? WHERE id = ?',
      [newCurrentStreak, newLongestStreak, experimentId]
    );

    // Step 2b: Auto-complete if duration target is reached
    if (status === 'completed' && experiment.duration_days) {
      const [completedCount] = await conn.query<RowDataPacket[]>(
        "SELECT COUNT(*) as cnt FROM daily_logs WHERE experiment_id = ? AND status = 'completed'",
        [experimentId]
      );
      const totalCompleted = Number(completedCount[0].cnt);
      if (totalCompleted >= experiment.duration_days) {
        await conn.query(
          "UPDATE experiments SET status = 'completed' WHERE id = ?",
          [experimentId]
        );
      }
    }

    // Step 3: Create notification
    let notifTitle: string;
    let notifMessage: string;
    let notifType: string;

    if (status === 'completed') {
      notifTitle = '🌱 Seed Watered!';
      notifMessage = `Great job! You completed "${experiment.title}" today. Your streak is now ${newCurrentStreak} days! Keep growing! 🌿`;
      notifType = 'completion';
    } else {
      notifTitle = '🥀 Seed Needs Water...';
      notifMessage = `You missed "${experiment.title}" today. Don't worry — every gardener has off days. Get back to it tomorrow! 💪`;
      notifType = 'miss';
    }

    // Check for milestone streaks
    if (status === 'completed' && [7, 14, 21, 30, 60, 90, 100].includes(newCurrentStreak)) {
      notifTitle = '🌳 Milestone Reached!';
      notifMessage = `Amazing! You've maintained "${experiment.title}" for ${newCurrentStreak} days straight! Your seed is growing into a mighty tree! 🎉`;
      notifType = 'milestone';
    }

    await conn.query<ResultSetHeader>(
      'INSERT INTO notifications (user_id, daily_log_id, type, title, message) VALUES (?, ?, ?, ?, ?)',
      [userId, logId, notifType, notifTitle, notifMessage]
    );

    // ─── COMMIT TRANSACTION ───────────────────────────
    await conn.commit();

    res.status(201).json({
      log: { id: logId, experiment_id: experimentId, log_date: date, status, note },
      notification: { type: notifType, title: notifTitle, message: notifMessage },
      streak: { current: newCurrentStreak, longest: newLongestStreak },
    });
  } catch (error: any) {
    // ─── ROLLBACK TRANSACTION on failure ──────────────
    await conn.rollback();

    // Handle duplicate entry (unique constraint on experiment_id + log_date)
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'You have already logged this experiment for today' });
      return;
    }

    console.error('Log entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

// ─── Get Logs for Experiment ─────────────────────────────
router.get('/:id/logs', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session.userId;
    const experimentId = req.params.id;

    // Verify ownership
    const [experiments] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM experiments WHERE id = ? AND user_id = ?',
      [experimentId, userId]
    );

    if (experiments.length === 0) {
      res.status(404).json({ error: 'Experiment not found' });
      return;
    }

    const [logs] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM daily_logs WHERE experiment_id = ? ORDER BY log_date DESC',
      [experimentId]
    );

    res.json({ logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
