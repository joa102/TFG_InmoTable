# InmoTable Backend - Configuración Docker

## Descripción

Este proyecto backend de Laravel está configurado para ejecutarse con Docker usando:
- **PHP 8.1 FPM** - Servidor de aplicación
- **Nginx** - Servidor web
- **MySQL 8.0** - Base de datos
- **Laravel Passport** - Autenticación API para el frontend Angular

## Estructura de Contenedores

```
├── app (PHP 8.1 FPM)           - Puerto interno: 9000
├── nginx (Nginx Alpine)        - Puerto externo: 8080
├── mysql (MySQL 8.0)          - Puerto externo: 3306
└── phpmyadmin (phpMyAdmin)     - Puerto externo: 8081
```

## Requisitos Previos

- Docker Desktop instalado
- Docker Compose

## Configuración Rápida

### Opción 1: Script Automático (Windows)
```powershell
.\setup-docker.ps1
```

### Opción 2: Script Automático (Linux/Mac)
```bash
chmod +x setup-docker.sh
./setup-docker.sh
```

### Opción 3: Configuración Manual

1. **Clonar y configurar entorno:**
```bash
# Copiar archivo de entorno
cp .env.example .env

# Editar .env con la configuración para Docker:
DB_HOST=mysql
DB_DATABASE=inmotable_db
DB_USERNAME=inmotable_user
DB_PASSWORD=inmotable_password
APP_URL=http://localhost:8080
```

2. **Levantar contenedores:**
```bash
docker-compose up -d --build
```

3. **Instalar Laravel Passport:**
```bash
docker-compose exec app composer require laravel/passport
```

4. **Configurar Laravel:**
```bash
# Generar clave de aplicación
docker-compose exec app php artisan key:generate

# Ejecutar migraciones
docker-compose exec app php artisan migrate

# Instalar Passport
docker-compose exec app php artisan passport:install
```

## URLs de Acceso

- **Aplicación Laravel:** http://localhost:8080
- **phpMyAdmin:** http://localhost:8081
- **MySQL:** localhost:3306

## Credenciales de Base de Datos

- **Host:** mysql (interno) / localhost:3306 (externo)
- **Base de datos:** inmotable_db
- **Usuario:** inmotable_user
- **Contraseña:** inmotable_password
- **Root password:** root_password

## Configuración de Laravel Passport para Angular

### 1. Configurar Passport en Laravel

Después de ejecutar `passport:install`, agregar en `app/Http/Kernel.php`:

```php
'api' => [
    \Laravel\Passport\Http\Middleware\CheckClientCredentials::class,
],
```

### 2. Configurar modelo User

En `app/Models/User.php`:
```php
use Laravel\Passport\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
    // ...
}
```

### 3. Configurar AuthServiceProvider

En `app/Providers/AuthServiceProvider.php`:
```php
use Laravel\Passport\Passport;

public function boot()
{
    $this->registerPolicies();
    Passport::routes();
}
```

### 4. Configurar auth.php

En `config/auth.php`:
```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
    'api' => [
        'driver' => 'passport',
        'provider' => 'users',
    ],
],
```

### 5. Configurar CORS para Angular

Instalar Laravel CORS:
```bash
docker-compose exec app composer require fruitcake/laravel-cors
```

En `config/cors.php`:
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['http://localhost:4200'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
```

## Comandos Útiles

### Gestión de Contenedores
```bash
# Iniciar contenedores
docker-compose up -d

# Detener contenedores
docker-compose down

# Ver logs
docker-compose logs -f

# Reiniciar un servicio específico
docker-compose restart app
```

### Laravel Artisan
```bash
# Ejecutar migraciones
docker-compose exec app php artisan migrate

# Crear nueva migración
docker-compose exec app php artisan make:migration create_properties_table

# Crear controlador
docker-compose exec app php artisan make:controller PropertyController

# Crear modelo
docker-compose exec app php artisan make:model Property

# Limpiar cache
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan config:clear
```

### Composer
```bash
# Instalar dependencias
docker-compose exec app composer install

# Actualizar dependencias
docker-compose exec app composer update

# Agregar nueva dependencia
docker-compose exec app composer require package/name
```

## Rutas API Ejemplo

### Autenticación
```
POST /api/register    - Registrar usuario
POST /api/login       - Iniciar sesión
POST /api/logout      - Cerrar sesión
GET  /api/user        - Obtener usuario autenticado
```

### Ejemplo de uso desde Angular
```typescript
// Servicio de autenticación
login(credentials: any) {
  return this.http.post('http://localhost:8080/api/login', credentials);
}

// Headers para requests autenticados
const headers = {
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};
```

## Solución de Problemas

### Error de permisos
```bash
docker-compose exec app chown -R www-data:www-data /var/www/html/storage
docker-compose exec app chown -R www-data:www-data /var/www/html/bootstrap/cache
```

### Error de clave de aplicación
```bash
docker-compose exec app php artisan key:generate
```

### Error de conexión a base de datos
- Verificar que el contenedor MySQL esté ejecutándose: `docker-compose ps`
- Verificar logs de MySQL: `docker-compose logs mysql`

### Reconstruir contenedores completamente
```bash
docker-compose down -v
docker-compose up -d --build
```

## Estructura de Archivos Docker

```
backend/
├── docker-compose.yml           # Configuración principal
├── Dockerfile                   # Imagen PHP-FPM personalizada
├── docker/
│   ├── nginx/
│   │   └── default.conf        # Configuración Nginx
│   ├── php/
│   │   └── local.ini           # Configuración PHP
│   └── mysql/
│       └── init.sql            # Script inicialización MySQL
├── setup-docker.sh             # Script setup Linux/Mac
└── setup-docker.ps1            # Script setup Windows
```

## Notas Importantes

- Los datos de MySQL se persisten en un volumen Docker
- Los archivos de Laravel se montan como volumen para desarrollo
- El puerto 8080 debe estar libre en tu máquina
- Para producción, cambiar las contraseñas y configuraciones de seguridad 