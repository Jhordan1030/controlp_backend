const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const estudianteRoutes = require('./routes/estudianteRoutes');

// Crear aplicación Express
const app = express();

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        error: 'Demasiadas solicitudes. Intente después de 15 minutos.'
    }
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/estudiante', estudianteRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
    res.json({
        success: true,
        status: 'OK',
        message: 'API funcionando',
        timestamp: new Date().toISOString()
    });
});

// Ruta principal
app.get('/', (req, res) => {
    res.json({
        success: true,
        name: 'Control de Prácticas API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/v1/auth',
            admin: '/api/v1/admin',
            estudiante: '/api/v1/estudiante',
            health: '/api/v1/health'
        }
    });
});

// 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
});

// Exportar la aplicación Express
module.exports = app;