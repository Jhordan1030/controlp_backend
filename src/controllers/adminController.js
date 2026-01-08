// ==================== src/controllers/adminController.js ====================
const bcrypt = require('bcrypt');
const Universidad = require('../models/Universidad');
const Estudiante = require('../models/Estudiante');
const Periodo = require('../models/Periodo');
const Administrador = require('../models/Administrador');
const RegistroHora = require('../models/RegistroHora');

const adminController = {
    // DASHBOARD
    dashboard: async (req, res) => {
        try {
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
    },

    // CRUD UNIVERSIDADES
    listarUniversidades: async (req, res) => {
        try {
            const universidades = await Universidad.findAll({
                order: [['nombre', 'ASC']]
            });

            res.json({
                success: true,
                count: universidades.length,
                universidades
            });
        } catch (error) {
            console.error('❌ Error:', error);
            res.status(500).json({ success: false, error: 'Error al obtener universidades' });
        }
    },

    crearUniversidad: async (req, res) => {
        try {
            const { nombre } = req.body;

            if (!nombre) {
                return res.status(400).json({
                    success: false,
                    error: 'El nombre es requerido'
                });
            }

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
            console.error('❌ Error:', error);
            res.status(500).json({ success: false, error: 'Error al crear universidad' });
        }
    },

    // CRUD PERIODOS
    listarPeriodos: async (req, res) => {
        try {
            const periodos = await Periodo.findAll({
                include: [{
                    model: Universidad,
                    as: 'universidad',
                    attributes: ['id', 'nombre']
                }],
                order: [['fecha_inicio', 'DESC']]
            });

            res.json({
                success: true,
                count: periodos.length,
                periodos
            });
        } catch (error) {
            console.error('❌ Error:', error);
            res.status(500).json({ success: false, error: 'Error al obtener periodos' });
        }
    },

    crearPeriodo: async (req, res) => {
        try {
            const { universidad_id, nombre, fecha_inicio, fecha_fin, horas_totales_requeridas } = req.body;

            if (!universidad_id || !nombre || !fecha_inicio || !fecha_fin || !horas_totales_requeridas) {
                return res.status(400).json({
                    success: false,
                    error: 'Todos los campos son requeridos'
                });
            }

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
            console.error('❌ Error:', error);
            res.status(500).json({ success: false, error: 'Error al crear periodo' });
        }
    },

    // CRUD ESTUDIANTES
    listarEstudiantes: async (req, res) => {
        try {
            const estudiantes = await Estudiante.findAll({
                include: [
                    {
                        model: Universidad,
                        as: 'universidad',
                        attributes: ['id', 'nombre']
                    },
                    {
                        model: Periodo,
                        as: 'periodo',
                        attributes: ['id', 'nombre', 'horas_totales_requeridas']
                    }
                ],
                order: [['apellidos', 'ASC']]
            });

            res.json({
                success: true,
                count: estudiantes.length,
                estudiantes
            });
        } catch (error) {
            console.error('❌ Error:', error);
            res.status(500).json({ success: false, error: 'Error al obtener estudiantes' });
        }
    },

    crearEstudiante: async (req, res) => {
        try {
            const { nombres, apellidos, email, password, universidad_id, periodo_id } = req.body;

            if (!nombres || !apellidos || !email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Nombres, apellidos, email y contraseña son requeridos'
                });
            }

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
            console.error('❌ Error:', error);
            res.status(500).json({ success: false, error: 'Error al crear estudiante' });
        }
    },

    obtenerEstudiante: async (req, res) => {
        try {
            const { id } = req.params;

            const estudiante = await Estudiante.findByPk(id, {
                include: [
                    {
                        model: Universidad,
                        as: 'universidad'
                    },
                    {
                        model: Periodo,
                        as: 'periodo'
                    },
                    {
                        model: RegistroHora,
                        as: 'registros',
                        order: [['fecha', 'DESC']]
                    }
                ]
            });

            if (!estudiante) {
                return res.status(404).json({
                    success: false,
                    error: 'Estudiante no encontrado'
                });
            }

            // Calcular horas totales
            const totalHoras = estudiante.registros.reduce((sum, reg) =>
                sum + parseFloat(reg.horas), 0
            );

            res.json({
                success: true,
                estudiante: {
                    ...estudiante.toJSON(),
                    totalHoras,
                    horasRequeridas: estudiante.periodo?.horas_totales_requeridas || 0,
                    horasFaltantes: (estudiante.periodo?.horas_totales_requeridas || 0) - totalHoras
                }
            });
        } catch (error) {
            console.error('❌ Error:', error);
            res.status(500).json({ success: false, error: 'Error al obtener estudiante' });
        }
    },

    actualizarEstudiante: async (req, res) => {
        try {
            const { id } = req.params;
            const { nombres, apellidos, universidad_id, periodo_id, activo } = req.body;

            const estudiante = await Estudiante.findByPk(id);

            if (!estudiante) {
                return res.status(404).json({
                    success: false,
                    error: 'Estudiante no encontrado'
                });
            }

            await estudiante.update({
                nombres: nombres || estudiante.nombres,
                apellidos: apellidos || estudiante.apellidos,
                universidad_id: universidad_id !== undefined ? universidad_id : estudiante.universidad_id,
                periodo_id: periodo_id !== undefined ? periodo_id : estudiante.periodo_id,
                activo: activo !== undefined ? activo : estudiante.activo
            });

            res.json({
                success: true,
                message: 'Estudiante actualizado',
                estudiante
            });
        } catch (error) {
            console.error('❌ Error:', error);
            res.status(500).json({ success: false, error: 'Error al actualizar estudiante' });
        }
    }
};

module.exports = adminController;