const { Administrador } = require('../src/models');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function getAdmin() {
    try {
        let admin = await Administrador.findOne();
        if (!admin) {
            console.log('No admin found, creating one...');
            const hash = await bcrypt.hash('123456', 10);
            admin = await Administrador.create({
                nombres: 'Admin',
                apellidos: 'Test',
                email: 'admin@test.com',
                password_hash: hash,
                rol: 'administrador', // Adjust if model uses different field
                tipo: 'administrador', // Adjust based on earlier findings
                activo: true,
                super_admin: true
            });
        }
        console.log('ADMIN_ID:', admin.id);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

getAdmin();
