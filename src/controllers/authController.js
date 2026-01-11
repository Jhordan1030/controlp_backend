const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const Estudiante = require('../models/Estudiante');
const Administrador = require('../models/Administrador');
const auditController = require('./auditController');

const authController = {
    // LOGIN para admin o estudiante
    login: async (req, res) => {
        try {
            // Validar errores de express-validator
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;

            // Log seguro (sin email)
            console.log(`🔐 Intento de login`);

            console.log(`🔐 Login intentado: ${email}`);

            // Buscar en administradores
            console.log(`🔍 Buscando administrador con email: ${email}`);
            let usuario = await Administrador.findOne({ where: { email } });
            let tipo = 'administrador';
            console.log(`👤 Admin encontrado: ${usuario ? 'SÍ' : 'NO'}`);

            // Si no es administrador, buscar en estudiantes
            if (!usuario) {
                console.log(`🔍 Buscando estudiante con email: ${email}`);
                usuario = await Estudiante.findOne({ where: { email } });
                tipo = 'estudiante';
                console.log(`👤 Estudiante encontrado: ${usuario ? 'SÍ' : 'NO'}`);
            }

            if (!usuario) {
                console.log('❌ Usuario no encontrado en ninguna tabla');
                // Auditoria fallo login
                await auditController.logAction(req, 'LOGIN_FAILED', 'auth', null, { email, reason: 'User not found' });

                return res.status(401).json({
                    success: false,
                    error: 'Credenciales inválidas (Usuario)'
                });
            }

            // Verificar contraseña
            console.log('🔑 Verificando contraseña...');
            const passwordValida = await bcrypt.compare(password, usuario.password_hash);
            console.log(`🔐 Contraseña válida: ${passwordValida ? 'SÍ' : 'NO'}`);

            if (!passwordValida) {
                console.log('❌ Contraseña incorrecta');
                // Auditoria fallo login
                await auditController.logAction(req, 'LOGIN_FAILED', 'auth', usuario.id, { email, reason: 'Password mismatch' });

                return res.status(401).json({
                    success: false,
                    error: 'Credenciales inválidas (Password)'
                });
            }

            // Generar token
            const token = jwt.sign(
                {
                    id: usuario.id,
                    email: usuario.email,
                    tipo: tipo,
                    nombres: usuario.nombres
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            console.log(`✅ Login exitoso: ${email} (${tipo})`);

            // Simular usuario en req para auditoria ya que aún no hay middleware
            req.user = { id: usuario.id, tipo };
            await auditController.logAction(req, 'LOGIN_SUCCESS', 'auth', usuario.id, { email, tipo });

            res.json({
                success: true,
                message: 'Login exitoso',
                token: token,
                usuario: {
                    id: usuario.id,
                    nombres: usuario.nombres,
                    email: usuario.email,
                    tipo: tipo,
                    ...(tipo === 'estudiante' && { apellidos: usuario.apellidos })
                }
            });

        } catch (error) {
            console.error('❌ Error en login:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // REGISTRAR PRIMER ADMINISTRADOR
    registroPrimerAdmin: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { nombres, email, password } = req.body;

            // Verificar si ya existe algún administrador
            const existeAdmin = await Administrador.findOne();

            if (existeAdmin) {
                return res.status(403).json({
                    success: false,
                    error: 'Ya existe un administrador. Usa el endpoint de login.'
                });
            }

            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            const admin = await Administrador.create({
                nombres,
                email,
                password_hash: passwordHash,
                super_admin: true,
                activo: true
            });

            const token = jwt.sign(
                {
                    id: admin.id,
                    email: admin.email,
                    tipo: 'administrador',
                    nombres: admin.nombres
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            console.log(`✅ PRIMER ADMINISTRADOR CREADO: ${email}`);

            req.user = { id: admin.id, tipo: 'administrador' };
            await auditController.logAction(req, 'CREATE_FIRST_ADMIN', 'administradores', admin.id, { email });

            res.status(201).json({
                success: true,
                message: '¡Primer administrador creado exitosamente!',
                token: token,
                admin: {
                    id: admin.id,
                    nombres: admin.nombres,
                    email: admin.email,
                    super_admin: admin.super_admin
                }
            });

        } catch (error) {
            console.error('❌ Error creando primer administrador:', error);
            res.status(500).json({
                success: false,
                error: 'Error al crear administrador'
            });
        }
    },

    // REGISTRAR ESTUDIANTE
    registroEstudiante: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { nombres, apellidos, email, password } = req.body;

            const existeEstudiante = await Estudiante.findOne({ where: { email } });
            const existeAdmin = await Administrador.findOne({ where: { email } });

            if (existeEstudiante || existeAdmin) {
                // Mensaje genérico para evitar enumeración (opcionalmente se enviaría email)
                // Para este caso práctico, mantendremos el error pero con menos detalle
                return res.status(400).json({
                    success: false,
                    error: 'No se pudo completar el registro con estos datos.'
                });
            }

            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            const estudiante = await Estudiante.create({
                nombres,
                apellidos,
                email,
                password_hash: passwordHash,
                universidad_id: null,
                periodo_id: null,
                activo: true
            });

            const token = jwt.sign(
                {
                    id: estudiante.id,
                    email: estudiante.email,
                    tipo: 'estudiante',
                    nombres: estudiante.nombres
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            console.log(`✅ Estudiante registrado: ${email}`);

            req.user = { id: estudiante.id, tipo: 'estudiante' };
            await auditController.logAction(req, 'REGISTER_STUDENT', 'estudiantes', estudiante.id, { email });

            res.status(201).json({
                success: true,
                message: 'Estudiante registrado exitosamente',
                token: token,
                estudiante: {
                    id: estudiante.id,
                    nombres: estudiante.nombres,
                    apellidos: estudiante.apellidos,
                    email: estudiante.email
                }
            });

        } catch (error) {
            console.error('❌ Error en registro:', error);
            res.status(500).json({
                success: false,
                error: 'Error al registrar estudiante'
            });
        }
    },

    // CREAR ADMIN (solo por administradores)
    crearAdmin: async (req, res) => {
        try {
            const { nombres, email, password, super_admin = false } = req.body;

            if (!nombres || !email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Todos los campos son requeridos'
                });
            }

            const existeAdmin = await Administrador.findOne({ where: { email } });
            const existeEstudiante = await Estudiante.findOne({ where: { email } });

            if (existeAdmin || existeEstudiante) {
                return res.status(400).json({
                    success: false,
                    error: 'El email ya está registrado'
                });
            }

            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            const admin = await Administrador.create({
                nombres,
                email,
                password_hash: passwordHash,
                super_admin: super_admin,
                activo: true
            });

            console.log(`✅ Nuevo administrador creado: ${email}`);

            await auditController.logAction(req, 'CREATE_ADMIN', 'administradores', admin.id, { email, super_admin });

            res.status(201).json({
                success: true,
                message: 'Administrador creado exitosamente',
                admin: {
                    id: admin.id,
                    nombres: admin.nombres,
                    email: admin.email,
                    super_admin: admin.super_admin
                }
            });

        } catch (error) {
            console.error('❌ Error creando administrador:', error);
            res.status(500).json({
                success: false,
                error: 'Error al crear administrador'
            });
        }
    },

    // LOGOUT
    // LOGOUT (Stateless)
    logout: async (req, res) => {
        try {
            // En JWT stateless, el servidor no necesita hacer nada más que confirmar.
            // Es responsabilidad del cliente eliminar el token.
            console.log('🚪 Logout solicitado (Stateless)');

            res.json({
                success: true,
                message: 'Sesión cerrada exitosamente (Elimine el token de su cliente)'
            });
            await auditController.logAction(req, 'LOGOUT', 'auth', null, null);

        } catch (error) {
            console.error('❌ Error en logout:', error);
            res.status(500).json({
                success: false,
                error: 'Error al cerrar sesión'
            });
        }
    }
};

module.exports = authController;