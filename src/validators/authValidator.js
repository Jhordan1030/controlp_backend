const { body } = require('express-validator');

const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
];

const validateRegistroEstudiante = [
    body('nombres')
        .trim()
        .notEmpty().withMessage('Los nombres son requeridos')
        .isLength({ min: 2, max: 100 }).withMessage('Nombres deben tener entre 2 y 100 caracteres')
        .escape(),
    body('apellidos')
        .trim()
        .notEmpty().withMessage('Los apellidos son requeridos')
        .isLength({ min: 2, max: 100 }).withMessage('Apellidos deben tener entre 2 y 100 caracteres')
        .escape(),
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

const validateRegistroAdmin = [
    body('nombres')
        .trim()
        .notEmpty().withMessage('Los nombres son requeridos')
        .isLength({ min: 2, max: 100 }).withMessage('Nombres deben tener entre 2 y 100 caracteres')
        .escape(),
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

module.exports = {
    validateLogin,
    validateRegistroEstudiante,
    validateRegistroAdmin
};
