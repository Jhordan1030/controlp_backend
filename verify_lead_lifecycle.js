const http = require('http');

const cleanLead = (id) => {
    // Optional: Clean up if needed, but the test deletes it
};

const createLead = () => {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            nombre: "Test Lead Lifecycle",
            codigo_pais: "+593",
            telefono: "0991234567"
        });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/v1/public/create-lead',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    console.log('Create Response:', parsed);
                    if (res.statusCode === 201 && parsed.success) {
                        resolve(parsed.leadId);
                    } else {
                        reject('Failed to create lead');
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
};

const updateLeadToContactado = (id) => {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            estado: 'contactado'
        });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/api/v1/admin/leads/${id}/estado`, // Assuming this is the route based on controller signature
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    console.log('Update Response:', parsed);
                    if (res.statusCode === 200 && parsed.success) {
                        resolve(parsed);
                    } else {
                        reject('Failed to update lead');
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
};

const runTest = async () => {
    try {
        console.log('--- Starting Lead Lifecycle Test ---');
        console.log('1. Creating Lead...');
        const leadId = await createLead();
        console.log(`Lead Created with ID: ${leadId}`);

        console.log('2. Updating Lead to Contactado (Should delete)...');
        const updateResult = await updateLeadToContactado(leadId);
        console.log('Update Result:', updateResult.message);

        if (updateResult.message.includes('eliminado')) {
            console.log('✅ SUCCESS: Lead was correctly deleted upon status change.');
        } else {
            console.error('❌ FAILURE: Lead was not reported as deleted.');
        }
    } catch (error) {
        console.error('❌ Error during test:', error);
    }
};

runTest();
