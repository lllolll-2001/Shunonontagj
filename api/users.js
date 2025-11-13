import pool from './db.js';

export default async function handler(req, res) {
  if(req.method === 'POST'){
    const { action, login, password } = req.body;

    if(action === 'login'){
      try {
        const result = await pool.query(
          'SELECT id, login, role FROM users WHERE login=$1 AND password=$2',
          [login, password]
        );
        if(result.rows.length > 0){
          res.status(200).json({ user: result.rows[0] });
        } else res.status(401).json({ message:'Неверный логин или пароль' });
      } catch(e){
        res.status(500).json({ message: e.message });
      }
    }
  } else {
    res.status(405).json({ message:'Метод не поддерживается' });
  }
}
