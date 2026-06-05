#!/bin/bash
# Script de inicio para Render.com
# Asegura que Next.js use el puerto correcto

# Obtener el puerto de la variable de entorno PORT o usar 3000 por defecto
PORT=${PORT:-3000}

echo "🚀 Starting Next.js server on port $PORT..."

# Iniciar Next.js con el puerto correcto
exec next start -H 0.0.0.0 -p "$PORT"
