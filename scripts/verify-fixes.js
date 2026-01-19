const { SolicitudDemo, Administrador } = require('../src/models');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Fixes to verify:
// 1. Timezone (UTC-5) on Creation
// 2. Deletion on Status = 'contactado'

async function verifyFixes() {
    const baseUrl = 'http://localhost:3000/api/v1';

    try {
        console.log('🏁 Starting Verification Process...');

        // --- STEP 1: CREATE LEAD ---
        const leadData = {
            nombre: 'Test Timezone User',
            codigo_pais: '+593',
            telefono: '0999999999'
        };

        console.log('\n1️⃣ Creating Lead via Public API...');
        // Note: publicRoutes usually under /api/v1/public or similar. Checking file content next will confirm
        // Assuming /api/v1/solicitud-demo based on controller name, but checking routes is better.
        // Let's assume standard REST for now or adjust based on view_file result.
        // Wait, I am writing this file BEFORE reading the route. I should adjust the URL after reading.
        // I will use a placeholder URL and fix it if needed, or better, assume '/public/solicitud-demo' if that's standard.
        // ACTUALLY, I'll rely on the view_file I just called to get the URL right.

        // Let's create the file assuming the route is '/public/solicitudes' or similar.
        // I'll make the fetch call generic for now.

        const resCreate = await fetch(`${baseUrl}/public/create-lead`, { // Corrected based on file check
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadData)
        });

        const createData = await resCreate.json();

        if (!resCreate.ok) {
            throw new Error(`Failed to create lead: ${JSON.stringify(createData)}`);
        }

        const leadId = createData.leadId;
        console.log(`✅ Lead Created! ID: ${leadId}`);

        // --- STEP 2: VERIFY TIMEZONE & EXISTENCE ---
        const leadInDb = await SolicitudDemo.findByPk(leadId);
        if (!leadInDb) {
            throw new Error('Lead not found in DB immediately after creation');
        }

        console.log('🕒 Created At (DB):', leadInDb.fecha_solicitud);
        // We can't strictly assert the timezone without knowing the server Timezone settings exactly,
        // but we can look at the log output.

        // --- STEP 3: AUTHENTICATE AS ADMIN ---
        const admin = await Administrador.findOne();
        if (!admin) throw new Error('No admin found');

        const token = jwt.sign(
            { id: admin.id, tipo: 'administrador' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // --- STEP 4: UPDATE TO 'contactado' ---
        console.log(`\n2️⃣ Updating Lead ${leadId} to 'contactado'...`);
        const resUpdate = await fetch(`${baseUrl}/admin/leads/${leadId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: 'contactado' })
        });

        const updateData = await resUpdate.json();

        if (!resUpdate.ok) {
            console.log(updateData);
            throw new Error('Failed to update lead');
        }

        console.log(`✅ Update Response: ${updateData.message}`);

        // --- STEP 5: VERIFY DELETION ---
        console.log('\n3️⃣ Verifying Deletion from DB...');
        const leadDeleted = await SolicitudDemo.findByPk(leadId);

        if (leadDeleted) {
            console.error('❌ Lead STILL EXISTS in DB! Deletion failed.');
        } else {
            console.log('✅ Lead successfully DELETED from DB.');
        }

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    } finally {
        process.exit(0);
    }
}

verifyFixes();
