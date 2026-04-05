const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Sushant0903',
    database: process.env.DB_NAME || 'itera_lifelab',
  });

  try {
    console.log('Starting Demo Seeding...');

    // 1. Create Demo User
    const email = 'demo@itera.lab';
    const password = await bcrypt.hash('demo123', 10);
    
    // Wipe old demo user if exists to start fresh
    await pool.query('DELETE FROM users WHERE email = ?', [email]);
    
    const [userRes] = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      ['Demo Explorer', email, password]
    );
    const userId = userRes.insertId;
    console.log('Demo User Created. ID:', userId);

    // Helper to format Date to YYYY-MM-DD
    const formatDate = (d) => d.toISOString().split('T')[0];
    
    // Format timestamp
    const formatTimestamp = (d) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const today = new Date();

    // ---- HABIT 1: The Mastered Habit (100% Completion) ----
    const h1Start = new Date(today);
    h1Start.setDate(today.getDate() - 30);
    const [h1Res] = await pool.query(
      'INSERT INTO experiments (user_id, title, description, duration_days, start_date) VALUES (?, ?, ?, ?, ?)',
      [userId, 'Morning Sunrise Walk', 'Get morning sunlight to reset circadian rhythm.', 30, formatDate(h1Start)]
    );
    const h1Id = h1Res.insertId;

    // Create 30 days of perfect logs for h1
    for(let i=0; i<30; i++) {
        const logD = new Date(h1Start);
        logD.setDate(h1Start.getDate() + i);
        
        // Log happened at 7 AM
        const logTime = new Date(logD);
        logTime.setHours(7, Math.floor(Math.random() * 30), 0);

        await pool.query(
            "INSERT INTO daily_logs (experiment_id, log_date, status, created_at) VALUES (?, ?, 'completed', ?)",
            [h1Id, formatDate(logD), formatTimestamp(logTime)]
        );
    }
    
    // Update streak artificially (assuming it ran 30 days straight)
    await pool.query('UPDATE experiments SET current_streak = 30, longest_streak = 30 WHERE id = ?', [h1Id]);
    console.log('Habit 1 (Mastered) Generated');

    // ---- HABIT 2: The Struggling Weekender (High Drop, Weekend skips) ----
    const h2Start = new Date(today);
    h2Start.setDate(today.getDate() - 20);
    const [h2Res] = await pool.query(
      'INSERT INTO experiments (user_id, title, description, duration_days, start_date) VALUES (?, ?, ?, ?, ?)',
      [userId, 'Tech-Free Evenings', 'No screens 2 hours before bed.', 60, formatDate(h2Start)]
    );
    const h2Id = h2Res.insertId;

    let h2Streak = 0;
    for(let i=0; i<20; i++) {
        const logD = new Date(h2Start);
        logD.setDate(h2Start.getDate() + i);
        const isWeekend = logD.getDay() === 0 || logD.getDay() === 6;
        
        const status = isWeekend ? 'missed' : 'completed';
        
        if(status === 'completed') h2Streak++;
        else h2Streak = 0;

        // Log happened at 9 PM (21:00)
        const logTime = new Date(logD);
        logTime.setHours(21, 15, 0);

        await pool.query(
            "INSERT INTO daily_logs (experiment_id, log_date, status, created_at) VALUES (?, ?, ?, ?)",
            [h2Id, formatDate(logD), status, formatTimestamp(logTime)]
        );
    }
    await pool.query('UPDATE experiments SET current_streak = ? WHERE id = ?', [h2Streak, h2Id]);
    console.log('Habit 2 (Weekender) Generated');


    // ---- HABIT 3: The Dropped Habit (Consistency loss) ----
    const h3Start = new Date(today);
    h3Start.setDate(today.getDate() - 10);
    const [h3Res] = await pool.query(
      'INSERT INTO experiments (user_id, title, description, duration_days, start_date) VALUES (?, ?, ?, ?, ?)',
      [userId, 'Read 20 Pages', 'Non-fiction reading every day.', 30, formatDate(h3Start)]
    );
    const h3Id = h3Res.insertId;

    for(let i=0; i<10; i++) {
        const logD = new Date(h3Start);
        logD.setDate(h3Start.getDate() + i);
        
        // Completed first 7 days, missed last 3 days
        const status = i < 7 ? 'completed' : 'missed';
        
        // Logged at 8 PM (20:00)
        const logTime = new Date(logD);
        logTime.setHours(20, 0, 0);

        await pool.query(
            "INSERT INTO daily_logs (experiment_id, log_date, status, created_at) VALUES (?, ?, ?, ?)",
            [h3Id, formatDate(logD), status, formatTimestamp(logTime)]
        );
    }
    await pool.query('UPDATE experiments SET current_streak = 0 WHERE id = ?', [h3Id]);
    console.log('Habit 3 (Dropped) Generated');


    // ---- HABIT 4: Brand New Seed ----
    const [h4Res] = await pool.query(
      'INSERT INTO experiments (user_id, title, description, duration_days, start_date) VALUES (?, ?, ?, ?, ?)',
      [userId, 'Drink 3L Water', 'Hydration challenge.', 14, formatDate(today)]
    );
    console.log('Habit 4 (New Seed) Generated');


    console.log('🎉 Database Seeding Complete!');
    console.log(`Email: demo@itera.lab`);
    console.log(`Password: demo123`);

  } catch (error) {
    console.error('Seeding completely failed:', error);
  } finally {
    pool.end();
  }
}

seed();
