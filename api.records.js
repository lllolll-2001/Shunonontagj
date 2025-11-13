import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres.bmasqfcvjwydpwlqqmcu',
  host: 'aws-1-eu-north-1.pooler.supabase.com',
  database: 'postgres',
  password: 'ВАШ_ПАРОЛЬ',
  port: 6543,
  ssl: { rejectUnauthorized: false }
});

// Создание таблиц и дефолтных пользователей
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      login TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    );`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS records (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      car TEXT NOT NULL,
      radius TEXT NOT NULL,
      service TEXT NOT NULL,
      date DATE NOT NULL,
      time TEXT NOT NULL,
      status TEXT DEFAULT 'Не отмечено'
    );`);
  await pool.query("INSERT INTO users (login,password,role) VALUES ('boss','123','boss') ON CONFLICT DO NOTHING");
  await pool.query("INSERT INTO users (login,password,role) VALUES ('worker1','456','worker') ON CONFLICT DO NOTHING");
}

// ==== Функция Vercel ====
export default async function handler(req, res) {
  await initDB();

  if(req.method==='GET'){
    const result = await pool.query('SELECT * FROM records ORDER BY id DESC');
    res.status(200).json(result.rows);
  } else if(req.method==='POST'){
    const data = req.body;
    if(data.action==='login'){
      const result = await pool.query('SELECT * FROM users WHERE login=$1 AND password=$2',[data.login,data.password]);
      if(result.rows.length>0) res.status(200).json({user: result.rows[0]});
      else res.status(401).json({message:'Неверный логин'});
    } else {
      const {name,phone,car,radius,service,date,time} = data;
      const result = await pool.query(
        `INSERT INTO records (name,phone,car,radius,service,date,time) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [name,phone,car,radius,service,date,time]
      );
      res.status(201).json(result.rows[0]);
    }
  } else res.status(405).json({message:'Метод не поддерживается'});
}
