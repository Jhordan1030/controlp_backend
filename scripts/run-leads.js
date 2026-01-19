const fs = require('fs');
const path = require('path');
const sequelize = require('../src/database');

async function run() {
    try {
        const sqlPath = path.resolve(__dirname, '../leads.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running SQL from:', sqlPath);

        // Execute the SQL
        await sequelize.query(sql);

        console.log('✅ Successfully executed leads.sql');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error executing leads.sql:', error);
        process.exit(1);
    }
}

run();
