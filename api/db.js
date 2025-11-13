import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres.bmasqfcvjwydpwlqqmcu',
  host: 'aws-1-eu-north-1.pooler.supabase.com',
  database: 'postgres',
  password: 'Vlad.123q', // твой пароль
  port: 6543,
  ssl: { rejectUnauthorized: false }
});

export default pool;
