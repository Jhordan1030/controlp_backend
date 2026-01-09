// models/associations.js
const setupAssociations = (models) => {
    const { Universidad, Periodo, Estudiante, RegistroHora } = models;

    // Universidad -> Periodos
    Universidad.hasMany(Periodo, {
        foreignKey: 'universidad_id',
        as: 'periodos'
    });
    Periodo.belongsTo(Universidad, {
        foreignKey: 'universidad_id',
        as: 'universidad'
    });

    // Universidad -> Estudiantes
    Universidad.hasMany(Estudiante, {
        foreignKey: 'universidad_id',
        as: 'estudiantes'
    });
    Estudiante.belongsTo(Universidad, {
        foreignKey: 'universidad_id',
        as: 'universidad'
    });

    // Periodo -> Estudiantes
    Periodo.hasMany(Estudiante, {
        foreignKey: 'periodo_id',
        as: 'estudiantes'
    });
    Estudiante.belongsTo(Periodo, {
        foreignKey: 'periodo_id',
        as: 'periodo'
    });

    // Estudiante -> RegistrosHoras
    Estudiante.hasMany(RegistroHora, {
        foreignKey: 'estudiante_id',
        as: 'registros'
    });
    RegistroHora.belongsTo(Estudiante, {
        foreignKey: 'estudiante_id',
        as: 'estudiante'
    });

    console.log('✅ Asociaciones definidas correctamente');
};

module.exports = setupAssociations;