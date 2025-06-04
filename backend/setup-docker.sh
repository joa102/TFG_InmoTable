#!/bin/bash

echo "=== Configuración inicial de InmoTable Backend con Docker ==="

# Crear directorio para logs si no existe
mkdir -p storage/logs

# Copiar archivo de configuración de entorno si no existe
if [ ! -f .env ]; then
    echo "Copiando archivo .env..."
    cp .env.example .env
    
    # Actualizar configuración para Docker
    sed -i 's/DB_HOST=127.0.0.1/DB_HOST=mysql/' .env
    sed -i 's/DB_DATABASE=laravel/DB_DATABASE=inmotable_db/' .env
    sed -i 's/DB_USERNAME=root/DB_USERNAME=inmotable_user/' .env
    sed -i 's/DB_PASSWORD=/DB_PASSWORD=inmotable_password/' .env
    sed -i 's|APP_URL=http://localhost|APP_URL=http://localhost:8080|' .env
    
    echo "Archivo .env configurado para Docker"
fi

# Levantar los contenedores
echo "Iniciando contenedores Docker..."
docker-compose up -d --build

# Esperar a que los servicios estén listos
echo "Esperando a que los servicios estén listos..."
sleep 30

# Instalar dependencias de Composer incluyendo Passport
echo "Instalando Laravel Passport..."
docker-compose exec app composer require laravel/passport

# Generar clave de aplicación
echo "Generando clave de aplicación..."
docker-compose exec app php artisan key:generate

# Ejecutar migraciones
echo "Ejecutando migraciones..."
docker-compose exec app php artisan migrate

# Instalar Passport
echo "Configurando Laravel Passport..."
docker-compose exec app php artisan passport:install

# Establecer permisos
echo "Estableciendo permisos..."
docker-compose exec app chown -R www-data:www-data /var/www/html/storage
docker-compose exec app chown -R www-data:www-data /var/www/html/bootstrap/cache

echo "¡Configuración completada!"
echo ""
echo "URLs disponibles:"
echo "- Aplicación: http://localhost:8080"
echo "- phpMyAdmin: http://localhost:8081"
echo ""
echo "Credenciales de MySQL:"
echo "- Host: localhost:3306"
echo "- Base de datos: inmotable_db"
echo "- Usuario: inmotable_user"
echo "- Contraseña: inmotable_password"
echo ""
echo "Para detener los contenedores: docker-compose down"
echo "Para ver logs: docker-compose logs -f" 