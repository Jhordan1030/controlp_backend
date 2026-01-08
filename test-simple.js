const axios = require('axios');

async function test() {
    console.log('🧪 Probando API básica...\n');

    try {
        // 1. Health check
        console.log('1. Health Check:');
        const health = await axios.get('http://localhost:3000/api/v1/health');
        console.log(`   ✅ ${health.data.message}`);

        // 2. Login admin
        console.log('\n2. Login Admin:');
        const login = await axios.post('http://localhost:3000/api/v1/auth/login', {
            email: 'admin@controlpracticas.com',
            password: 'Admin123!'
        });

        if (login.data.success) {
            console.log(`   ✅ Login exitoso`);
            console.log(`   🔑 Token recibido: ${login.data.token.substring(0, 30)}...`);

            // 3. Dashboard con token
            console.log('\n3. Dashboard Admin:');
            const dashboard = await axios.get('http://localhost:3000/api/v1/admin/dashboard', {
                headers: { Authorization: `Bearer ${login.data.token}` }
            });

            console.log(`   ✅ Dashboard cargado`);
            console.log(`   📊 Universidades: ${dashboard.data.estadisticas.totalUniversidades}`);
            console.log(`   👨‍🎓 Estudiantes: ${dashboard.data.estadisticas.totalEstudiantes}`);

        } else {
            console.log(`   ❌ Error: ${login.data.error}`);
        }

        console.log('\n✨ Prueba completada!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Respuesta:', error.response.data);
        }
    }
}

test();