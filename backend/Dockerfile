# Usar PHP con Apache para mejor compatibilidad con Render
FROM php:8.1-apache

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
    zip \
    && a2enmod rewrite \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configurar Apache para Laravel
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!/var/www/html/public!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Establecer directorio de trabajo
WORKDIR /var/www/html

# Copiar composer files primero
COPY composer*.json ./

# Instalar dependencias de PHP
RUN composer install --no-dev --optimize-autoloader --no-scripts

# Copiar archivos de la aplicación
COPY . .

# Completar instalación de Composer
RUN composer dump-autoload --optimize

# Crear directorios necesarios
RUN mkdir -p storage/logs \
    && mkdir -p storage/framework/cache \
    && mkdir -p storage/framework/sessions \
    && mkdir -p storage/framework/views \
    && mkdir -p bootstrap/cache

# Establecer permisos
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod -R 775 storage \
    && chmod -R 775 bootstrap/cache

# Crear health check
RUN echo '<?php echo json_encode(["status" => "OK", "app" => "InmoTable", "timestamp" => date("Y-m-d H:i:s")]); ?>' > public/health.php

# Script de inicio que usa el puerto de Render
COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Exponer puerto 80 (Apache)
EXPOSE 80

# Comando de inicio
CMD ["/usr/local/bin/start.sh"]
