-- Script de inicialización para MySQL
-- Configuraciones adicionales para el proyecto InmoTable

-- Establecer el charset por defecto
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Crear la base de datos si no existe (ya se hace en docker-compose)
-- CREATE DATABASE IF NOT EXISTS inmotable_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE inmotable_db;

-- Configuraciones específicas de MySQL para Laravel
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';

-- Configurar timezone
SET time_zone = '+01:00';

-- Mensaje de confirmación
SELECT 'Base de datos InmoTable inicializada correctamente' as Status; 