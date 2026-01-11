// ==================== src/app.js ====================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const estudianteRoutes = require('./routes/estudianteRoutes');

// Importar middleware de errores
const errorHandler = require('./middlewares/errorHandler');

// Crear aplicación Express
const app = express();

// Configurar trust proxy para Vercel/proxies
app.set('trust proxy', 1);

// Configurar CORS dinámicamente
const corsOptions = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Si hay variable de entorno CORS_ORIGIN
if (process.env.CORS_ORIGIN) {
  // Verificar si es un string con múltiples orígenes
  if (process.env.CORS_ORIGIN.includes(',')) {
    const allowedOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());

    corsOptions.origin = function (origin, callback) {
      // Permite requests sin origen (como mobile apps o curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, origin);
      } else {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
    };
  } else {
    // Solo un origen
    corsOptions.origin = process.env.CORS_ORIGIN;
  }
} else {
  // Valor por defecto para desarrollo
  corsOptions.origin = 'http://localhost:5173';
}

// Middlewares de seguridad
app.use(helmet());
app.use(cors(corsOptions)); // <-- Usar la configuración dinámica

// Rate limiting general
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests
  message: {
    success: false,
    error: 'Demasiadas solicitudes. Intente después de 15 minutos.'
  }
});
app.use('/api/', limiter);

// Rate limiting específico para Auth (Estricto)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 intentos de login/registro por IP
  message: {
    success: false,
    error: 'Demasiados intentos de inicio de sesión. Intente más tarde.'
  }
});
app.use('/api/v1/auth', authLimiter);

// Protección contra ataques de polución de parámetros
app.use(hpp());

// Body parser con límite
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logger simple
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'N/A'}`);
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