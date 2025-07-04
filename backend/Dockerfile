# Cambiar de PHP-FPM a PHP con servidor incorporado
FROM php:8.1-cli

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-install \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Establecer directorio de trabajo
WORKDIR /var/www/html

# Copiar composer files primero
COPY composer*.json ./

# Instalar dependencias de PHP
RUN composer install --no-dev --optimize-autoloader

# Copiar archivos de la aplicación
COPY . .

# Crear directorios necesarios
RUN mkdir -p storage/logs \
    && mkdir -p storage/framework/cache \
    && mkdir -p storage/framework/sessions \
    && mkdir -p storage/framework/views \
    && mkdir -p bootstrap/cache

# Establecer permisos
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Crear health check
RUN echo '<?php echo json_encode(["status" => "OK", "timestamp" => date("Y-m-d H:i:s")]); ?>' > public/health.php

# Exponer puerto (Railway asignará automáticamente)
EXPOSE 8000

# Comando para servir Laravel
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
