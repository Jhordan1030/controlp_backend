// src/models/associations.js
const setupAssociations = (models) => {
    const {
        Universidad,
        ConfiguracionUniversidad,
        Periodo,
        Estudiante,
        TipoActividad,
        Matriculacion,
        RegistroHora,
        EstadoRegistro,
        Administrador,
        Evidencia
    } = models;

    console.log('🔗 Estableciendo relaciones...');

    try {
        // Universidad -> ConfiguracionUniversidad (1:1)
        Universidad.hasOne(ConfiguracionUniversidad, {
            foreignKey: 'universidad_id',
            as: 'configuracion'
        });
        ConfiguracionUniversidad.belongsTo(Universidad, {
            foreignKey: 'universidad_id',
            as: 'universidad'
        });

        // Universidad -> Periodos (1:N)
        Universidad.hasMany(Periodo, {
            foreignKey: 'universidad_id',
            as: 'periodos'
        });
        Periodo.belongsTo(Universidad, {
            foreignKey: 'universidad_id',
            as: 'universidad'
        });

        // Universidad -> Estudiantes (1:N)
        Universidad.hasMany(Estudiante, {
            foreignKey: 'universidad_id',
            as: 'estudiantes'
        });
        Estudiante.belongsTo(Universidad, {
            foreignKey: 'universidad_id',
            as: 'universidad'
        });

        // Universidad -> TiposActividad (1:N)
        Universidad.hasMany(TipoActividad, {
            foreignKey: 'universidad_id',
            as: 'tiposActividad'
        });
        TipoActividad.belongsTo(Universidad, {
            foreignKey: 'universidad_id',
            as: 'universidad'
        });

        // Periodo -> Estudiantes (1:N)
        Periodo.hasMany(Estudiante, {
            foreignKey: 'periodo_id',
            as: 'estudiantes'
        });
        Estudiante.belongsTo(Periodo, {
            foreignKey: 'periodo_id',
            as: 'periodo'
        });

        // Periodo -> Matriculaciones (1:N)
        Periodo.hasMany(Matriculacion, {
            foreignKey: 'periodo_id',
            as: 'matriculaciones'
        });
        Matriculacion.belongsTo(Periodo, {
            foreignKey: 'periodo_id',
            as: 'periodo'
        });

        // Estudiante -> Matriculaciones (1:N)
        Estudiante.hasMany(Matriculacion, {
            foreignKey: 'estudiante_id',
            as: 'matriculaciones'
        });
        Matriculacion.belongsTo(Estudiante, {
            foreignKey: 'estudiante_id',
            as: 'estudiante'
        });

        // Estudiante -> RegistrosHoras (1:N)
        Estudiante.hasMany(RegistroHora, {
            foreignKey: 'estudiante_id',
            as: 'registrosHoras'
        });
        RegistroHora.belongsTo(Estudiante, {
            foreignKey: 'estudiante_id',
            as: 'estudiante'
        });

        // Matriculacion -> RegistrosHoras (1:N)
        Matriculacion.hasMany(RegistroHora, {
            foreignKey: 'matriculacion_id',
            as: 'registrosHoras'
        });
        RegistroHora.belongsTo(Matriculacion, {
            foreignKey: 'matriculacion_id',
            as: 'matriculacion'
        });

        // TipoActividad -> RegistrosHoras (1:N)
        TipoActividad.hasMany(RegistroHora, {
            foreignKey: 'tipo_actividad_id',
            as: 'registrosHoras'
        });
        RegistroHora.belongsTo(TipoActividad, {
            foreignKey: 'tipo_actividad_id',
            as: 'tipoActividad'
        });

        // EstadoRegistro -> RegistrosHoras (1:N)
        EstadoRegistro.hasMany(RegistroHora, {
            foreignKey: 'estado_id',
            as: 'registrosHoras'
        });
        RegistroHora.belongsTo(EstadoRegistro, {
            foreignKey: 'estado_id',
            as: 'estado'
        });

        // Administrador -> RegistrosHoras (aprobados) (1:N)
        Administrador.hasMany(RegistroHora, {
            foreignKey: 'aprobado_por',
            as: 'registrosAprobados'
        });
        RegistroHora.belongsTo(Administrador, {
            foreignKey: 'aprobado_por',
            as: 'aprobador'
        });

        // RegistroHora -> Evidencias (1:N)
        RegistroHora.hasMany(Evidencia, {
            foreignKey: 'registro_horas_id',
            as: 'evidencias'
        });
        Evidencia.belongsTo(RegistroHora, {
            foreignKey: 'registro_horas_id',
            as: 'registro'
        });

        console.log('✅ Todas las relaciones establecidas');
    } catch (error) {
        console.error('❌ Error estableciendo relaciones:', error.message);
    }
};

module.exports = setupAssociations;