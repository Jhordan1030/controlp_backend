const sequelize = require('../database');
const Universidad = require('./Universidad');
const Periodo = require('./Periodo');
const Estudiante = require('./Estudiante');
const RegistroHora = require('./RegistroHora');
const Administrador = require('./Administrador');

// ========== RELACIONES ==========

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

module.exports = {
    sequelize,
    Universidad,
    Periodo,
    Estudiante,
    RegistroHora,
    Administrador
};