CREATE TABLE IF NOT EXISTS solicitudes_demo (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    codigo_pais VARCHAR(10) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'pendiente',
    notas TEXT
);
