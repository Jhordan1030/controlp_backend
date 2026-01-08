require('dotenv').config();
const { sequelize } = require('../models');

async function syncDatabase(force = false) {
    try {
        console.log('🔄 Sincronizando base de datos...');

        if (force) {
            console.log('⚠️  MODO FORCE - Se borrarán todos los datos');
        }

        await sequelize.sync({ force, alter: !force });

        console.log('✅ Base de datos sincronizada');
        return true;
    } catch (error) {
        console.error('❌ Error sincronizando:', error);
        return false;
    }
}

// Si se ejecuta directamente
if (require.main === module) {
    const force = process.argv.includes('--force');

    syncDatabase(force)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { syncDatabase };