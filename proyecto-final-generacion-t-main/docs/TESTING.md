# 🧪 Informe de Pruebas y Validación (TESTING.md)

Este documento detalla el plan de pruebas funcionales y de integración aplicado sobre el sistema de turnos para garantizar su correcto funcionamiento en producción.

## 1. Casos de Prueba Funcionales

| ID Prueba | Módulo / Componente | Descripción de la Prueba | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **CP-01** | Catálogo de Servicios | Cargar la página web y consultar la lista de servicios activos desde el backend. | El sistema muestra correctamente los servicios con sus precios y duraciones. | **Aprobado** |
| **CP-02** | Validación de Fechas | Intentar seleccionar y reservar un turno con una fecha u hora anterior al momento actual. | El servidor rechaza la petición con código `400` y mensaje de error descriptivo. | **Aprobado** |
| **CP-03** | Reserva Exitosa | Seleccionar un servicio disponible, elegir una fecha/hora futura válida y confirmar. | El sistema guarda el turno, calcula la hora de fin correctamente y devuelve éxito (`201`). | **Aprobado** |
| **CP-04** | Control de Superposición | Intentar reservar un turno en un horario que ya se encuentra ocupado por otro confirmado. | El servidor rechaza la reserva con código `409` (Conflicto de horario). | **Aprobado** |
| **CP-05** | Integridad de Base de Datos | Verificar la respuesta del backend ante ausencia de registros iniciales. | El backend ejecuta el mecanismo de auto-inicialización y procesa la solicitud sin errores. | **Aprobado** |

## 2. Entornos de Pruebas
- **Entorno Local**: Pruebas unitarias de endpoints mediante Node.js y simulación de cliente con fetch local.
- **Entorno de Producción**: Pruebas de integración punta a punta (E2E) conectando la interfaz alojada en Netlify (`.netlify.app`) con la API en Render y la base de datos en Neon DB.