// ==================== src/routes/estudianteRoutes.js ====================
const express = require('express');
const router = express.Router();
const estudianteController = require('../controllers/estudianteController');
const { authenticateToken, isEstudiante } = require('../middlewares/auth');

// Todas las rutas requieren ser estudiante
router.use(authenticateToken);
router.use(isEstudiante);

// ========== PERFIL Y DASHBOARD ==========
router.get('/perfil', estudianteController.perfil);
router.get('/dashboard', estudianteController.dashboard);

// ========== REGISTROS DE HORAS ==========
// Registrar nuevas horas
router.post('/registrar-horas', estudianteController.registrarHoras);

// Obtener todos los registros (con paginación)
router.get('/registros', estudianteController.verRegistros);

// Obtener un registro específico
router.get('/registros/:id', async (req, res) => {
    try {
        const RegistroHora = require('../models/RegistroHora');
        const registro = await RegistroHora.findOne({
            where: {
                id: req.params.id,
                estudiante_id: req.user.id
            }
        });

        if (!registro) {
            return res.status(404).json({
                success: false,
                error: 'Registro no encontrado'
            });
        }

        res.json({
            success: true,
            registro
        });
    } catch (error) {
        console.error('❌ Error al obtener registro:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener registro'
        });
    }
});

// Actualizar registro
router.put('/registros/:id', estudianteController.actualizarRegistro);

// Eliminar registro
router.delete('/registros/:id', estudianteController.eliminarRegistro);

// ========== ESTADÍSTICAS ==========
// Obtener estadísticas personales
router.get('/estadisticas', estudianteController.misEstadisticas);

// ========== CONFIGURACIÓN ADICIONAL ==========
// Exportar registros (formato simple)
router.get('/exportar-registros', async (req, res) => {
    try {
        const RegistroHora = require('../models/RegistroHora');
        const registros = await RegistroHora.findAll({
            where: { estudiante_id: req.user.id },
            order: [['fecha', 'DESC']],
            attributes: ['fecha', 'horas', 'descripcion', 'created_at']
        });

        // Formato CSV simple
        let csv = 'Fecha,Horas,Descripción,Fecha de Registro\n';
        registros.forEach(registro => {
            csv += `"${registro.fecha}","${registro.horas}","${registro.descripcion.replace(/"/g, '""')}","${registro.created_at}"\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('registros_horas.csv');
        res.send(csv);
    } catch (error) {
        console.error('❌ Error al exportar registros:', error);
        res.status(500).json({
            success: false,
            error: 'Error al exportar registros'
        });
    }
});

module.exports = router;