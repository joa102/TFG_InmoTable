<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\CitaController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\AgenteController;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes - Sistema de Autenticación con Laravel Passport
| - Autenticación: Laravel Passport (MySQL/SQLite)
| - Gestión de usuarios: Base de datos local
|--------------------------------------------------------------------------
*/

// 🔥 RUTAS DE AUTENTICACIÓN (Laravel Passport)
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:api');
    Route::get('user', [AuthController::class, 'user'])->middleware('auth:api');
});

// 🔥 RUTAS PÚBLICAS
Route::apiResource('propiedades', PropertyController::class)->only(['index', 'show']);

// 🔥 RUTAS PROTEGIDAS (requieren autenticación Laravel Passport)
Route::middleware('auth:api')->group(function () {

    // Gestión completa de propiedades para admin/agentes
    Route::apiResource('propiedades', PropertyController::class)->except(['index', 'show']);

    // Gestión de citas
    Route::apiResource('citas', CitaController::class);
    Route::post('citas/{cita}/confirmar', [CitaController::class, 'confirmar']);
    Route::post('citas/{cita}/cancelar', [CitaController::class, 'cancelar']);

    // Gestión de clientes
    Route::apiResource('clientes', ClienteController::class);
    Route::get('clientes/{cliente}/propiedades-interes', [ClienteController::class, 'propiedadesInteres']);
    Route::post('clientes/{cliente}/agregar-interes/{propiedad}', [ClienteController::class, 'agregarInteres']);
    Route::delete('clientes/{cliente}/quitar-interes/{propiedad}', [ClienteController::class, 'quitarInteres']);

    // Gestión de agentes
    Route::apiResource('agentes', AgenteController::class);
    Route::get('agentes/{agente}/clientes', [AgenteController::class, 'clientes']);

    // Rutas específicas para usuarios logueados
    Route::get('mis-citas', [CitaController::class, 'misCitas']);
    Route::get('mis-propiedades-interes', [ClienteController::class, 'misPropiedadesInteres']);
});

// 🔥 RUTAS DE CONTACTO (públicas)
Route::post('contacto', [PropertyController::class, 'enviarContacto']);
Route::post('solicitar-cita', [CitaController::class, 'solicitarCita']);
