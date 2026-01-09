// ==================== src/controllers/estudianteController.js ====================
const Estudiante = require('../models/Estudiante');
const RegistroHora = require('../models/RegistroHora');
const Universidad = require('../models/Universidad');
const Periodo = require('../models/Periodo');

const estudianteController = {
    // PERFIL (versión sin includes)
    perfil: async (req, res) => {
        try {
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
            console.error('❌ Error en perfil:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Error al obtener perfil' 
            });
        }
    },

    // DASHBOARD (versión sin includes)
    dashboard: async (req, res) => {
        try {
            const estudiante = await Estudiante.findByPk(req.user.id);
            
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

            // Obtener periodo si existe
            let horasRequeridas = 0;
            if (estudiante.periodo_id) {
                const periodo = await Periodo.findByPk(estudiante.periodo_id);
                horasRequeridas = periodo ? periodo.horas_totales_requeridas : 0;
            }

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
                    porcentaje: horasRequeridas > 0 ? 
                        ((totalHoras / horasRequeridas) * 100).toFixed(2) : 0,
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
    },

    // REGISTRAR HORAS (esta funciona bien)
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

            // Validar descripción
            if (descripcion.trim().length < 5) {
                return res.status(400).json({
                    success: false,
                    error: 'La descripción debe tener al menos 5 caracteres'
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
                descripcion: descripcion.trim()
            });

            res.status(201).json({
                success: true,
                message: 'Horas registradas exitosamente',
                registro
            });
        } catch (error) {
            console.error('❌ Error en registrarHoras:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Error al registrar horas' 
            });
        }
    },

    // VER REGISTROS (esta funciona bien)
    verRegistros: async (req, res) => {
        try {
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const { count, rows: registros } = await RegistroHora.findAndCountAll({
                where: { estudiante_id: req.user.id },
                order: [['fecha', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            const totalHoras = registros.reduce((sum, reg) =>
                sum + parseFloat(reg.horas), 0
            );

            res.json({
                success: true,
                count,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                totalHoras: totalHoras.toFixed(2),
                registros
            });
        } catch (error) {
            console.error('❌ Error en verRegistros:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Error al obtener registros' 
            });
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

            // Validaciones
            if (horas !== undefined) {
                const horasNum = parseFloat(horas);
                if (horasNum < 0.5 || horasNum > 24) {
                    return res.status(400).json({
                        success: false,
                        error: 'Las horas deben estar entre 0.5 y 24'
                    });
                }
            }

            if (descripcion && descripcion.trim().length < 5) {
                return res.status(400).json({
                    success: false,
                    error: 'La descripción debe tener al menos 5 caracteres'
                });
            }

            await registro.update({
                horas: horas !== undefined ? parseFloat(horas) : registro.horas,
                descripcion: descripcion ? descripcion.trim() : registro.descripcion
            });

            res.json({
                success: true,
                message: 'Registro actualizado exitosamente',
                registro
            });
        } catch (error) {
            console.error('❌ Error en actualizarRegistro:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Error al actualizar registro' 
            });
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
                message: 'Registro eliminado exitosamente'
            });
        } catch (error) {
            console.error('❌ Error en eliminarRegistro:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Error al eliminar registro' 
            });
        }
    },

    // OBTENER ESTADÍSTICAS PERSONALES
    misEstadisticas: async (req, res) => {
        try {
            const registros = await RegistroHora.findAll({
                where: { estudiante_id: req.user.id },
                order: [['fecha', 'ASC']]
            });

            const totalHoras = registros.reduce((sum, reg) =>
                sum + parseFloat(reg.horas), 0
            );

            const estadisticasPorMes = {};
            registros.forEach(registro => {
                const mes = registro.fecha.substring(0, 7); // YYYY-MM
                if (!estadisticasPorMes[mes]) {
                    estadisticasPorMes[mes] = {
                        horas: 0,
                        registros: 0
                    };
                }
                estadisticasPorMes[mes].horas += parseFloat(registro.horas);
                estadisticasPorMes[mes].registros++;
            });

            res.json({
                success: true,
                estadisticas: {
                    totalRegistros: registros.length,
                    totalHoras: totalHoras.toFixed(2),
                    promedioPorDia: registros.length > 0 ? 
                        (totalHoras / registros.length).toFixed(2) : 0,
                    porMes: estadisticasPorMes,
                    ultimosMeses: Object.keys(estadisticasPorMes)
                        .sort()
                        .reverse()
                        .slice(0, 6)
                        .map(mes => ({
                            mes,
                            ...estadisticasPorMes[mes]
                        }))
                }
            });
        } catch (error) {
            console.error('❌ Error en misEstadisticas:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Error al obtener estadísticas' 
            });
        }
    }
};

module.exports = estudianteController;