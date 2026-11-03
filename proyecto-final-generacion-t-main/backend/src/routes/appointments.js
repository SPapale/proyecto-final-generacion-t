const express = require('express');
const router = express.Router();
const pool = require('../db');

// Función auxiliar para asegurar que la base de datos tenga tablas e usuario inicial
async function ensureDatabaseInitialized() {
  try {
    // 1. Crear tabla users si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(20) DEFAULT 'CLIENTE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Crear tabla services si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        duracion_minutos INT NOT NULL,
        precio DECIMAL(10,2) NOT NULL,
        activo BOOLEAN DEFAULT TRUE
      );
    `);

    // 3. Crear tabla appointments si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        service_id INT REFERENCES services(id) ON DELETE CASCADE,
        fecha_hora_inicio TIMESTAMP NOT NULL,
        fecha_hora_fin TIMESTAMP NOT NULL,
        estado VARCHAR(20) DEFAULT 'CONFIRMADO',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Insertar usuario por defecto (ID 1)
    await pool.query(`
      INSERT INTO users (id, nombre, email, password, rol) 
      VALUES (1, 'Santiago', 'santiago@mail.com', '123456', 'CLIENTE')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 5. Insertar servicios iniciales si la tabla está vacía
    const serviceCheck = await pool.query('SELECT COUNT(*) FROM services');
    if (parseInt(serviceCheck.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO services (nombre, duracion_minutos, precio, activo) VALUES
        ('Corte Tradicional', 30, 8000.00, true),
        ('Barba y Perfilado', 30, 5000.00, true),
        ('Corte + Barba', 60, 12000.00, true);
      `);
    }
  } catch (err) {
    console.error('Error inicializando la base de datos automáticamente:', err);
  }
}

// Ejecutar inicialización al cargar la ruta
ensureDatabaseInitialized();

// Obtener servicios disponibles
router.get('/services', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
    const result = await pool.query('SELECT * FROM services WHERE activo = true');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

// Obtener turnos
router.get('/', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
    const result = await pool.query(`
      SELECT a.id, u.nombre as cliente, s.nombre as servicio, a.fecha_hora_inicio, a.fecha_hora_fin, a.estado
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      JOIN services s ON a.service_id = s.id
      ORDER BY a.fecha_hora_inicio DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener turnos' });
  }
});

// Crear turno con validaciones y autorreparación
router.post('/', async (req, res) => {
  const { service_id, fecha_hora_inicio } = req.body;

  try {
    await ensureDatabaseInitialized();

    // 1. Obtener duración del servicio
    const serviceResult = await pool.query('SELECT duracion_minutos FROM services WHERE id = $1 AND activo = true', [service_id]);
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no disponible' });
    }

    const duracion = serviceResult.rows[0].duracion_minutos;
    const inicio = new Date(fecha_hora_inicio);
    const fin = new Date(inicio.getTime() + duracion * 60000);

    // Validar fecha pasada
    if (inicio < new Date()) {
      return res.status(400).json({ error: 'No podés reservar un turno en una fecha u hora pasada.' });
    }

    // 2. Validar superposición de horarios
    const overlapCheck = await pool.query(
      `SELECT * FROM appointments 
       WHERE estado = 'CONFIRMADO' 
         AND (
           (fecha_hora_inicio <= $1 AND fecha_hora_fin > $1) OR
           (fecha_hora_inicio < $2 AND fecha_hora_fin >= $2) OR
           (fecha_hora_inicio >= $1 AND fecha_hora_fin <= $2)
         )`,
      [inicio, fin]
    );

    if (overlapCheck.rows.length > 0) {
      return res.status(409).json({ error: 'El horario seleccionado ya se encuentra ocupado.' });
    }

    // 3. Insertar turno asociado siempre al usuario 1
    const newAppointment = await pool.query(
      `INSERT INTO appointments (user_id, service_id, fecha_hora_inicio, fecha_hora_fin) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [1, service_id, inicio, fin]
    );

    res.status(201).json({
      message: 'Turno reservado con éxito',
      turno: newAppointment.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la reserva' });
  }
});

module.exports = router;