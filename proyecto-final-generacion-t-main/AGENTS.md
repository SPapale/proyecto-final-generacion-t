# 🤖 AGENTS.md - Directrices del Proyecto Turnero de Peluquería

Este documento guía a los agentes de IA y colaboradores sobre la estructura, convenciones y funcionamiento de este repositorio.

## 📁 Estructura del Repositorio
- `backend/`: API REST desarrollada en Node.js y Express.js.
  - `src/app.js`: Punto de entrada del servidor.
  - `src/db.js`: Conexión al pool de PostgreSQL (Neon DB).
  - `src/routes/`: Rutas de la API (incluye lógica de turnos y autorreparación).
- `frontend/` (o raíz): Archivos estáticos de la interfaz web (HTML/CSS/JS) para Netlify.
- `docs/`: Documentación formal del sistema (`SPEC.md`, `TESTING.md`).

## ⚙️ Reglas Técnicas y de Negocio Clave
1. **Autorreparación de Base de Datos**: El backend cuenta con rutinas automáticas (`ensureDatabaseInitialized`) que crean las tablas (`users`, `services`, `appointments`) y los registros iniciales si la base de datos se encuentra vacía.
2. **Claves Foráneas**: Las reservas (`appointments`) dependen de un usuario (`user_id = 1`) y un servicio activo (`service_id`).
3. **Validación de Fechas**: Se rechazan automáticamente reservas con marcas de tiempo en el pasado o superposiciones horarias.

## 🚀 Comandos de Ejecución Local
- **Backend**:
  ```bash
  cd backend
  npm install
  npm start