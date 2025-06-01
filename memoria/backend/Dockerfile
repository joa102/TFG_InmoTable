# Etapa 1: imagen base con PHP y extensiones necesarias
FROM php:8.1-apache

# Instalar extensiones requeridas (pdo, etc.)
RUN docker-php-ext-install pdo pdo_mysql

# Activar mod_rewrite
RUN a2enmod rewrite

# Copiamos el contenido de Laravel al directorio de Apache
COPY . /var/www/html

# Ajustamos permisos
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Configurar DocumentRoot para Laravel
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf

# Exponer el puerto 80
EXPOSE 80

# Ejecutar Apache
CMD ["apache2-foreground"]
