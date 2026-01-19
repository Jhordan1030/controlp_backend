const http = require('http');

const data = JSON.stringify({
    nombre: "Test Lead",
    codigo_pais: "+593",
    telefono: "0999999999"
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

    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('Response Body:', responseData);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
