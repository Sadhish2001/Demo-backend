require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Add this middleware at the top of your routes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Add before all routes
app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url}`);
  next();
});

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Students CRUD
app.get('/students', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/students', async (req, res) => {
  try {
    const { name, class: studentClass } = req.body;
    const [result] = await pool.query(
      'INSERT INTO students (name, class) VALUES (?, ?)',
      [name, studentClass]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get student by ID
app.get('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, class: studentClass } = req.body;
    
    // Enhanced validation
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }
    if (!name || !studentClass) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`Updating student ${id} with`, { name, studentClass });
    
    const [result] = await pool.query(
      'UPDATE students SET name = ?, class = ? WHERE id = ?',
      [name, studentClass, id]
    );
    
    console.log('Update result:', result);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student updated successfully' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete student by ID
app.delete('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    const [result] = await pool.query(
      'DELETE FROM students WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});