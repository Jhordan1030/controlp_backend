// ==================== src/routes/adminRoutes.js ====================
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

// Todas las rutas requieren autenticación y ser admin
router.use(authenticateToken);
router.use(isAdmin);

// ========== DASHBOARD Y PERFIL ==========
router.get('/dashboard', adminController.dashboard);
router.put('/cambiar-password', adminController.cambiarPassword);

// ========== UNIVERSIDADES ==========
// Obtener todas las universidades
router.get('/universidades', adminController.listarUniversidades);

// Obtener una universidad específica
router.get('/universidades/:id', adminController.obtenerUniversidad);

// Crear nueva universidad
router.post('/universidades', adminController.crearUniversidad);

// Actualizar universidad
router.put('/universidades/:id', adminController.actualizarUniversidad);

// Activar/desactivar universidad
router.put('/universidades/:id/toggle', adminController.toggleUniversidad);

// Eliminar universidad
router.delete('/universidades/:id', adminController.eliminarUniversidad);

// ========== PERIODOS ==========
// Obtener todos los periodos (Caché 5 min = 300 seg)
const { cacheMiddleware } = require('../middlewares/cache');
router.get('/periodos', cacheMiddleware(300), adminController.listarPeriodos);

// Obtener un periodo específico
router.get('/periodos/:id', adminController.obtenerPeriodo);

// Crear nuevo periodo
router.post('/periodos', adminController.crearPeriodo);

// Actualizar periodo
router.put('/periodos/:id', adminController.actualizarPeriodo);

// Activar/desactivar periodo
router.put('/periodos/:id/toggle', adminController.togglePeriodo);

// Eliminar periodo
router.delete('/periodos/:id', adminController.eliminarPeriodo);

// Verificar vencimiento de periodos (Ejecutar diariamente)
router.post('/periodos/verificar-vencimiento', adminController.verificarPeriodosVencidos);

// ========== ESTUDIANTES ==========
// Obtener todos los estudiantes
router.get('/estudiantes', adminController.listarEstudiantes);

// Obtener un estudiante específico
router.get('/estudiantes/:id', adminController.obtenerEstudiante);

// Crear nuevo estudiante
router.post('/estudiantes', adminController.crearEstudiante);

// Actualizar estudiante
router.put('/estudiantes/:id', adminController.actualizarEstudiante);
router.post('/periodos/:id/matricula-masiva', adminController.matricularEstudiantesMasivo);

// Activar/desactivar estudiante
router.put('/estudiantes/:id/toggle', adminController.toggleEstudiante);

// Reestablecer contraseña de estudiante
router.put('/estudiantes/:id/reestablecer-password', adminController.reestablecerPassword);

// Eliminar estudiante
router.delete('/estudiantes/:id', adminController.eliminarEstudiante);

// Obtener estadísticas de estudiante
router.get('/estudiantes/:id/estadisticas', adminController.estadisticasEstudiante);

// ========== LEADS (SOLICITUDES DEMO) ==========
const adminLeadsController = require('../controllers/adminLeadsController');
router.get('/leads', adminLeadsController.getAllLeads);
router.put('/leads/:id', adminLeadsController.updateLeadStatus);

// ========== AUDITORÍA MANUAL ==========
router.post('/auditoria/log', adminController.registrarAccionManual);

module.exports = router;