// ==================== src/controllers/authController.js ====================
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Estudiante = require('../models/Estudiante');
const Administrador = require('../models/Administrador');

const authController = {
    // LOGIN para admin o estudiante
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email y contraseña son requeridos'
                });
            }

            console.log(`🔐 Login intentado: ${email}`);

            // Buscar en administradores
            let usuario = await Administrador.findOne({ where: { email } });
            let tipo = 'administrador';

            // Si no es administrador, buscar en estudiantes
            if (!usuario) {
                usuario = await Estudiante.findOne({ where: { email } });
                tipo = 'estudiante';
            }

            if (!usuario) {
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales incorrectas'
                });
            }

            // Verificar contraseña
            const passwordValida = await bcrypt.compare(password, usuario.password_hash);

            if (!passwordValida) {
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales incorrectas'
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
            const { nombres, email, password } = req.body;

            if (!nombres || !email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Todos los campos son requeridos'
                });
            }

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
            const { nombres, apellidos, email, password } = req.body;

            if (!nombres || !apellidos || !email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Todos los campos son requeridos'
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
    }
};

module.exports = authController;