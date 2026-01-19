// src/models/index.js
const sequelize = require('../database/index');
const setupAssociations = require('./associations');

console.log('🔄 Cargando modelos...');

// Importar modelos
const Universidad = require('./Universidad');
const ConfiguracionUniversidad = require('./ConfiguracionUniversidad');
const Periodo = require('./Periodo');
const Estudiante = require('./Estudiante');
const Administrador = require('./Administrador');
const EstadoRegistro = require('./EstadoRegistro');
const TipoActividad = require('./TipoActividad');
const Matriculacion = require('./Matriculacion');
const RegistroHora = require('./RegistroHora');
const Evidencia = require('./Evidencia');
const Auditoria = require('./Auditoria');
const Sesion = require('./Sesion');
const SolicitudDemo = require('./SolicitudDemo');

// Objeto con todos los modelos
const models = {
    Universidad,
    ConfiguracionUniversidad,
    Periodo,
    Estudiante,
    Administrador,
    EstadoRegistro,
    TipoActividad,
    Matriculacion,
    RegistroHora,
    Evidencia,
    Auditoria,
    Auditoria,
    Sesion,
    SolicitudDemo
};

// Configurar asociaciones
setupAssociations(models);

// Función de sincronización
const syncDatabase = async (force = false, alter = false) => {
    try {
        console.log('🔄 Sincronizando base de datos...');

        if (!sequelize) {
            console.warn('⚠️  Sequelize no disponible para sincronizar');
            return false;
        }

        // Sincronizar todos los modelos
        await sequelize.sync({ force, alter });

        console.log('✅ Base de datos sincronizada correctamente');
        return true;

    } catch (error) {
        console.error('❌ Error sincronizando base de datos:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
};

// Exportar
module.exports = {
    sequelize,
    ...models,
    syncDatabase
};