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

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'Token inválido o expirado'
            });
        }

        req.user = user;
        next();
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