const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../backend/.env' });

(async () => {
    let pool;
    try {
        pool = mysql.createPool({ host: 'localhost', user: process.env.DB_USER||'root', password: process.env.DB_PASSWORD||'Sushant0903', database: process.env.DB_NAME||'itera_lifelab' });
        const [exps] = await pool.query('SELECT id FROM experiments WHERE user_id = 11'); // Demo User ID varies, so let's get email first
        const [users] = await pool.query('SELECT id FROM users WHERE email="demo@itera.lab"');
        const userId = users[0].id;
        
        const [e] = await pool.query('SELECT id FROM experiments WHERE user_id = ?', [userId]);
        const expIds = e.map(x => x.id);
        
        console.log('Target expIds:', expIds);
        
        if (expIds.length > 0) {
            await pool.query('DELETE FROM notifications WHERE daily_log_id IN (SELECT id FROM daily_logs WHERE experiment_id IN (?))', [expIds]);
            await pool.query('DELETE FROM daily_logs WHERE experiment_id IN (?)', [expIds]);
            await pool.query('DELETE FROM experiment_categories WHERE experiment_id IN (?)', [expIds]);
            await pool.query('DELETE FROM experiments WHERE id IN (?)', [expIds]);
        }
        console.log('Reset complete');
    } catch (e) {
        console.error('SQL Error details:', e.sqlMessage || e.message);
    } finally {
        if(pool) pool.end();
    }
})();
