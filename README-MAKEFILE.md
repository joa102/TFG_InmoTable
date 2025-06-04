# InmoTable - Guía del Makefile

## 🚀 Inicio Rápido

### Configuración inicial completa (Una sola vez)
```bash
make setup
```
Este comando configura automáticamente:
- ✅ Backend Laravel con Docker (PHP 8.1 + nginx + MySQL)
- ✅ Laravel Passport para autenticación API
- ✅ Frontend Angular (si no existe)
- ✅ Todas las dependencias

### Iniciar desarrollo
```bash
make dev
```
Esto inicia:
- 🔙 Backend API en http://localhost:8080
- 🅰️ Frontend en http://localhost:4200
- 🗄️ phpMyAdmin en http://localhost:8081

## 📋 Comandos Principales

| Comando | Descripción |
|---------|-------------|
| `make setup` | Configuración inicial completa |
| `make dev` | Modo desarrollo (backend + frontend) |
| `make start` | Iniciar todo el entorno |
| `make stop` | Detener todo |
| `make restart` | Reiniciar servicios |
| `make status` | Ver estado de servicios |
| `make info` | Información del proyecto |
| `make help` | Ver todos los comandos |

## 🔧 Comandos por Componente

### Backend (Laravel + Docker)
```bash
make start-backend      # Solo backend
make stop-backend       # Detener backend
make logs-backend       # Ver logs backend
make shell-backend      # Acceder al contenedor
```

### Frontend (Angular)
```bash
make start-frontend     # Solo frontend
make stop-frontend      # Detener frontend
make build-frontend     # Compilar para producción
```

### Base de Datos
```bash
make db-migrate         # Ejecutar migraciones
make db-seed           # Ejecutar seeders
make db-fresh          # Recrear BD completa
make db-shell          # Acceder a MySQL shell
```

## 🛠️ Comandos de Desarrollo

### Laravel Artisan
```bash
make artisan CMD="make:controller UserController"
make artisan CMD="make:model Property -m"
make artisan CMD="make:seeder PropertySeeder"
```

### Composer
```bash
make composer CMD="require package/name"
make composer CMD="update"
make composer CMD="install"
```

### Angular CLI
```bash
make ng CMD="generate component property-list"
make ng CMD="generate service auth"
make ng CMD="generate guard auth"
```

### NPM
```bash
make npm CMD="install @angular/material"
make npm CMD="update"
```

## 📊 Monitoreo y Logs

```bash
make logs              # Ver todos los logs
make logs-backend      # Solo logs del backend
make logs-db           # Solo logs de MySQL
make status            # Estado de servicios
```

## 🧹 Limpieza

```bash
make clean             # Limpiar todo (cuidado!)
make clean-backend     # Solo backend
make clean-frontend    # Solo frontend
```

## 🧪 Testing

```bash
make test              # Tests completos
make test-backend      # Solo tests Laravel
make test-frontend     # Solo tests Angular
```

## 🏗️ Producción

```bash
make build             # Compilar para producción
```

## 📍 URLs del Proyecto

- **Frontend Angular**: http://localhost:4200
- **Backend API**: http://localhost:8080/api
- **phpMyAdmin**: http://localhost:8081
- **MySQL**: localhost:3306

## 🔑 Credenciales de Base de Datos

```
Host: localhost:3306
Base de datos: inmotable_db
Usuario: inmotable_user
Contraseña: inmotable_password
Root password: root_password
```

## 🔄 Flujo de Trabajo Típico

### Primera vez:
```bash
make setup    # Configurar todo
make dev      # Iniciar desarrollo
```

### Desarrollo diario:
```bash
make start    # Iniciar servicios
# Trabajar...
make stop     # Detener al final del día
```

### Crear nuevo componente:
```bash
make ng CMD="generate component property-card"
make artisan CMD="make:controller PropertyController --api"
```

### Actualizar base de datos:
```bash
make artisan CMD="make:migration add_price_to_properties"
make db-migrate
```

## ⚠️ Solución de Problemas

### Si los contenedores no se levantan:
```bash
make clean-backend
make setup-backend
```

### Si hay problemas con dependencias:
```bash
make clean-frontend
make setup-frontend
```

### Si hay problemas con permisos:
```bash
make artisan CMD="storage:link"
make shell-backend
# Dentro del contenedor:
chown -R www-data:www-data storage bootstrap/cache
```

### Si hay problemas con la base de datos:
```bash
make db-fresh
```

## 📝 Notas Importantes

1. **Primera ejecución**: `make setup` puede tardar varios minutos
2. **Docker**: Asegúrate de que Docker Desktop esté ejecutándose
3. **Node.js**: Necesitas Node.js 18+ para Angular
4. **Puertos**: Asegúrate de que los puertos 3306, 4200, 8080 y 8081 estén libres
5. **Windows**: El Makefile está optimizado para Windows con PowerShell

## 🆘 Obtener Ayuda

```bash
make help              # Ver todos los comandos
make info              # Información del proyecto
make status            # Estado actual
``` 