// src/database/index.js
require('dotenv').config();
const { Sequelize } = require('sequelize');
const pg = require('pg'); // Importar pg explícitamente para Vercel

console.log('🔧 Inicializando conexión a base de datos (src/database/index.js)...');

let sequelizeInstance = null;

function createDummyConnection() {
    console.log('🔄 Creando conexión dummy...');
    return {
        authenticate: () => Promise.reject(new Error('DB no disponible (Dummy Mode)')),
        query: () => Promise.resolve([[], { rows: [] }]),
        sync: () => Promise.resolve(),
        close: () => Promise.resolve(),
        define: (name) => {
            console.log(`📋 Modelo dummy: ${name}`);
            return {
                name,
                findAll: () => Promise.resolve([]),
                findOne: () => Promise.resolve(null),
                create: (data) => Promise.resolve({ id: Date.now(), ...data }),
                update: () => Promise.resolve([0]),
                destroy: () => Promise.resolve(0),
                belongsTo: () => { },
                hasMany: () => { },
                hasOne: () => { },
                belongsToMany: () => { }
            };
        }
    };
}

const getSequelize = () => {
    if (sequelizeInstance) {
        return sequelizeInstance;
    }

    try {
        const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
        console.log(isVercel ? '🌍 Entorno: Vercel/Production' : '💻 Entorno: Local');

        // Construir URL de conexión si no existe pero tenemos las credenciales individuales
        let connectionUrl = process.env.DATABASE_URL;
        if (!connectionUrl && process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
            console.log('ℹ️  Usando credenciales individuales del .env');
            const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;
            connectionUrl = `postgres://${DB_USER}:${DB_PASSWORD || ''}@${DB_HOST}:${DB_PORT || 5432}/${DB_NAME}`;
        }

        // Si no hay DATABASE_URL ni credenciales completas, usar dummy
        if (!connectionUrl) {
            console.warn('⚠️  No DATABASE_URL ni credenciales completas configuradas - usando modo dummy');
            sequelizeInstance = createDummyConnection();
            return sequelizeInstance;
        }

        console.log('🔌 Conectando a PostgreSQL...');

        // Configuración SSL: requerida para Vercel/Render, opcional para local
        // En local, muchas veces no se tiene SSL configurado en postgres.
        const dialectOptions = {};
        if (isVercel || process.env.DB_SSL === 'true') {
            dialectOptions.ssl = {
                require: true,
                rejectUnauthorized: false
            };
        }

        // Crear conexión REAL
        sequelizeInstance = new Sequelize(connectionUrl, {
            dialect: 'postgres',
            dialectModule: pg,
            dialectOptions,
            pool: {
                max: isVercel ? 2 : 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            logging: isVercel ? false : console.log,
            benchmark: true
        });

        // Autenticación asíncrona (no bloqueante)
        sequelizeInstance.authenticate()
            .then(() => console.log('✅ Conexión DB establecida correctamente'))
            .catch(err => console.error('❌ Error conexión DB:', err.message));

        return sequelizeInstance;

    } catch (error) {
        console.error('❌ ERROR CRÍTICO inicializando DB:', error.message);
        sequelizeInstance = createDummyConnection();
        return sequelizeInstance;
    }
};

// Exportar la instancia directamente (Sequelize pattern)
// Al llamar a la función aquí, nos aseguramos que se cree la instancia
module.exports = getSequelize();