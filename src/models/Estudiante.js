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
        type: DataTypes.STRING,
        allowNull: false
    },
    apellidos: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password_hash: {
        type: DataTypes.STRING,
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
    updatedAt: 'updated_at',
    indexes: [
        {
            name: 'estudiantes_email_key',
            unique: true,
            fields: ['email']
        },
        {
            name: 'idx_estudiantes_email',
            fields: ['email']
        },
        {
            name: 'idx_estudiantes_universidad',
            fields: ['universidad_id']
        },
        {
            name: 'idx_estudiantes_periodo',
            fields: ['periodo_id']
        },
        {
            name: 'idx_estudiantes_activos',
            fields: ['activo'],
            where: { activo: true }
        }
    ]
});

module.exports = Estudiante;