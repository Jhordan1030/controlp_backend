const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { Universidad, Estudiante, Periodo, Administrador, RegistroHora, Matriculacion } = require('../models');

const adminController = {
    // DASHBOARD
    dashboard: async (req, res) => {
        try {
            console.log('📊 Cargando dashboard de administrador...');
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

    // ========== CRUD UNIVERSIDADES ==========

    // LISTAR UNIVERSIDADES
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
            console.error('❌ Error en listarUniversidades:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener universidades'
            });
        }
    },

    // OBTENER UNA UNIVERSIDAD
    obtenerUniversidad: async (req, res) => {
        try {
            const { id } = req.params;

            const universidad = await Universidad.findByPk(id);

            if (!universidad) {
                return res.status(404).json({
                    success: false,
                    error: 'Universidad no encontrada'
                });
            }

            res.json({
                success: true,
                universidad
            });
        } catch (error) {
            console.error('❌ Error en obtenerUniversidad:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener universidad'
            });
        }
    },

    // CREAR UNIVERSIDAD
    crearUniversidad: async (req, res) => {
        try {
            const { nombre } = req.body;

            if (!nombre || nombre.trim() === '') {
                return res.status(400).json({
                    success: false,
                    error: 'El nombre de la universidad es requerido'
                });
            }

            const existe = await Universidad.findOne({
                where: {
                    nombre: nombre.trim()
                }
            });

            if (existe) {
                return res.status(400).json({
                    success: false,
                    error: 'Ya existe una universidad con ese nombre'
                });
            }

            const universidad = await Universidad.create({
                nombre: nombre.trim(),
                activa: true
            });

            console.log(`✅ Universidad creada: ${universidad.nombre}`);

            res.status(201).json({
                success: true,
                message: 'Universidad creada exitosamente',
                universidad
            });
        } catch (error) {
            console.error('❌ Error en crearUniversidad:', error);
            res.status(500).json({
                success: false,
                error: 'Error al crear universidad'
            });
        }
    },

    // ACTUALIZAR UNIVERSIDAD
    actualizarUniversidad: async (req, res) => {
        try {
            const { id } = req.params;
            const { nombre, activa } = req.body;

            const universidad = await Universidad.findByPk(id);

            if (!universidad) {
                return res.status(404).json({
                    success: false,
                    error: 'Universidad no encontrada'
                });
            }

            // Si se cambia el nombre, verificar que no exista ya
            if (nombre && nombre.trim() !== universidad.nombre) {
                const existe = await Universidad.findOne({
                    where: {
                        nombre: nombre.trim(),
                        id: { [Op.ne]: id } // Excluir la universidad actual
                    }
                });

                if (existe) {
                    return res.status(400).json({
                        success: false,
                        error: 'Ya existe otra universidad con ese nombre'
                    });
                }
            }

            await universidad.update({
                nombre: nombre ? nombre.trim() : universidad.nombre,
                activa: activa !== undefined ? activa : universidad.activa
            });

            console.log(`✅ Universidad actualizada: ${universidad.nombre}`);

            res.json({
                success: true,
                message: 'Universidad actualizada exitosamente',
                universidad
            });
        } catch (error) {
            console.error('❌ Error en actualizarUniversidad:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar universidad'
            });
        }
    },

    // DESACTIVAR/ACTIVAR UNIVERSIDAD
    toggleUniversidad: async (req, res) => {
        try {
            const { id } = req.params;

            const universidad = await Universidad.findByPk(id);

            if (!universidad) {
                return res.status(404).json({
                    success: false,
                    error: 'Universidad no encontrada'
                });
            }

            const nuevoEstado = !universidad.activa;

            await universidad.update({
                activa: nuevoEstado
            });

            console.log(`🔄 Universidad ${nuevoEstado ? 'activada' : 'desactivada'}: ${universidad.nombre}`);

            res.json({
                success: true,
                message: nuevoEstado ?
                    'Universidad activada exitosamente' :
                    'Universidad desactivada exitosamente',
                universidad: {
                    id: universidad.id,
                    nombre: universidad.nombre,
                    activa: nuevoEstado
                }
            });
        } catch (error) {
            console.error('❌ Error en toggleUniversidad:', error);
            res.status(500).json({
                success: false,
                error: 'Error al cambiar estado de la universidad'
            });
        }
    },

    // ELIMINAR UNIVERSIDAD (Solo si no tiene periodos ni estudiantes)
    eliminarUniversidad: async (req, res) => {
        try {
            const { id } = req.params;

            const universidad = await Universidad.findByPk(id);

            if (!universidad) {
                return res.status(404).json({
                    success: false,
                    error: 'Universidad no encontrada'
                });
            }

            // Verificar si tiene periodos asociados
            const periodosCount = await Periodo.count({
                where: { universidad_id: id }
            });

            if (periodosCount > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No se puede eliminar la universidad porque tiene periodos asociados'
                });
            }

            // Verificar si tiene estudiantes asociados
            const estudiantesCount = await Estudiante.count({
                where: { universidad_id: id }
            });

            if (estudiantesCount > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No se puede eliminar la universidad porque tiene estudiantes asociados'
                });
            }

            await universidad.destroy();

            console.log(`🗑️ Universidad eliminada ID: ${id}`);

            res.json({
                success: true,
                message: 'Universidad eliminada exitosamente'
            });
        } catch (error) {
            console.error('❌ Error en eliminarUniversidad:', error);
            res.status(500).json({
                success: false,
                error: 'Error al eliminar universidad'
            });
        }
    },

    // ========== CRUD PERIODOS ==========

    // LISTAR PERIODOS (versión sin includes temporalmente)
    listarPeriodos: async (req, res) => {
        try {
            const periodos = await Periodo.findAll({
                order: [['fecha_inicio', 'DESC']]
            });

            res.json({
                success: true,
                count: periodos.length,
                periodos
            });
        } catch (error) {
            console.error('❌ Error en listarPeriodos:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener periodos'
            });
        }
    },

    // OBTENER UN PERIODO
    obtenerPeriodo: async (req, res) => {
        try {
            const { id } = req.params;

            const periodo = await Periodo.findByPk(id);

            if (!periodo) {
                return res.status(404).json({
                    success: false,
                    error: 'Periodo no encontrado'
                });
            }

            res.json({
                success: true,
                periodo
            });
        } catch (error) {
            console.error('❌ Error en obtenerPeriodo:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener periodo'
            });
        }
    },

    // CREAR PERIODO
    crearPeriodo: async (req, res) => {
        try {
            const { universidad_id, nombre, fecha_inicio, fecha_fin, horas_totales_requeridas } = req.body;

            // Validaciones
            if (!universidad_id || !nombre || !fecha_inicio || !fecha_fin || !horas_totales_requeridas) {
                return res.status(400).json({
                    success: false,
                    error: 'Todos los campos son requeridos'
                });
            }

            if (new Date(fecha_inicio) >= new Date(fecha_fin)) {
                return res.status(400).json({
                    success: false,
                    error: 'La fecha de inicio debe ser anterior a la fecha de fin'
                });
            }

            if (horas_totales_requeridas < 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Las horas totales requeridas deben ser al menos 1'
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
                nombre: nombre.trim(),
                fecha_inicio,
                fecha_fin,
                horas_totales_requeridas,
                activo: true
            });

            console.log(`✅ Periodo creado: ${periodo.nombre}`);

            res.status(201).json({
                success: true,
                message: 'Periodo creado exitosamente',
                periodo
            });
        } catch (error) {
            console.error('❌ Error en crearPeriodo:', error);
            res.status(500).json({
                success: false,
                error: 'Error al crear periodo'
            });
        }
    },

    // ACTUALIZAR PERIODO
    actualizarPeriodo: async (req, res) => {
        try {
            const { id } = req.params;
            const { nombre, fecha_inicio, fecha_fin, horas_totales_requeridas, activo } = req.body;

            const periodo = await Periodo.findByPk(id);

            if (!periodo) {
                return res.status(404).json({
                    success: false,
                    error: 'Periodo no encontrado'
                });
            }

            // Validar fechas si se actualizan
            if (fecha_inicio && fecha_fin) {
                if (new Date(fecha_inicio) >= new Date(fecha_fin)) {
                    return res.status(400).json({
                        success: false,
                        error: 'La fecha de inicio debe ser anterior a la fecha de fin'
                    });
                }
            }

            await periodo.update({
                nombre: nombre ? nombre.trim() : periodo.nombre,
                fecha_inicio: fecha_inicio || periodo.fecha_inicio,
                fecha_fin: fecha_fin || periodo.fecha_fin,
                horas_totales_requeridas: horas_totales_requeridas || periodo.horas_totales_requeridas,
                activo: activo !== undefined ? activo : periodo.activo
            });

            console.log(`✅ Periodo actualizado: ${periodo.nombre}`);

            res.json({
                success: true,
                message: 'Periodo actualizado exitosamente',
                periodo
            });
        } catch (error) {
            console.error('❌ Error en actualizarPeriodo:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar periodo'
            });
        }
    },

    // DESACTIVAR/ACTIVAR PERIODO
    togglePeriodo: async (req, res) => {
        try {
            const { id } = req.params;

            const periodo = await Periodo.findByPk(id);

            if (!periodo) {
                return res.status(404).json({
                    success: false,
                    error: 'Periodo no encontrado'
                });
            }

            const nuevoEstado = !periodo.activo;

            await periodo.update({
                activo: nuevoEstado
            });

            console.log(`🔄 Periodo ${nuevoEstado ? 'activado' : 'desactivado'}: ${periodo.nombre}`);

            res.json({
                success: true,
                message: nuevoEstado ?
                    'Periodo activado exitosamente' :
                    'Periodo desactivado exitosamente',
                periodo: {
                    id: periodo.id,
                    nombre: periodo.nombre,
                    activo: nuevoEstado
                }
            });
        } catch (error) {
            console.error('❌ Error en togglePeriodo:', error);
            res.status(500).json({
                success: false,
                error: 'Error al cambiar estado del periodo'
            });
        }
    },

    // ELIMINAR PERIODO (Solo si no tiene estudiantes)
    eliminarPeriodo: async (req, res) => {
        try {
            const { id } = req.params;

            const periodo = await Periodo.findByPk(id);

            if (!periodo) {
                return res.status(404).json({
                    success: false,
                    error: 'Periodo no encontrado'
                });
            }

            // Verificar si tiene estudiantes asociados
            const estudiantesCount = await Estudiante.count({
                where: { periodo_id: id }
            });

            if (estudiantesCount > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No se puede eliminar el periodo porque tiene estudiantes asociados'
                });
            }

            await periodo.destroy();
            console.log(`🗑️ Periodo eliminado ID: ${id}`);

            res.json({
                success: true,
                message: 'Periodo eliminado exitosamente'
            });
        } catch (error) {
            console.error('❌ Error en eliminarPeriodo:', error);
            res.status(500).json({
                success: false,
                error: 'Error al eliminar periodo'
            });
        }
    },

    // ========== CRUD ESTUDIANTES ==========

    // LISTAR ESTUDIANTES (Con paginación)
    listarEstudiantes: async (req, res) => {
        try {
            const { page = 1, limit = 20, busqueda = '' } = req.query;
            const offset = (page - 1) * limit;

            const whereClause = {};
            if (busqueda) {
                whereClause[Op.or] = [
                    { nombres: { [Op.iLike]: `%${busqueda}%` } },
                    { apellidos: { [Op.iLike]: `%${busqueda}%` } },
                    { email: { [Op.iLike]: `%${busqueda}%` } }
                ];
            }

            const { count, rows: estudiantes } = await Estudiante.findAndCountAll({
                where: whereClause,
                attributes: { exclude: ['password_hash'] }, // Seguridad y menos datos
                order: [['apellidos', 'ASC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                success: true,
                count,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                estudiantes
            });
        } catch (error) {
            console.error('❌ Error en listarEstudiantes:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener estudiantes'
            });
        }
    },

    // OBTENER UN ESTUDIANTE (versión sin includes temporalmente)
    obtenerEstudiante: async (req, res) => {
        try {
            const { id } = req.params;

            const estudiante = await Estudiante.findByPk(id);

            if (!estudiante) {
                return res.status(404).json({
                    success: false,
                    error: 'Estudiante no encontrado'
                });
            }

            // OPTIMIZACIÓN: Usar suma agregada en lugar de reduce en memoria
            const totalHoras = await RegistroHora.sum('horas', {
                where: { estudiante_id: id }
            }) || 0;

            // OBTENER REGISTROS CON DETALLE DE MATRÍCULA Y PERIODO
            const registrosRaw = await RegistroHora.findAll({
                where: { estudiante_id: id },
                include: [{
                    model: Matriculacion,
                    as: 'matriculacion',
                    attributes: ['id', 'periodo_id'],
                    include: [{
                        model: Periodo,
                        as: 'periodo',
                        attributes: ['id', 'nombre']
                    }]
                }],
                order: [['fecha', 'DESC']],
                limit: 50
            });

            // Mapear para estructura plana y garantizada
            const registros = registrosRaw.map(r => {
                const reg = r.toJSON();
                return {
                    ...reg,
                    estudiante_id: reg.estudiante_id, // Garantizado por columna
                    periodo_id: reg.matriculacion?.periodo_id, // Explícitamente extraído
                    periodo_nombre: reg.matriculacion?.periodo?.nombre, // Extra útil
                    matriculacion: undefined // Limpiar anidación si se desea, o dejarla
                };
            });

            res.json({
                success: true,
                estudiante: {
                    ...estudiante.toJSON(),
                    totalHoras,
                    registros
                }
            });
        } catch (error) {
            console.error('❌ Error en obtenerEstudiante:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener estudiante'
            });
        }
    },

    // CREAR ESTUDIANTE
    crearEstudiante: async (req, res) => {
        try {
            const { nombres, apellidos, email, password, universidad_id, periodo_id } = req.body;

            if (!nombres || !apellidos || !email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Nombres, apellidos, email y contraseña son requeridos'
                });
            }

            // Validar email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    error: 'El formato del email no es válido'
                });
            }

            // Validar contraseña
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            // Verificar si el email ya existe
            const existeEstudiante = await Estudiante.findOne({ where: { email } });
            const existeAdmin = await Administrador.findOne({ where: { email } });

            if (existeEstudiante || existeAdmin) {
                return res.status(400).json({
                    success: false,
                    error: 'El email ya está registrado'
                });
            }

            // Verificar universidad y periodo si se proporcionan
            let universidad = null;
            let periodo = null;

            if (universidad_id) {
                universidad = await Universidad.findByPk(universidad_id);
                if (!universidad) {
                    return res.status(404).json({
                        success: false,
                        error: 'Universidad no encontrada'
                    });
                }
            }

            if (periodo_id) {
                periodo = await Periodo.findByPk(periodo_id);
                if (!periodo) {
                    return res.status(404).json({
                        success: false,
                        error: 'Periodo no encontrado'
                    });
                }

                // Verificar que el periodo pertenezca a la universidad
                if (universidad_id && periodo.universidad_id !== universidad_id) {
                    return res.status(400).json({
                        success: false,
                        error: 'El periodo no pertenece a la universidad seleccionada'
                    });
                }
            }

            const passwordHash = await bcrypt.hash(password, 12);

            const estudiante = await Estudiante.create({
                nombres: nombres.trim(),
                apellidos: apellidos.trim(),
                email: email.trim(),
                password_hash: passwordHash,
                universidad_id: universidad_id || null,
                periodo_id: periodo_id || null,
                activo: true
            });

            console.log(`✅ Estudiante creado: ${estudiante.email}`);

            // === LÓGICA DE MATRICULACIÓN AUTOMÁTICA ===
            // Si tiene periodo asignado, le creamos una matrícula activa
            if (periodo_id) {
                try {
                    await Matriculacion.create({
                        estudiante_id: estudiante.id,
                        periodo_id: periodo_id,
                        fecha_matricula: new Date(),
                        activa: true,
                        horas_acumuladas: 0,
                        horas_aprobadas: 0,
                        porcentaje_completado: 0
                    });
                    console.log(`✅ Matrícula automática creada para: ${estudiante.email} en periodo ${periodo_id}`);
                } catch (matriculaError) {
                    console.error('⚠️ Error al crear matrícula automática:', matriculaError);
                    // No fallamos el request entero, pero logueamos el error
                }
            }

            res.status(201).json({
                success: true,
                message: 'Estudiante creado exitosamente',
                estudiante
            });
        } catch (error) {
            console.error('❌ Error en crearEstudiante:', error);
            res.status(500).json({
                success: false,
                error: 'Error al crear estudiante'
            });
        }
    },

    // ACTUALIZAR ESTUDIANTE
    actualizarEstudiante: async (req, res) => {
        try {
            const { id } = req.params;
            const { nombres, apellidos, email, universidad_id, periodo_id, activo } = req.body;

            const estudiante = await Estudiante.findByPk(id);

            if (!estudiante) {
                return res.status(404).json({
                    success: false,
                    error: 'Estudiante no encontrado'
                });
            }

            // Si se cambia el email, verificar que no exista ya
            if (email && email.trim() !== estudiante.email) {
                const existeEstudiante = await Estudiante.findOne({
                    where: {
                        email: email.trim(),
                        id: { [Op.ne]: id }
                    }
                });

                const existeAdmin = await Administrador.findOne({
                    where: {
                        email: email.trim()
                    }
                });

                if (existeEstudiante || existeAdmin) {
                    return res.status(400).json({
                        success: false,
                        error: 'El email ya está registrado por otro usuario'
                    });
                }
            }

            // Verificar universidad y periodo si se actualizan
            if (universidad_id) {
                const universidad = await Universidad.findByPk(universidad_id);
                if (!universidad) {
                    return res.status(404).json({
                        success: false,
                        error: 'Universidad no encontrada'
                    });
                }
            }

            // Lógica de cambio de periodo y rematriculación
            if (periodo_id) {
                const periodo = await Periodo.findByPk(periodo_id);
                if (!periodo) {
                    return res.status(404).json({
                        success: false,
                        error: 'Periodo no encontrado'
                    });
                }

                // Si se está cambiando de periodo (o asignando uno nuevo)
                if (periodo_id !== estudiante.periodo_id) {
                    // 1. Desactivar matrículas anteriores (opcional, pero recomendado para mantener limpieza)
                    await Matriculacion.update(
                        { activa: false },
                        { where: { estudiante_id: id, activa: true } }
                    );

                    // 2. Verificar si ya existe una matrícula para este nuevo periodo (aunque sea inactiva)
                    let matriculaNueva = await Matriculacion.findOne({
                        where: {
                            estudiante_id: id,
                            periodo_id: periodo_id
                        }
                    });

                    if (matriculaNueva) {
                        // Si ya existe, reactivarla
                        await matriculaNueva.update({ activa: true });
                        console.log(`🔄 Matrícula reactivada para: ${estudiante.email} en periodo ${periodo.nombre}`);
                    } else {
                        // Si no existe, crear nueva
                        try {
                            await Matriculacion.create({
                                estudiante_id: id,
                                periodo_id: periodo_id,
                                fecha_matricula: new Date(),
                                activa: true,
                                horas_acumuladas: 0,
                                horas_aprobadas: 0,
                                porcentaje_completado: 0
                            });
                            console.log(`✅ Nueva matrícula creada por cambio de periodo: ${estudiante.email} -> ${periodo.nombre}`);
                        } catch (err) {
                            console.error('⚠️ Error creando matrícula al actualizar estudiante:', err);
                        }
                    }
                }
            }

            await estudiante.update({
                nombres: nombres ? nombres.trim() : estudiante.nombres,
                apellidos: apellidos ? apellidos.trim() : estudiante.apellidos,
                email: email ? email.trim() : estudiante.email,
                universidad_id: universidad_id !== undefined ? universidad_id : estudiante.universidad_id,
                periodo_id: periodo_id !== undefined ? periodo_id : estudiante.periodo_id,
                activo: activo !== undefined ? activo : estudiante.activo
            });

            console.log(`✅ Estudiante actualizado: ${estudiante.email}`);

            res.json({
                success: true,
                message: 'Estudiante actualizado exitosamente',
                estudiante
            });
        } catch (error) {
            console.error('❌ Error en actualizarEstudiante:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar estudiante'
            });
        }
    },

    // DESACTIVAR/ACTIVAR ESTUDIANTE
    toggleEstudiante: async (req, res) => {
        try {
            const { id } = req.params;

            const estudiante = await Estudiante.findByPk(id);

            if (!estudiante) {
                return res.status(404).json({
                    success: false,
                    error: 'Estudiante no encontrado'
                });
            }

            const nuevoEstado = !estudiante.activo;

            await estudiante.update({
                activo: nuevoEstado
            });

            res.json({
                success: true,
                message: nuevoEstado ?
                    'Estudiante activado exitosamente' :
                    'Estudiante desactivado exitosamente',
                estudiante: {
                    id: estudiante.id,
                    nombres: estudiante.nombres,
                    apellidos: estudiante.apellidos,
                    email: estudiante.email,
                    activo: nuevoEstado
                }
            });
        } catch (error) {
            console.error('❌ Error en toggleEstudiante:', error);
            res.status(500).json({
                success: false,
                error: 'Error al cambiar estado del estudiante'
            });
        }
    },

    // REESTABLECER CONTRASEÑA DE ESTUDIANTE
    reestablecerPassword: async (req, res) => {
        try {
            const { id } = req.params;
            const { nueva_password } = req.body;

            if (!nueva_password || nueva_password.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'La nueva contraseña es requerida y debe tener al menos 6 caracteres'
                });
            }

            const estudiante = await Estudiante.findByPk(id);

            if (!estudiante) {
                return res.status(404).json({
                    success: false,
                    error: 'Estudiante no encontrado'
                });
            }

            const passwordHash = await bcrypt.hash(nueva_password, 12);

            await estudiante.update({
                password_hash: passwordHash
            });

            res.json({
                success: true,
                message: 'Contraseña reestablecida exitosamente'
            });
        } catch (error) {
            console.error('❌ Error en reestablecerPassword:', error);
            res.status(500).json({
                success: false,
                error: 'Error al reestablecer contraseña'
            });
        }
    },

    // ELIMINAR ESTUDIANTE (Solo si no tiene registros de horas)
    eliminarEstudiante: async (req, res) => {
        try {
            const { id } = req.params;

            const estudiante = await Estudiante.findByPk(id);

            if (!estudiante) {
                return res.status(404).json({
                    success: false,
                    error: 'Estudiante no encontrado'
                });
            }

            // Verificar si tiene registros de horas
            const registrosCount = await RegistroHora.count({
                where: { estudiante_id: id }
            });

            if (registrosCount > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No se puede eliminar el estudiante porque tiene registros de horas asociados'
                });
            }

            await estudiante.destroy();

            res.json({
                success: true,
                message: 'Estudiante eliminado exitosamente'
            });
        } catch (error) {
            console.error('❌ Error en eliminarEstudiante:', error);
            res.status(500).json({
                success: false,
                error: 'Error al eliminar estudiante'
            });
        }
    },

    // OBTENER ESTADÍSTICAS DE ESTUDIANTE
    estadisticasEstudiante: async (req, res) => {
        try {
            const { id } = req.params;

            const estudiante = await Estudiante.findByPk(id);

            if (!estudiante) {
                return res.status(404).json({
                    success: false,
                    error: 'Estudiante no encontrado'
                });
            }

            const registros = await RegistroHora.findAll({
                where: { estudiante_id: id }
            });

            const totalHoras = registros.reduce((sum, reg) =>
                sum + parseFloat(reg.horas), 0
            );

            const registrosPorMes = {};
            registros.forEach(registro => {
                const mes = registro.fecha.substring(0, 7); // YYYY-MM
                registrosPorMes[mes] = (registrosPorMes[mes] || 0) + parseFloat(registro.horas);
            });

            res.json({
                success: true,
                estadisticas: {
                    totalRegistros: registros.length,
                    totalHoras: totalHoras.toFixed(2),
                    horasPorMes: registrosPorMes,
                    ultimosRegistros: registros.slice(0, 10)
                }
            });
        } catch (error) {
            console.error('❌ Error en estadisticasEstudiante:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener estadísticas del estudiante'
            });
        }
    }
};

module.exports = adminController;