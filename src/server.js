// Al principio de src/server.js
require('dotenv').config();

// Detectar si estamos en Vercel
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  console.log('🚀 EJECUTANDO EN VERCEL');
  console.log('🔧 Configurando para entorno serverless...');
  
  // En Vercel, exportar la app directamente
  module.exports = require('./app');
} else {
  // Código local normal
  const app = require('./app');
  const PORT = process.env.PORT || 3000;
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor local en puerto ${PORT}`);
  });
}