Write-Host "=== Configuración inicial de InmoTable Backend con Docker ===" -ForegroundColor Green

# Crear directorio para logs si no existe
if (!(Test-Path "storage/logs")) {
    New-Item -ItemType Directory -Path "storage/logs" -Force
}

# Copiar archivo de configuración de entorno si no existe
if (!(Test-Path ".env")) {
    Write-Host "Copiando archivo .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    
    # Actualizar configuración para Docker
    (Get-Content ".env") -replace "DB_HOST=127.0.0.1", "DB_HOST=mysql" | Set-Content ".env"
    (Get-Content ".env") -replace "DB_DATABASE=laravel", "DB_DATABASE=inmotable_db" | Set-Content ".env"
    (Get-Content ".env") -replace "DB_USERNAME=root", "DB_USERNAME=inmotable_user" | Set-Content ".env"
    (Get-Content ".env") -replace "DB_PASSWORD=", "DB_PASSWORD=inmotable_password" | Set-Content ".env"
    (Get-Content ".env") -replace "APP_URL=http://localhost", "APP_URL=http://localhost:8080" | Set-Content ".env"
    
    Write-Host "Archivo .env configurado para Docker" -ForegroundColor Green
}

# Levantar los contenedores
Write-Host "Iniciando contenedores Docker..." -ForegroundColor Yellow
docker-compose up -d --build

# Esperar a que los servicios estén listos
Write-Host "Esperando a que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Instalar dependencias de Composer incluyendo Passport
Write-Host "Instalando Laravel Passport..." -ForegroundColor Yellow
docker-compose exec app composer require laravel/passport

# Generar clave de aplicación
Write-Host "Generando clave de aplicación..." -ForegroundColor Yellow
docker-compose exec app php artisan key:generate

# Ejecutar migraciones
Write-Host "Ejecutando migraciones..." -ForegroundColor Yellow
docker-compose exec app php artisan migrate

# Instalar Passport
Write-Host "Configurando Laravel Passport..." -ForegroundColor Yellow
docker-compose exec app php artisan passport:install

# Establecer permisos
Write-Host "Estableciendo permisos..." -ForegroundColor Yellow
docker-compose exec app chown -R www-data:www-data /var/www/html/storage
docker-compose exec app chown -R www-data:www-data /var/www/html/bootstrap/cache

Write-Host "¡Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "URLs disponibles:" -ForegroundColor Cyan
Write-Host "- Aplicación: http://localhost:8080" -ForegroundColor White
Write-Host "- phpMyAdmin: http://localhost:8081" -ForegroundColor White
Write-Host ""
Write-Host "Credenciales de MySQL:" -ForegroundColor Cyan
Write-Host "- Host: localhost:3306" -ForegroundColor White
Write-Host "- Base de datos: inmotable_db" -ForegroundColor White
Write-Host "- Usuario: inmotable_user" -ForegroundColor White
Write-Host "- Contraseña: inmotable_password" -ForegroundColor White
Write-Host ""
Write-Host "Comandos útiles:" -ForegroundColor Cyan
Write-Host "- Para detener los contenedores: docker-compose down" -ForegroundColor White
Write-Host "- Para ver logs: docker-compose logs -f" -ForegroundColor White 