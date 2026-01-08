const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middlewares/auth');
const bcrypt = require('bcrypt');

// Todas las rutas de admin requieren autenticación y ser admin
router.use(authenticateToken);
router.use(isAdmin);

// DASHBOARD ADMIN
router.get('/dashboard', async (req, res) => {
    try {
        const Universidad = require('../models/Universidad');
        const Estudiante = require('../models/Estudiante');
        const Periodo = require('../models/Periodo');

        const totalUniversidades = await Universidad.count();
        const totalEstudiantes = await Estudiante.count();
        const totalPeriodos = await Periodo.count();
        const universidadesActivas = await Universidad.count({ where: { activa: true } });
        const estudiantesActivos = await Estudiante.count({ where: { activo: true } });

        res.json({
            success: true,
            message: 'Dashboard de administrador',
            usuario: req.user,
            estadisticas: {
                totalUniversidades,
                totalEstudiantes,
                totalPeriodos,
                universidadesActivas,
                estudiantesActivos
            }
        });

    } catch (error) {
        console.error('❌ Error en dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cargar el dashboard'
        });
    }
});

// CRUD UNIVERSIDADES
router.get('/universidades', async (req, res) => {
    try {
        const Universidad = require('../models/Universidad');
        const universidades = await Universidad.findAll({
            order: [['nombre', 'ASC']]
        });

        res.json({
            success: true,
            count: universidades.length,
            universidades
        });

    } catch (error) {
        console.error('❌ Error obteniendo universidades:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener universidades'
        });
    }
});

router.post('/universidades', async (req, res) => {
    try {
        const { nombre } = req.body;

        if (!nombre) {
            return res.status(400).json({
                success: false,
                error: 'El nombre es requerido'
            });
        }

        const Universidad = require('../models/Universidad');

        const existe = await Universidad.findOne({ where: { nombre } });
        if (existe) {
            return res.status(400).json({
                success: false,
                error: 'Ya existe una universidad con ese nombre'
            });
        }

        const universidad = await Universidad.create({
            nombre,
            activa: true
        });

        res.status(201).json({
            success: true,
            message: 'Universidad creada',
            universidad
        });

    } catch (error) {
        console.error('❌ Error creando universidad:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear universidad'
        });
    }
});

// CRUD PERIODOS
router.get('/periodos', async (req, res) => {
    try {
        const Periodo = require('../models/Periodo');
        const periodos = await Periodo.findAll({
            order: [['fecha_inicio', 'DESC']]
        });

        res.json({
            success: true,
            count: periodos.length,
            periodos
        });

    } catch (error) {
        console.error('❌ Error obteniendo periodos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener periodos'
        });
    }
});

router.post('/periodos', async (req, res) => {
    try {
        const { universidad_id, nombre, fecha_inicio, fecha_fin, horas_totales_requeridas } = req.body;

        if (!universidad_id || !nombre || !fecha_inicio || !fecha_fin || !horas_totales_requeridas) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos son requeridos'
            });
        }

        const Periodo = require('../models/Periodo');
        const Universidad = require('../models/Universidad');

        const universidad = await Universidad.findByPk(universidad_id);
        if (!universidad) {
            return res.status(404).json({
                success: false,
                error: 'Universidad no encontrada'
            });
        }

        const periodo = await Periodo.create({
            universidad_id,
            nombre,
            fecha_inicio,
            fecha_fin,
            horas_totales_requeridas,
            activo: true
        });

        res.status(201).json({
            success: true,
            message: 'Periodo creado',
            periodo
        });

    } catch (error) {
        console.error('❌ Error creando periodo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear periodo'
        });
    }
});

// CRUD ESTUDIANTES
router.get('/estudiantes', async (req, res) => {
    try {
        const Estudiante = require('../models/Estudiante');
        const estudiantes = await Estudiante.findAll({
            order: [['apellidos', 'ASC']]
        });

        res.json({
            success: true,
            count: estudiantes.length,
            estudiantes
        });

    } catch (error) {
        console.error('❌ Error obteniendo estudiantes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estudiantes'
        });
    }
});

router.post('/estudiantes', async (req, res) => {
    try {
        const { nombres, apellidos, email, password, universidad_id, periodo_id } = req.body;

        if (!nombres || !apellidos || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Nombres, apellidos, email y contraseña son requeridos'
            });
        }

        const Estudiante = require('../models/Estudiante');
        const Administrador = require('../models/Administrador');

        const existeEstudiante = await Estudiante.findOne({ where: { email } });
        const existeAdmin = await Administrador.findOne({ where: { email } });

        if (existeEstudiante || existeAdmin) {
            return res.status(400).json({
                success: false,
                error: 'El email ya está registrado'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const estudiante = await Estudiante.create({
            nombres,
            apellidos,
            email,
            password_hash: passwordHash,
            universidad_id: universidad_id || null,
            periodo_id: periodo_id || null,
            activo: true
        });

        res.status(201).json({
            success: true,
            message: 'Estudiante creado',
            estudiante
        });

    } catch (error) {
        console.error('❌ Error creando estudiante:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear estudiante'
        });
    }
});

module.exports = router;