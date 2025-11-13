import pool from './db.js';

export default async function handler(req,res){
  if(req.method === 'GET'){
    try{
      const result = await pool.query('SELECT * FROM records ORDER BY date, time');
      res.status(200).json(result.rows);
    } catch(e){
      res.status(500).json({message:e.message});
    }
  }
  else if(req.method === 'POST'){
    const { name, phone, car, radius, service, date, time } = req.body;
    try{
      const result = await pool.query(
        `INSERT INTO records (name, phone, car, radius, service, date, time)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [name, phone, car, radius, service, date, time]
      );
      res.status(201).json({ record: result.rows[0] });
    } catch(e){
      res.status(500).json({message:e.message});
    }
  }
  else {
    res.status(405).json({ message:'Метод не поддерживается' });
  }
}
