import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres.bmasqfcvjwydpwlqqmcu',             // твой пользователь
  host: 'aws-1-eu-north-1.pooler.supabase.com',      // хост Supabase
  database: 'postgres',                               // база данных
  password: 'Vlad.123q',                            // пароль
  port: 6543,
  ssl: { rejectUnauthorized: false }
});

export default pool;
