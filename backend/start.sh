#!/bin/bash
# filepath: backend/start.sh
echo "🚀 Iniciando InmoTable Backend en Render..."

# Verificar directorio público
if [ ! -d "public" ]; then
    echo "❌ Directorio public/ no encontrado"
    exit 1
fi

# Generar APP_KEY si no existe
if [ -z "$APP_KEY" ]; then
    echo "🔑 Generando APP_KEY..."
    php artisan key:generate --force
fi

# Limpiar cache
echo "🧹 Limpiando cache..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Crear enlace simbólico para storage
echo "🔗 Creando enlace simbólico..."
php artisan storage:link

# Configurar Apache para usar el puerto de Render
if [ ! -z "$PORT" ]; then
    echo "🌐 Configurando Apache para puerto $PORT..."
    sed -i "s/Listen 80/Listen $PORT/g" /etc/apache2/ports.conf
    sed -i "s/:80/:$PORT/g" /etc/apache2/sites-available/000-default.conf
fi

echo "✅ Aplicación lista"

# Iniciar Apache
exec apache2-foreground