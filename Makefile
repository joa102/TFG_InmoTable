# InmoTable - Makefile para automatización completa del entorno
# ===========================================================

# Variables de configuración
DOCKER_COMPOSE = docker-compose
BACKEND_DIR = backend
FRONTEND_DIR = frontend
NODE_VERSION = 18

# Colores para output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m # No Color

# Comando por defecto
.DEFAULT_GOAL := help

# ===========================================================
# COMANDOS PRINCIPALES
# ===========================================================

.PHONY: setup
setup: ## Configuración completa del proyecto (backend + frontend)
	@echo "$(GREEN)🚀 Configurando proyecto InmoTable completo...$(NC)"
	@$(MAKE) setup-backend
	@$(MAKE) setup-frontend
	@echo "$(GREEN)✅ ¡Configuración completada!$(NC)"
	@$(MAKE) info

.PHONY: start
start: ## Iniciar todo el entorno (backend + frontend)
	@echo "$(GREEN)🚀 Iniciando entorno completo...$(NC)"
	@$(MAKE) start-backend
	@$(MAKE) start-frontend

.PHONY: stop
stop: ## Detener todo el entorno
	@echo "$(YELLOW)🛑 Deteniendo entorno...$(NC)"
	@$(MAKE) stop-backend
	@$(MAKE) stop-frontend

.PHONY: restart
restart: ## Reiniciar todo el entorno
	@$(MAKE) stop
	@$(MAKE) start

# ===========================================================
# CONFIGURACIÓN INICIAL
# ===========================================================

.PHONY: setup-backend
setup-backend: ## Configurar backend Laravel con Docker
	@echo "$(BLUE)📦 Configurando backend Laravel...$(NC)"
	@cd $(BACKEND_DIR) && if [ ! -f .env ]; then \
		echo "$(YELLOW)📄 Copiando archivo .env...$(NC)"; \
		cp .env.example .env; \
		powershell -Command "(Get-Content '.env') -replace 'DB_HOST=127.0.0.1', 'DB_HOST=mysql' | Set-Content '.env'"; \
		powershell -Command "(Get-Content '.env') -replace 'DB_DATABASE=laravel', 'DB_DATABASE=inmotable_db' | Set-Content '.env'"; \
		powershell -Command "(Get-Content '.env') -replace 'DB_USERNAME=root', 'DB_USERNAME=inmotable_user' | Set-Content '.env'"; \
		powershell -Command "(Get-Content '.env') -replace 'DB_PASSWORD=', 'DB_PASSWORD=inmotable_password' | Set-Content '.env'"; \
		powershell -Command "(Get-Content '.env') -replace 'APP_URL=http://localhost', 'APP_URL=http://localhost:8080' | Set-Content '.env'"; \
	fi
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) up -d --build
	@echo "$(YELLOW)⏳ Esperando a que los servicios estén listos...$(NC)"
	@sleep 30
	@$(MAKE) install-passport
	@$(MAKE) setup-laravel

.PHONY: setup-frontend
setup-frontend: ## Configurar frontend Angular
	@echo "$(BLUE)🅰️ Configurando frontend Angular...$(NC)"
	@if [ ! -d "$(FRONTEND_DIR)" ]; then \
		echo "$(RED)❌ Directorio frontend no encontrado. Creando proyecto Angular...$(NC)"; \
		npx @angular/cli@latest new $(FRONTEND_DIR) --routing --style=scss --package-manager=npm; \
	fi
	@cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)✅ Frontend configurado$(NC)"

.PHONY: install-passport
install-passport: ## Instalar y configurar Laravel Passport
	@echo "$(BLUE)🔐 Instalando Laravel Passport...$(NC)"
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec -T app composer require laravel/passport
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec -T app php artisan key:generate
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec -T app php artisan migrate
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec -T app php artisan passport:install --force
	@echo "$(GREEN)✅ Passport instalado y configurado$(NC)"

.PHONY: setup-laravel
setup-laravel: ## Configuración adicional de Laravel
	@echo "$(BLUE)⚙️ Configurando Laravel...$(NC)"
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec -T app composer require fruitcake/laravel-cors
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec -T app php artisan config:cache
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec -T app chown -R www-data:www-data /var/www/html/storage
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec -T app chown -R www-data:www-data /var/www/html/bootstrap/cache
	@echo "$(GREEN)✅ Laravel configurado$(NC)"

# ===========================================================
# COMANDOS DE INICIO Y PARADA
# ===========================================================

.PHONY: start-backend
start-backend: ## Iniciar solo el backend
	@echo "$(BLUE)🐘 Iniciando backend...$(NC)"
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✅ Backend iniciado en http://localhost:8080$(NC)"

.PHONY: start-frontend
start-frontend: ## Iniciar solo el frontend
	@echo "$(BLUE)🅰️ Iniciando frontend...$(NC)"
	@cd $(FRONTEND_DIR) && npm start &
	@echo "$(GREEN)✅ Frontend iniciado en http://localhost:4200$(NC)"

.PHONY: stop-backend
stop-backend: ## Detener solo el backend
	@echo "$(YELLOW)🛑 Deteniendo backend...$(NC)"
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) down

.PHONY: stop-frontend
stop-frontend: ## Detener solo el frontend
	@echo "$(YELLOW)🛑 Deteniendo frontend...$(NC)"
	@pkill -f "ng serve" || true
	@pkill -f "node.*angular" || true

# ===========================================================
# COMANDOS DE DESARROLLO
# ===========================================================

.PHONY: dev
dev: ## Modo desarrollo (backend + frontend con recarga automática)
	@echo "$(GREEN)🔄 Iniciando modo desarrollo...$(NC)"
	@$(MAKE) start-backend
	@cd $(FRONTEND_DIR) && npm run start &
	@echo "$(GREEN)✅ Modo desarrollo activo$(NC)"
	@echo "$(BLUE)📱 Frontend: http://localhost:4200$(NC)"
	@echo "$(BLUE)🔙 Backend API: http://localhost:8080/api$(NC)"
	@echo "$(BLUE)🗄️ phpMyAdmin: http://localhost:8081$(NC)"

.PHONY: logs
logs: ## Ver logs de todos los servicios
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) logs -f

.PHONY: logs-backend
logs-backend: ## Ver logs solo del backend
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) logs -f app nginx

.PHONY: logs-db
logs-db: ## Ver logs de la base de datos
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) logs -f mysql

# ===========================================================
# COMANDOS DE BASE DE DATOS
# ===========================================================

.PHONY: db-migrate
db-migrate: ## Ejecutar migraciones de Laravel
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec app php artisan migrate

.PHONY: db-seed
db-seed: ## Ejecutar seeders de Laravel
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec app php artisan db:seed

.PHONY: db-fresh
db-fresh: ## Recrear base de datos con migraciones y seeders
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec app php artisan migrate:fresh --seed

.PHONY: db-shell
db-shell: ## Acceder a shell de MySQL
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec mysql mysql -u inmotable_user -pinmotable_password inmotable_db

# ===========================================================
# COMANDOS DE LARAVEL
# ===========================================================

.PHONY: artisan
artisan: ## Ejecutar comando artisan (uso: make artisan CMD="make:controller TestController")
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec app php artisan $(CMD)

.PHONY: composer
composer: ## Ejecutar comando composer (uso: make composer CMD="require package/name")
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec app composer $(CMD)

.PHONY: shell-backend
shell-backend: ## Acceder al shell del contenedor backend
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec app bash

# ===========================================================
# COMANDOS DE ANGULAR
# ===========================================================

.PHONY: ng
ng: ## Ejecutar comando Angular CLI (uso: make ng CMD="generate component test")
	@cd $(FRONTEND_DIR) && npx ng $(CMD)

.PHONY: npm
npm: ## Ejecutar comando npm en frontend (uso: make npm CMD="install package")
	@cd $(FRONTEND_DIR) && npm $(CMD)

.PHONY: build-frontend
build-frontend: ## Compilar frontend para producción
	@cd $(FRONTEND_DIR) && npm run build

# ===========================================================
# COMANDOS DE LIMPIEZA
# ===========================================================

.PHONY: clean
clean: ## Limpiar todo el entorno
	@echo "$(YELLOW)🧹 Limpiando entorno...$(NC)"
	@$(MAKE) stop
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) down -v
	@docker system prune -f
	@echo "$(GREEN)✅ Entorno limpiado$(NC)"

.PHONY: clean-backend
clean-backend: ## Limpiar solo backend
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) down -v
	@docker system prune -f

.PHONY: clean-frontend
clean-frontend: ## Limpiar solo frontend
	@cd $(FRONTEND_DIR) && rm -rf node_modules package-lock.json
	@cd $(FRONTEND_DIR) && npm install

# ===========================================================
# COMANDOS DE INFORMACIÓN
# ===========================================================

.PHONY: status
status: ## Ver estado de todos los servicios
	@echo "$(BLUE)📊 Estado de los servicios:$(NC)"
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) ps
	@echo ""
	@ps aux | grep -E "(ng serve|node.*angular)" | grep -v grep || echo "$(YELLOW)Frontend no está ejecutándose$(NC)"

.PHONY: info
info: ## Mostrar información del proyecto
	@echo "$(GREEN)📋 InmoTable - Información del Proyecto$(NC)"
	@echo "$(BLUE)================================$(NC)"
	@echo "$(YELLOW)🔙 Backend (Laravel + API):$(NC) http://localhost:8080"
	@echo "$(YELLOW)🅰️ Frontend (Angular):$(NC)     http://localhost:4200"
	@echo "$(YELLOW)🗄️ phpMyAdmin:$(NC)             http://localhost:8081"
	@echo "$(YELLOW)🐬 MySQL:$(NC)                  localhost:3306"
	@echo ""
	@echo "$(BLUE)📊 Credenciales de BD:$(NC)"
	@echo "$(YELLOW)- Base de datos:$(NC) inmotable_db"
	@echo "$(YELLOW)- Usuario:$(NC)       inmotable_user"
	@echo "$(YELLOW)- Contraseña:$(NC)    inmotable_password"
	@echo ""
	@echo "$(BLUE)🚀 Comandos útiles:$(NC)"
	@echo "$(YELLOW)- make dev$(NC)       Modo desarrollo completo"
	@echo "$(YELLOW)- make logs$(NC)      Ver logs en tiempo real"
	@echo "$(YELLOW)- make status$(NC)    Ver estado de servicios"
	@echo "$(YELLOW)- make clean$(NC)     Limpiar todo el entorno"

.PHONY: help
help: ## Mostrar ayuda de comandos disponibles
	@echo "$(GREEN)InmoTable - Comandos Disponibles$(NC)"
	@echo "$(BLUE)===============================$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

# ===========================================================
# COMANDOS DE TESTING
# ===========================================================

.PHONY: test
test: ## Ejecutar tests completos (backend + frontend)
	@$(MAKE) test-backend
	@$(MAKE) test-frontend

.PHONY: test-backend
test-backend: ## Ejecutar tests del backend
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec app php artisan test

.PHONY: test-frontend
test-frontend: ## Ejecutar tests del frontend
	@cd $(FRONTEND_DIR) && npm run test

# ===========================================================
# COMANDOS DE PRODUCCIÓN
# ===========================================================

.PHONY: build
build: ## Compilar para producción
	@echo "$(BLUE)🏗️ Compilando para producción...$(NC)"
	@$(MAKE) build-frontend
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec app php artisan config:cache
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec app php artisan route:cache
	@cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) exec app php artisan view:cache
	@echo "$(GREEN)✅ Compilación completada$(NC)" 