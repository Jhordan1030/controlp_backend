// ==================== src/app.js ====================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const estudianteRoutes = require('./routes/estudianteRoutes');

// Importar middleware de errores
const errorHandler = require('./middlewares/errorHandler');

// Crear aplicación Express
const app = express();

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests
    message: {
        success: false,
        error: 'Demasiadas solicitudes. Intente después de 15 minutos.'
    }
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger simple
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// RUTAS
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/estudiante', estudianteRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
    res.json({
        success: true,
        status: 'OK',
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Ruta principal
app.get('/', (req, res) => {
    res.json({
        success: true,
        name: 'Control de Prácticas API',
        version: '1.0.0',
        description: 'API para sistema de control de prácticas universitarias',
        endpoints: {
            health: '/api/v1/health',
            auth: '/api/v1/auth',
            admin: '/api/v1/admin',
            estudiante: '/api/v1/estudiante'
        },
        documentation: {
            login: 'POST /api/v1/auth/login',
            primeradmin: 'POST /api/v1/auth/primer-admin',
            dashboard_admin: 'GET /api/v1/admin/dashboard',
            dashboard_estudiante: 'GET /api/v1/estudiante/dashboard'
        }
    });
});

// 404 - Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        path: req.path,
        method: req.method
    });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Exportar la aplicación
module.exports = app;