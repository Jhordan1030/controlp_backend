// ==================== src/controllers/estudianteController.js ====================
const { Estudiante, RegistroHora, Universidad, Periodo, Matriculacion } = require('../models');

const estudianteController = {
    // PERFIL (versión sin includes)
    perfil: async (req, res) => {
        try {
            const estudiante = await Estudiante.findByPk(req.user.id, {
                include: [{
                    model: Universidad,
                    as: 'universidad',
                    attributes: ['id', 'nombre']
                }]
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
                    universidad_id: estudiante.universidad_id,
                    universidad: estudiante.universidad ? estudiante.universidad.nombre : null,
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

    // DASHBOARD
    dashboard: async (req, res) => {
        try {
            // Incluir Universidad y Periodo en la consulta
            const estudiante = await Estudiante.findByPk(req.user.id, {
                include: [
                    {
                        model: Universidad,
                        as: 'universidad',
                        attributes: ['id', 'nombre']
                    },
                    {
                        model: Periodo,
                        as: 'periodo',
                        attributes: ['id', 'nombre', 'horas_totales_requeridas', 'fecha_inicio', 'fecha_fin', 'activo']
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

            // Obtener datos del periodo
            const horasRequeridas = estudiante.periodo ? estudiante.periodo.horas_totales_requeridas : 0;
            const periodoNombre = estudiante.periodo ? estudiante.periodo.nombre : 'Sin asignar';
            const universidadNombre = estudiante.universidad ? estudiante.universidad.nombre : 'Sin asignar';

            res.json({
                success: true,
                message: 'Dashboard de estudiante',
                estudiante: {
                    nombres: estudiante.nombres,
                    apellidos: estudiante.apellidos,
                    email: estudiante.email,
                    universidad: universidadNombre,
                    periodo: periodoNombre,
                    periodo_info: estudiante.periodo // Info extra útil
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

            // Verificar matrícula activa
            const matricula = await Matriculacion.findOne({
                where: {
                    estudiante_id: req.user.id,
                    activa: true
                }
            });

            if (!matricula) {
                return res.status(400).json({
                    success: false,
                    error: 'No tienes una matrícula activa para registrar horas.'
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
                descripcion: descripcion.trim(),
                matriculacion_id: matricula.id
            });

            console.log(`✅ Horas registradas: ${horasNum}h - ${descripcion.substring(0, 20)}... (${req.user.email})`);

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
    },
    // NUEVO: OBTENER HISTORIAL DE PERIODOS (vía Matriculaciones)
    misPeriodos: async (req, res) => {
        try {
            const matriculas = await Matriculacion.findAll({
                where: { estudiante_id: req.user.id },
                include: [{
                    model: Periodo,
                    as: 'periodo',
                    attributes: ['id', 'nombre', 'fecha_inicio', 'fecha_fin', 'activo', 'horas_totales_requeridas']
                }],
                order: [['created_at', 'DESC']]
            });

            // Procesar cada matrícula para obtener sus horas acumuladas
            const periodos = await Promise.all(matriculas.map(async (m) => {
                if (!m.periodo) return null;

                // Calcular horas acumuladas para esta matrícula específica
                // NOTA: Usamos sum() directo a la DB para mejor rendimiento
                const horasAcumuladas = await RegistroHora.sum('horas', {
                    where: { matriculacion_id: m.id }
                });

                return {
                    id: m.periodo.id,
                    nombre: m.periodo.nombre,
                    fecha_inicio: m.periodo.fecha_inicio,
                    fecha_fin: m.periodo.fecha_fin,
                    horas_totales_requeridas: m.periodo.horas_totales_requeridas,
                    horas_acumuladas: horasAcumuladas || 0, // Si es null (sin registros), retornar 0
                    activo: m.periodo.activo,
                    matricula: {
                        id: m.id,
                        fecha: m.fecha_matricula,
                        activa: m.activa
                    }
                };
            }));

            // Filtrar nulos y ordenar (aunque Promise.all mantiene orden, aseguramos con el orden original del query)
            const periodosFiltrados = periodos.filter(p => p !== null);

            res.json({
                success: true,
                periodos
            });
        } catch (error) {
            console.error('❌ Error en misPeriodos:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener historial de periodos'
            });
        }
    },

    // NUEVO: OBTENER TODOS LOS REGISTROS DE UN PERIODO (PARA REPORTE PDF)
    verRegistrosPorPeriodo: async (req, res) => {
        try {
            const { periodoId } = req.params;

            // 1. Buscar la matrícula del estudiante en ese periodo
            const matricula = await Matriculacion.findOne({
                where: {
                    estudiante_id: req.user.id,
                    periodo_id: periodoId
                }
            });

            if (!matricula) {
                return res.status(404).json({
                    success: false,
                    error: 'No se encontró matrícula para este periodo'
                });
            }

            // 2. Buscar todos los registros de esa matrícula (sin paginación)
            const registros = await RegistroHora.findAll({
                where: { matriculacion_id: matricula.id },
                order: [['fecha', 'ASC']] // Orden cronológico para reportes
            });

            const totalHoras = registros.reduce((sum, reg) =>
                sum + parseFloat(reg.horas), 0
            );

            res.json({
                success: true,
                matricula_id: matricula.id,
                periodo_id: periodoId,
                totalRegistros: registros.length,
                totalHoras: totalHoras.toFixed(2),
                registros
            });

        } catch (error) {
            console.error('❌ Error en verRegistrosPorPeriodo:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener registros del periodo'
            });
        }
    }
};

module.exports = estudianteController;