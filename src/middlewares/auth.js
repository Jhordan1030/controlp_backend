const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Token de autenticación requerido'
        });
    }

    const Estudiante = require('../models/Estudiante');
    const Administrador = require('../models/Administrador');

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'Token inválido o expirado'
            });
        }

        try {
            // 2. Verificar si el usuario sigue existiendo y está activo
            let usuarioDb = null;
            if (user.tipo === 'administrador') {
                usuarioDb = await Administrador.findByPk(user.id);
            } else {
                usuarioDb = await Estudiante.findByPk(user.id);
            }

            if (!usuarioDb || !usuarioDb.activo) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no encontrado o inactivo'
                });
            }

            req.user = user;
            req.token = token; // Guardamos el token para logout
            next();
        } catch (error) {
            console.error('Error en auth middleware:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno de autenticación'
            });
        }
    });
};

const isAdmin = (req, res, next) => {
    if (req.user.tipo !== 'administrador') {
        return res.status(403).json({
            success: false,
            error: 'Acceso denegado. Se requieren permisos de administrador'
        });
    }
    next();
};

const isEstudiante = (req, res, next) => {
    if (req.user.tipo !== 'estudiante') {
        return res.status(403).json({
            success: false,
            error: 'Acceso denegado. Se requieren permisos de estudiante'
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    isAdmin,
    isEstudiante
};