#!/bin/bash
# vercel-build.sh
echo "🔧 Instalando dependencias para Vercel..."

# Instalar sin dependencias nativas opcionales
npm install --no-optional

# Verificar que pg esté instalado
if npm list pg | grep -q "pg@"; then
  echo "✅ pg instalado correctamente"
else
  echo "❌ Error: pg no se instaló"
  exit 1
fi

echo "🚀 Build completado"