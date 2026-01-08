const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const RegistroHora = sequelize.define('RegistroHora', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    estudiante_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    horas: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'registros_horas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = RegistroHora;