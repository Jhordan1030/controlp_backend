// ==================== src/controllers/estudianteController.js ====================
const Estudiante = require('../models/Estudiante');
const RegistroHora = require('../models/RegistroHora');
const Universidad = require('../models/Universidad');
const Periodo = require('../models/Periodo');

const estudianteController = {
    // PERFIL
    perfil: async (req, res) => {
        try {
            const estudiante = await Estudiante.findByPk(req.user.id, {
                include: [
                    {
                        model: Universidad,
                        as: 'universidad'
                    },
                    {
                        model: Periodo,
                        as: 'periodo'
                    }
                ]
            });

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
                    universidad: estudiante.universidad,
                    periodo: estudiante.periodo,
                    activo: estudiante.activo
                }
            });
        } catch (error) {
            console.error('❌ Error:', error);
            res.status(500).json({ success: false, error: 'Error al obtener perfil' });
        }
    },

    // DASHBOARD
    dashboard: async (req, res) => {
        try {
            const estudiante = await Estudiante.findByPk(req.user.id, {
                include: [
                    {
                        model: Periodo,
                        as: 'periodo'
                    }
                ]
            });

            if (!estudiante) {
                return res.status(404).json({
                    success: false,
                    error: 'Estudiante no encontrado'
                });
            }

            const registros = await RegistroHora.findAll({
                where: { estudiante_id: req.user.id },
                order: [['fecha', 'DESC']],
                limit: 10
            });

            const totalHoras = registros.reduce((sum, reg) =>
                sum + parseFloat(reg.horas), 0
            );

            const horasRequeridas = estudiante.periodo?.horas_totales_requeridas || 0;

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
                    horasRequeridas,
                    horasFaltantes: Math.max(0, horasRequeridas - totalHoras).toFixed(2),
                    porcentaje: horasRequeridas > 0 ? ((totalHoras / horasRequeridas) * 100).toFixed(2) : 0,
                    ultimosRegistros: registros
                }
            });
        } catch (error) {
            console.error('❌ Error:', error);
            res.status(500).json({ success: false, error: 'Error al cargar dashboard' });
        }
    },

    // REGISTRAR HORAS
    registrarHoras: async (req, res) => {
        try {
            const { fecha, horas, descripcion } = req.body;

            if (!fecha || !horas || !descripcion) {
                return res.status(400).json({
                    success: false,
                    error: 'Fecha, horas y descripción son requeridos'
                });
            }

            // Validar fecha no futura
            const hoy = new Date().toISOString().split('T')[0];
            if (fecha > hoy) {
                return res.status(400).json({
                    success: false,
                    error: 'No se pueden registrar horas para fechas futuras'
                });
            }

            // Validar horas
            const horasNum = parseFloat(horas);
            if (horasNum < 0.5 || horasNum > 24) {
                return res.status(400).json({
                    success: false,
                    error: 'Las horas deben estar entre 0.5 y 24'
                });
            }

            // Verificar duplicado
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
            console.error('❌ Error:', error);
            res.status(500).json({ success: false, error: 'Error al registrar horas' });
        }
    },

    // VER REGISTROS
    verRegistros: async (req, res) => {
        try {
            const registros = await RegistroHora.findAll({
                where: { estudiante_id: req.user.id },
                order: [['fecha', 'DESC']]
            });

            const totalHoras = registros.reduce((sum, reg) =>
                sum + parseFloat(reg.horas), 0
            );

            res.json({
                success: true,
                count: registros.length,
                totalHoras: totalHoras.toFixed(2),
                registros
            });
        } catch (error) {
            console.error('❌ Error:', error);
            res.status(500).json({ success: false, error: 'Error al obtener registros' });
        }
    },

    // ACTUALIZAR REGISTRO
    actualizarRegistro: async (req, res) => {
        try {
            const { id } = req.params;
            const { horas, descripcion } = req.body;

            const registro = await RegistroHora.findOne({
                where: {
                    id,
                    estudiante_id: req.user.id
                }
            });

            if (!registro) {
                return res.status(404).json({
                    success: false,
                    error: 'Registro no encontrado'
                });
            }

            await registro.update({
                horas: horas || registro.horas,
                descripcion: descripcion || registro.descripcion
            });

            res.json({
                success: true,
                message: 'Registro actualizado',
                registro
            });
        } catch (error) {
            console.error('❌ Error:', error);
            res.status(500).json({ success: false, error: 'Error al actualizar registro' });
        }
    },

    // ELIMINAR REGISTRO
    eliminarRegistro: async (req, res) => {
        try {
            const { id } = req.params;

            const registro = await RegistroHora.findOne({
                where: {
                    id,
                    estudiante_id: req.user.id
                }
            });

            if (!registro) {
                return res.status(404).json({
                    success: false,
                    error: 'Registro no encontrado'
                });
            }

            await registro.destroy();

            res.json({
                success: true,
                message: 'Registro eliminado'
            });
        } catch (error) {
            console.error('❌ Error:', error);
            res.status(500).json({ success: false, error: 'Error al eliminar registro' });
        }
    }
};

module.exports = estudianteController;