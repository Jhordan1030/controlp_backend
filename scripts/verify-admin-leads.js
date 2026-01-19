const jwt = require('jsonwebtoken');
require('dotenv').config();
const { Administrador } = require('../src/models');

async function verify() {
    const baseUrl = 'http://localhost:3000/api/v1';

    try {
        console.log('🔍 Looking for an admin...');
        const admin = await Administrador.findOne();
        if (!admin) {
            console.error('❌ No admin found in DB. Please create one first.');
            process.exit(1);
        }
        console.log(`✅ Found Admin ID: ${admin.id}`);

        // Generate Token
        // Payload must match middleware expectations: { id, tipo: 'administrador' }
        const token = jwt.sign(
            { id: admin.id, tipo: 'administrador' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log('🔑 Generated Valid Token');

        // 1. GET /leads
        console.log('\n📡 Testing GET /admin/leads...');
        const resGet = await fetch(`${baseUrl}/admin/leads`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resGet.ok) {
            const leads = await resGet.json();
            console.log(`✅ GET Success. Found ${leads.length} leads.`);
            if (leads.length > 0) {
                console.log('Sample Lead:', leads[0]);

                // 2. PUT /leads/:id
                const targetId = leads[0].id; // Use real ID from DB
                console.log(`\n📡 Testing PUT /admin/leads/${targetId}...`);

                const resPut = await fetch(`${baseUrl}/admin/leads/${targetId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ estado: 'contactado' })
                });

                const putData = await resPut.json();
                console.log('PUT Response:', putData);
                if (resPut.ok) {
                    console.log('✅ PUT Success');
                } else {
                    console.error('❌ PUT Failed:', putData);
                }
            } else {
                console.log('⚠️ No leads to test PUT.');
                // Create a dummy lead to test PUT? (Optional, skipping for now)
            }
        } else {
            console.error('❌ GET Failed:', await resGet.text());
        }

    } catch (error) {
        console.error('❌ Verification Error:', error);
    }
    process.exit(0);
}

verify();
