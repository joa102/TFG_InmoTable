# 🏠 InmoTable - Sistema Inmobiliario

**InmoTable** es un sistema de gestión inmobiliaria desarrollado con **Laravel 9 + Vue.js + MySQL**.

## 📋 **Requisitos del Sistema**

- **Docker** y **Docker Compose**
- **Git**
- **Node.js** (v16 o superior)
- **Composer** (incluido en Docker)

## 🚀 **Instalación desde Cero**

### **1. 📥 Clonar el Repositorio**

```bash
git clone https://github.com/tu-usuario/TFG_InmoTable.git
cd TFG_InmoTable
```

### **2. 🐳 Configurar Docker**

```bash
# Construir e iniciar los contenedores
docker-compose up -d --build

# Verificar que los contenedores están corriendo
docker-compose ps
```

### **3. ⚙️ Configurar el Backend (Laravel)**

```bash
# Entrar al directorio backend
cd backend

# Instalar dependencias de Laravel
docker-compose exec app composer install

# Generar clave de aplicación
docker-compose exec app php artisan key:generate

# Configurar base de datos - ejecutar migraciones
docker-compose exec app php artisan migrate

# Instalar Laravel Passport para autenticación
docker-compose exec app php artisan passport:install --force
```

### **4. 👥 Crear Usuarios de Prueba**

```bash
# Ejecutar seeder para crear usuarios de prueba
docker-compose exec app php artisan db:seed --class=UserSeeder
```

**Usuarios creados:**
- **Admin**: `admin@inmotable.com` / `password123`
- **Agente**: `agente@inmotable.com` / `password123`  
- **Cliente**: `cliente@inmotable.com` / `password123`
- **Test**: `test@inmotable.com` / `password123`

### **5. 🎨 Configurar el Frontend (Vue.js)**

```bash
# Ir al directorio frontend
cd ../frontend

# Instalar dependencias de Node.js
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

### **6. 🌐 Acceder a la Aplicación**

- **🖥️ Frontend (Vue.js)**: http://localhost:3000
- **🔧 Backend API (Laravel)**: http://localhost:8080
- **🗄️ Base de datos (MySQL)**: localhost:3306

## 🔑 **API de Autenticación**

### **Endpoints Principales:**

```bash
POST /api/auth/register  # Registrar usuario
POST /api/auth/login     # Iniciar sesión
POST /api/auth/logout    # Cerrar sesión
GET  /api/auth/user      # Obtener usuario autenticado
```

### **🧪 Probar la API**

#### **Login con CURL:**
```bash
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "test@inmotable.com",
    "password": "password123"
  }'
```

#### **Login con PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email": "test@inmotable.com", "password": "password123"}'
```

#### **Respuesta esperada:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": 4,
      "name": "Usuario Prueba",
      "email": "test@inmotable.com",
      "role": "cliente"
    },
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "Bearer"
  }
}
```

#### **Usar el token:**
```bash
curl -X GET "http://localhost:8080/api/auth/user" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Accept: application/json"
```

## 📂 **Estructura del Proyecto**

```
TFG_InmoTable/
├── backend/                 # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   └── ...
│   ├── routes/api.php       # Rutas de la API
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── ...
├── frontend/                # Vue.js SPA
│   ├── src/
│   ├── package.json
│   └── ...
├── docker-compose.yml       # Configuración Docker
└── README.md               # Este archivo
```

## 🔧 **Comandos Útiles**

### **Backend (Laravel):**
```bash
# Ver rutas disponibles
docker-compose exec app php artisan route:list

# Limpiar cache
docker-compose exec app php artisan config:clear
docker-compose exec app php artisan cache:clear

# Ejecutar migraciones
docker-compose exec app php artisan migrate

# Ejecutar seeders
docker-compose exec app php artisan db:seed

# Acceder a Tinker (consola Laravel)
docker-compose exec app php artisan tinker
```

### **Frontend (Vue.js):**
```bash
# Servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

### **Docker:**
```bash
# Iniciar contenedores
docker-compose up -d

# Parar contenedores
docker-compose down

# Ver logs
docker-compose logs -f app

# Reconstruir contenedores
docker-compose up -d --build
```

## 🛠️ **Tecnologías Utilizadas**

### **Backend:**
- **Laravel 9** - Framework PHP
- **Laravel Passport** - Autenticación OAuth2/JWT
- **MySQL** - Base de datos
- **Docker** - Contenedorización

### **Frontend:**
- **Vue.js 3** - Framework JavaScript
- **Vite** - Build tool
- **Tailwind CSS** - Framework CSS
- **Axios** - Cliente HTTP

## 🐛 **Solución de Problemas**

### **Puerto 8080 ocupado:**
```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "8081:80"  # Usar puerto 8081 en lugar de 8080
```

### **Permisos en Linux/macOS:**
```bash
sudo chown -R $USER:$USER backend/storage
sudo chmod -R 775 backend/storage
```

### **Regenerar claves Passport:**
```bash
docker-compose exec app php artisan passport:keys --force
```

## 📝 **Variables de Entorno**

El archivo `.env` en `backend/` debe contener:

```env
APP_NAME=InmoTable
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://localhost:8080

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=inmotable
DB_USERNAME=root
DB_PASSWORD=root_password
```

## 🤝 **Contribuir**

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT - mira el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 **Autor**

**Tu Nombre** - [tu-email@ejemplo.com](mailto:tu-email@ejemplo.com)

---

⭐ **¡No olvides dar una estrella al proyecto si te ha sido útil!**