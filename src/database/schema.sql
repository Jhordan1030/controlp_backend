-- Habilitar UUID en PostgreSQL si no está activo
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. UNIVERSIDADES
CREATE TABLE IF NOT EXISTS universidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PERIODOS (con horas totales requeridas)
CREATE TABLE IF NOT EXISTS periodos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    universidad_id UUID REFERENCES universidades(id) ON DELETE CASCADE,
    nombre VARCHAR(50) NOT NULL, -- Ej: "2024-I", "2024-II"
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    horas_totales_requeridas INTEGER NOT NULL CHECK (horas_totales_requeridas > 0),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_fechas_validas CHECK (fecha_fin > fecha_inicio),
    CONSTRAINT unique_periodo_universidad UNIQUE(universidad_id, nombre)
);

-- 3. ESTUDIANTES (solo email para login, sin código)
CREATE TABLE IF NOT EXISTS estudiantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    universidad_id UUID REFERENCES universidades(id) ON DELETE CASCADE,
    periodo_id UUID REFERENCES periodos(id) ON DELETE CASCADE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_email_valido CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 4. REGISTROS DE HORAS
CREATE TABLE IF NOT EXISTS registros_horas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estudiante_id UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    horas DECIMAL(4,2) NOT NULL CHECK (horas > 0 AND horas <= 24),
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_estudiante_fecha UNIQUE(estudiante_id, fecha),
    CONSTRAINT chk_fecha_no_futura CHECK (fecha <= CURRENT_DATE)
);

-- 5. ADMINISTRADORES (login con email)
CREATE TABLE IF NOT EXISTS administradores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombres VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    super_admin BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_email_admin_valido CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 6. TABLA DE AUDITORÍA (Para seguridad)
CREATE TABLE IF NOT EXISTS auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID,
    usuario_tipo VARCHAR(20), -- 'administrador' o 'estudiante'
    accion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(50),
    registro_id UUID,
    detalles JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES PARA MEJOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_estudiantes_email ON estudiantes(email);
CREATE INDEX IF NOT EXISTS idx_estudiantes_universidad ON estudiantes(universidad_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_periodo ON estudiantes(periodo_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_activos ON estudiantes(activo) WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_registros_estudiante ON registros_horas(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_registros_fecha ON registros_horas(fecha);
CREATE INDEX IF NOT EXISTS idx_registros_estudiante_fecha ON registros_horas(estudiante_id, fecha);

CREATE INDEX IF NOT EXISTS idx_administradores_email ON administradores(email);
CREATE INDEX IF NOT EXISTS idx_administradores_activos ON administradores(activo) WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(usuario_id, usuario_tipo);
CREATE INDEX IF NOT EXISTS idx_auditoria_accion ON auditoria(accion);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(created_at);

-- VISTA PARA REPORTES DE ESTUDIANTES
CREATE OR REPLACE VIEW vista_estudiantes_horas AS
SELECT
    e.id,
    e.nombres,
    e.apellidos,
    e.email,
    e.universidad_id,
    u.nombre as universidad_nombre,
    e.periodo_id,
    p.nombre as periodo_nombre,
    p.horas_totales_requeridas,
    p.fecha_inicio,
    p.fecha_fin,
    COALESCE(SUM(r.horas), 0) as horas_acumuladas,
    (p.horas_totales_requeridas - COALESCE(SUM(r.horas), 0)) as horas_faltantes,
    CASE
        WHEN COALESCE(SUM(r.horas), 0) >= p.horas_totales_requeridas
            THEN true
        ELSE false
        END as cumplio_horas,
    CASE
        WHEN CURRENT_DATE < p.fecha_inicio THEN 'No iniciado'
        WHEN CURRENT_DATE > p.fecha_fin THEN 'Finalizado'
        ELSE 'En curso'
        END as estado_periodo
FROM estudiantes e
         JOIN universidades u ON e.universidad_id = u.id
         JOIN periodos p ON e.periodo_id = p.id
         LEFT JOIN registros_horas r ON e.id = r.estudiante_id
WHERE e.activo = true AND u.activa = true AND p.activo = true
GROUP BY e.id, e.nombres, e.apellidos, e.email, e.universidad_id,
         u.nombre, e.periodo_id, p.nombre, p.horas_totales_requeridas,
         p.fecha_inicio, p.fecha_fin;

-- FUNCIÓN PARA TRIGGER DE AUDITORÍA
CREATE OR REPLACE FUNCTION auditar_cambio()
    RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO auditoria (
        usuario_id,
        usuario_tipo,
        accion,
        tabla_afectada,
        registro_id,
        detalles,
        ip_address,
        user_agent
    ) VALUES (
                 current_setting('app.user_id', TRUE)::UUID,
                 current_setting('app.user_tipo', TRUE),
                 TG_OP, -- INSERT, UPDATE, DELETE
                 TG_TABLE_NAME,
                 COALESCE(NEW.id, OLD.id),
                 jsonb_build_object(
                         'nuevo', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
                         'anterior', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END
                 ),
                 current_setting('app.ip_address', TRUE)::INET,
                 current_setting('app.user_agent', TRUE)
             );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
