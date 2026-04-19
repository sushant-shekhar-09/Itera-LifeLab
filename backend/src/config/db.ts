import 'dotenv/config';
import mysql from 'mysql2/promise';

const isProduction = process.env.NODE_ENV === 'production';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'itera_lifelab',
  waitForConnections: true,
  connectionLimit: isProduction ? 5 : 10,  // Lower limit for free-tier DB
  queueLimit: 0,
  ...(isProduction && {
    ssl: { rejectUnauthorized: true },       // Aiven requires SSL
  }),
});
