import express from 'express';
import bodyParser from 'body-parser';
import pkg from 'pg';
const { Pool } = pkg;

// ==== Подключение к базе ====
const pool = new Pool({
  user: 'postgres.bmasqfcvjwydpwlqqmcu',
  host: 'aws-1-eu-north-1.pooler.supabase.com',
  database: 'postgres',
  password: 'ВАШ_ПАРОЛЬ', // вставьте пароль Supabase
  port: 6543,
  ssl: { rejectUnauthorized: false }
});

const app = express();
app.use(bodyParser.json());

// ==== Создание таблиц, если их нет ====
async function createTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        login TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      );
    `);
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
        status TEXT DEFAULT 'Не отмечено',
        workDescription TEXT DEFAULT '',
        earned NUMERIC DEFAULT 0,
        addedBy TEXT DEFAULT 'Гость'
      );
    `);
    console.log('Таблицы созданы или уже существуют');
  } catch (err) {
    console.error('Ошибка создания таблиц:', err);
  }
}

// ==== Создание дефолтных пользователей ====
async function createDefaultUsers() {
  try {
    const bossCheck = await pool.query("SELECT * FROM users WHERE login='boss'");
    if (bossCheck.rows.length === 0) {
      await pool.query("INSERT INTO users (login,password,role) VALUES ($1,$2,$3)", ['boss','123','boss']);
      console.log('Добавлен пользователь boss');
    }

    const workerCheck = await pool.query("SELECT * FROM users WHERE login='worker1'");
    if (workerCheck.rows.length === 0) {
      await pool.query("INSERT INTO users (login,password,role) VALUES ($1,$2,$3)", ['worker1','456','worker']);
      console.log('Добавлен пользователь worker1');
    }
  } catch(err) {
    console.error('Ошибка создания пользователей:', err);
  }
}

// ==== Вызов при старте сервера ====
createTables().then(() => createDefaultUsers());

// ==== API ====

// Получить все записи
app.get('/api/records', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM records ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения записей' });
  }
});

// Добавить запись или логин
app.post('/api/records', async (req, res) => {
  const data = req.body;

  // === Логин ===
  if(data.action === 'login'){
    try {
      const result = await pool.query('SELECT * FROM users WHERE login=$1 AND password=$2', [data.login, data.password]);
      if(result.rows.length>0){
        return res.json({ user: result.rows[0] });
      } else {
        return res.status(401).json({ message:'Неверный логин или пароль' });
      }
    } catch(err){
      console.error(err);
      return res.status(500).json({ message:'Ошибка логина' });
    }
  }

  // === Добавление записи ===
  try {
    const query = `
      INSERT INTO records (name, phone, car, radius, service, date, time)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
    const values = [data.name, data.phone, data.car, data.radius, data.service, data.date, data.time];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch(err){
    console.error(err);
    res.status(500).json({ message:'Ошибка добавления записи' });
  }
});

// ==== Сервер ====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
