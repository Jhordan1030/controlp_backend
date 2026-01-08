const express = require('express');
const router = express.Router();
const { authenticateToken, isEstudiante } = require('../middlewares/auth');

// Todas las rutas requieren ser estudiante
router.use(authenticateToken);
router.use(isEstudiante);

// PERFIL ESTUDIANTE
router.get('/perfil', async (req, res) => {
    try {
        const Estudiante = require('../models/Estudiante');

        const estudiante = await Estudiante.findByPk(req.user.id);

        if (!estudiante) {
            return res.status(404).json({
                success: false,
                error: 'Estudiante no encontrado'
            });
        }

        res.json({
            success: true,
            estudiante: {
                id: estudiante.id,
                nombres: estudiante.nombres,
                apellidos: estudiante.apellidos,
                email: estudiante.email,
                universidad_id: estudiante.universidad_id,
                periodo_id: estudiante.periodo_id,
                activo: estudiante.activo
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener perfil'
        });
    }
});

// DASHBOARD ESTUDIANTE
router.get('/dashboard', async (req, res) => {
    try {
        const Estudiante = require('../models/Estudiante');
        const RegistroHora = require('../models/RegistroHora');

        const estudiante = await Estudiante.findByPk(req.user.id);

        if (!estudiante) {
            return res.status(404).json({
                success: false,
                error: 'Estudiante no encontrado'
            });
        }

        // Obtener registros de horas
        const registros = await RegistroHora.findAll({
            where: { estudiante_id: req.user.id },
            order: [['fecha', 'DESC']],
            limit: 10
        });

        // Calcular total de horas
        const totalHoras = registros.reduce((sum, reg) => sum + parseFloat(reg.horas), 0);

        res.json({
            success: true,
            message: 'Dashboard de estudiante',
            estudiante: {
                nombres: estudiante.nombres,
                apellidos: estudiante.apellidos,
                email: estudiante.email
            },
            estadisticas: {
                totalRegistros: registros.length,
                totalHoras: totalHoras.toFixed(2),
                ultimosRegistros: registros
            }
        });

    } catch (error) {
        console.error('❌ Error en dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cargar dashboard'
        });
    }
});

// REGISTRAR HORAS
router.post('/registrar-horas', async (req, res) => {
    try {
        const { fecha, horas, descripcion } = req.body;

        if (!fecha || !horas || !descripcion) {
            return res.status(400).json({
                success: false,
                error: 'Fecha, horas y descripción son requeridos'
            });
        }

        // Validar que no sea fecha futura
        const hoy = new Date().toISOString().split('T')[0];
        if (fecha > hoy) {
            return res.status(400).json({
                success: false,
                error: 'No se pueden registrar horas para fechas futuras'
            });
        }

        // Validar horas (0.5 a 24)
        const horasNum = parseFloat(horas);
        if (horasNum < 0.5 || horasNum > 24) {
            return res.status(400).json({
                success: false,
                error: 'Las horas deben estar entre 0.5 y 24'
            });
        }

        const RegistroHora = require('../models/RegistroHora');

        // Verificar que no haya registro para esa fecha
        const existeRegistro = await RegistroHora.findOne({
            where: {
                estudiante_id: req.user.id,
                fecha: fecha
            }
        });

        if (existeRegistro) {
            return res.status(400).json({
                success: false,
                error: 'Ya existe un registro para esta fecha'
            });
        }

        // Crear registro
        const registro = await RegistroHora.create({
            estudiante_id: req.user.id,
            fecha,
            horas: horasNum,
            descripcion
        });

        res.status(201).json({
            success: true,
            message: 'Horas registradas exitosamente',
            registro
        });

    } catch (error) {
        console.error('❌ Error registrando horas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar horas'
        });
    }
});

// VER REGISTROS
router.get('/registros', async (req, res) => {
    try {
        const RegistroHora = require('../models/RegistroHora');

        const registros = await RegistroHora.findAll({
            where: { estudiante_id: req.user.id },
            order: [['fecha', 'DESC']]
        });

        res.json({
            success: true,
            count: registros.length,
            registros
        });

    } catch (error) {
        console.error('❌ Error obteniendo registros:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener registros'
        });
    }
});

module.exports = router;