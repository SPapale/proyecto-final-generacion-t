# 📄 Especificación Técnica y Reglas de Negocio - Turnero de Peluquería

## 1. Descripción General del Sistema
Sistema web full-stack diseñado para la gestión y reserva de turnos online en una peluquería o centro de estética. Permite a los clientes visualizar los servicios disponibles, verificar horarios y reservar turnos en tiempo real, evitando superposiciones.

## 2. Arquitectura y Stack Tecnológico
- **Frontend**: Single Page Application (SPA) desarrollada en HTML5, CSS3 y JavaScript vanilla con Fetch API para la comunicación con el servidor. Alojada y desplegada en **Netlify**.
- **Backend**: API REST desarrollada en Node.js con Express.js. Gestiona la lógica de negocio, validaciones y conexión a la base de datos. Desplegada en **Render**.
- **Base de Datos**: Relacional PostgreSQL alojada en **Neon DB**, estructurada con claves foráneas e integridad referencial.

## 3. Estructura de la Base de Datos (Esquema Relacional)
El sistema cuenta con tres tablas principales:
1. **`users`**: Almacena la información de los usuarios (clientes y administradores).
2. **`services`**: Contiene el catálogo de servicios ofrecidos (nombre, duración en minutos, precio, estado activo).
3. **`appointments`**: Almacena los turnos reservados vinculando un usuario y un servicio, con marcas temporales de inicio y fin.

## 4. Reglas de Negocio Implementadas
- **RN-001 (Duración Dinámica)**: Cada turno calcula automáticamente su hora de finalización (`fecha_hora_fin`) sumando la duración en minutos del servicio seleccionado.
- **RN-002 (Integridad de Usuario)**: Las reservas se asocian de manera segura al ID de usuario correspondiente mediante claves foráneas con borrado en cascada.
- **RN-003 (Validación de Temporalidad)**: El sistema rechaza automáticamente cualquier intento de reservar un turno en una fecha u hora pasada.
- **RN-004 (Autorreparación de Estado)**: El backend inicializa de forma automática las tablas y los registros por defecto (usuario base y catálogo de servicios) en el primer arranque para evitar errores de clave foránea.
- **RN-005 (Control de Superposición)**: El backend valida mediante consultas SQL que no existan turnos confirmados en el mismo intervalo de tiempo antes de confirmar una nueva reserva.