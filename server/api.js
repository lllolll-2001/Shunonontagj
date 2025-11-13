import express from 'express';
import bodyParser from 'body-parser';
import pool from './db.js';

const app = express();
app.use(bodyParser.json());

// ==== Получение всех записей ====
app.get('/api', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM records ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения записей' });
  }
});

// ==== Добавление записи или логин ====
app.post('/api', async (req, res) => {
  const data = req.body;

  // ==== Логин ====
  if(data.action==='login'){
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

  // ==== Добавление записи ====
  try {
    const query = `
      INSERT INTO records (name, phone, car, radius, service, date, time)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
    const values = [data.name, data.phone, data.car, data.radius, data.service, data.date, data.time];
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch(err){
    console.error(err);
    res.status(500).json({ message:'Ошибка добавления записи' });
  }
});

// ==== Сервер на 3000 порту ====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
