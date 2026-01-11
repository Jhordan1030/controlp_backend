// src/database/index.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Para Vercel - Conexión simple y robusta
const getSequelize = () => {
  // Si no hay DATABASE_URL, retornar una instancia dummy
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL no configurada - usando conexión dummy');
    return {
      authenticate: () => Promise.reject(new Error('Base de datos no configurada')),
      sync: () => Promise.resolve(),
      query: () => Promise.resolve([]),
      close: () => Promise.resolve(),
      define: () => ({})
    };
  }

  try {
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      retry: {
        max: 3,
        timeout: 30000
      }
    });

    // No autenticar inmediatamente para evitar bloqueo
    sequelize.authenticate()
      .then(() => console.log('✅ Conexión a PostgreSQL establecida'))
      .catch(err => console.warn('⚠️  No se pudo conectar a PostgreSQL:', err.message));

    return sequelize;
  } catch (error) {
    console.error('❌ Error al crear instancia Sequelize:', error.message);
    // Retornar dummy si hay error
    return {
      authenticate: () => Promise.reject(error),
      sync: () => Promise.resolve(),
      query: () => Promise.resolve([]),
      close: () => Promise.resolve(),
      define: () => ({})
    };
  }
};

module.exports = getSequelize();