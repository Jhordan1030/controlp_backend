// ==================== src/middlewares/auth.js ====================
const jwt = require('jsonwebtoken');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token de autenticación requerido'
            });
        }

        // Verificar y decodificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Importar modelos desde el índice centralizado
        const { Administrador, Estudiante } = require('../models');

        // Verificar si el usuario sigue existiendo y está activo
        let usuarioDb = null;
        if (decoded.tipo === 'administrador') {
            usuarioDb = await Administrador.findByPk(decoded.id);
        } else if (decoded.tipo === 'estudiante') {
            usuarioDb = await Estudiante.findByPk(decoded.id);
        } else {
            return res.status(401).json({
                success: false,
                error: 'Tipo de usuario no válido'
            });
        }

        if (!usuarioDb) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        if (usuarioDb.activo === false) {
            return res.status(403).json({
                success: false,
                error: 'Tu cuenta está desactivada'
            });
        }

        // Agregar información del usuario a la request
        req.user = {
            id: usuarioDb.id,
            tipo: decoded.tipo,
            nombres: usuarioDb.nombres,
            email: usuarioDb.email
        };

        // Agregar información adicional según el tipo
        if (decoded.tipo === 'estudiante') {
            req.user.apellidos = usuarioDb.apellidos;
            req.user.universidad_id = usuarioDb.universidad_id;
            req.user.periodo_id = usuarioDb.periodo_id;
            req.user.activo = usuarioDb.activo;
        } else if (decoded.tipo === 'administrador') {
            req.user.super_admin = usuarioDb.super_admin;
            req.user.activo = usuarioDb.activo;
        }

        req.token = token; // Guardamos el token para posibles usos futuros
        next();

    } catch (error) {
        console.error('❌ Error en middleware authenticateToken:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                success: false,
                error: 'Token inválido'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({
                success: false,
                error: 'Token expirado'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error interno de autenticación',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
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

// Middleware para verificar si es super administrador
const isSuperAdmin = (req, res, next) => {
    if (req.user.tipo !== 'administrador' || !req.user.super_admin) {
        return res.status(403).json({
            success: false,
            error: 'Acceso denegado. Se requieren permisos de super administrador'
        });
    }
    next();
};

// Middleware para permitir cualquier usuario autenticado
const isAuthenticated = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Usuario no autenticado'
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    isAdmin,
    isEstudiante,
    isSuperAdmin,
    isAuthenticated
};