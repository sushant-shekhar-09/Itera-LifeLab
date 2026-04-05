const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });

async function removeConstraint() {
  let pool;
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Sushant0903',
      database: process.env.DB_NAME || 'itera_lifelab',
    });

    console.log('Querying indexes on daily_logs...');
    const [indexes] = await pool.query('SHOW INDEX FROM daily_logs');
    
    // Find the unique index that involves log_date (and isn't the primary key)
    const uniqueIndexes = indexes.filter(i => i.Non_unique === 0 && i.Key_name !== 'PRIMARY');
    
    // Group by Key_name
    const keys = [...new Set(uniqueIndexes.map(i => i.Key_name))];
    
    for (const key of keys) {
      console.log(`Dropping unique index: ${key}`);
      await pool.query(`ALTER TABLE daily_logs DROP INDEX ${key}`);
      console.log(`Dropped ${key} successfully.`);
    }

    if (keys.length === 0) {
      console.log('No unique constraints to drop (already removed).');
    } else {
      console.log('Daily logging restriction completely removed!');
    }
  } catch (error) {
    console.error('Failed to remove constraint:', error);
  } finally {
    if (pool) await pool.end();
  }
}

removeConstraint();
