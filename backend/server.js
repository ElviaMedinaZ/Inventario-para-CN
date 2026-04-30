const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const db = mysql.createConnection({
  host: '127.0.0.1',
  port : 3306,
  user: 'root',
  password: '1234', 
  database: 'inventario_db'
});

db.connect(err => {
  if (err) console.error('Error MySQL: ' + err.stack);
  else console.log('✅ Servidor SISC vinculado a MySQL correctamente');
});

// --- AUTENTICACIÓN ---
app.post('/auth/registro', (req, res) => {
    const { nombre, correo, password, rol } = req.body;
    const sql = 'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)';
    db.query(sql, [nombre, correo, password, rol], (err) => {
        if (err) return res.status(500).json({ error: "El correo ya existe" });
        res.json({ success: true });
    });
});

app.post('/auth/login', (req, res) => {
    const { correo, password } = req.body;
    const sql = 'SELECT * FROM usuarios WHERE correo = ? AND password = ?';
    db.query(sql, [correo, password], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length > 0) res.json({ success: true, user: results[0] });
        else res.status(401).json({ success: false });
    });
});

// --- RUTAS DE DATOS ---
app.get('/stats', (req, res) => {
    const sql = `SELECT COUNT(*) as total, IFNULL(SUM(stock), 0) as stock_total, 
                 COUNT(CASE WHEN stock < 10 THEN 1 END) as stock_bajo FROM productos`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result[0]);
    });
});

app.get('/productos', (req, res) => {
    db.query('SELECT * FROM productos ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get('/usuarios', (req, res) => {
    db.query('SELECT * FROM usuarios ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/productos', (req, res) => {
    const { nombre, stock } = req.body;
    db.query('INSERT INTO productos (nombre, stock) VALUES (?, ?)', [nombre, stock], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId });
    });
});

app.delete('/productos/:id', (req, res) => {
    db.query('DELETE FROM productos WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

app.delete('/usuarios/:id', (req, res) => {
    db.query('DELETE FROM usuarios WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

// --- GESTIÓN DE ARCHIVOS DESDE /VISTAS/ ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/vistas/login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/vistas/login.html'));
});

app.get('/sistema', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/vistas/index.html'));
});

app.get('/registro', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/vistas/registro.html'));
});

app.use((req, res) => {
  res.status(404).send('Página no encontrada');
});



app.listen(3000, () => console.log('🚀 SISTEMA EN: http://localhost:3000'));