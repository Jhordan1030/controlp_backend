const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Estudiante = sequelize.define('Estudiante', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    universidad_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    periodo_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    nombres: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    apellidos: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'estudiantes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Estudiante;