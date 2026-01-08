const { Sequelize } = require('sequelize');
const config = require('../config/database').development;

const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        dialectOptions: config.dialectOptions,
        logging: config.logging,
        pool: config.pool
    }
);

// Probar conexión
sequelize.authenticate()
    .then(() => console.log('✅ Conexión a PostgreSQL establecida'))
    .catch(err => console.error('❌ Error conectando:', err.message));

module.exports = sequelize;