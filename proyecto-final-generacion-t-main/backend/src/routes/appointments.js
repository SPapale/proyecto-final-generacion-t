const express = require('express');
const router = express.Router();
const pool = require('../db');

// Obtener servicios disponibles
router.get('/services', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services WHERE activo = true');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

// Obtener turnos
router.get('/', async (req, res) => {
  try {
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

// Crear turno con reglas de negocio (RN-003, RN-004, RN-005)
router.post('/', async (req, res) => {
  const { user_id, service_id, fecha_hora_inicio } = req.body;

  try {
    // 1. Obtener duración del servicio
    const serviceResult = await pool.query('SELECT duracion_minutos FROM services WHERE id = $1 AND activo = true', [service_id]);
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no disponible' });
    }

    const duracion = serviceResult.rows[0].duracion_minutos;
    const inicio = new Date(fecha_hora_inicio);
    const fin = new Date(inicio.getTime() + duracion * 60000);

    // Validar fecha pasada (RN-003)
    if (inicio < new Date()) {
      return res.status(400).json({ error: 'No podés reservar un turno en una fecha u hora pasada.' });
    }

    // 2. Validar superposición (RN-005)
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

    // 3. Insertar turno
    const newAppointment = await pool.query(
      `INSERT INTO appointments (user_id, service_id, fecha_hora_inicio, fecha_hora_fin) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, service_id, inicio, fin]
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