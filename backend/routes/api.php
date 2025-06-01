<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\CitaController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\AgenteController;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes - ARQUITECTURA HÍBRIDA
| - Autenticación: Laravel (SQLite)
| - Datos: Airtable
|--------------------------------------------------------------------------
*/

// 🔥 RUTAS DE AUTENTICACIÓN (Laravel SQLite)
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('user', [AuthController::class, 'user'])->middleware('auth:sanctum');
    Route::post('sync', [AuthController::class, 'syncWithAirtable'])->middleware('auth:sanctum');
});

// 🔥 RUTAS PÚBLICAS (Airtable data)
Route::apiResource('propiedades', PropertyController::class)->only(['index', 'show']);

// 🔥 RUTAS PROTEGIDAS (requieren autenticación Laravel)
Route::middleware('auth:sanctum')->group(function () {

    // Gestión completa de propiedades para admin/agentes
    Route::apiResource('propiedades', PropertyController::class)->except(['index', 'show']);

    // Gestión de citas (Airtable)
    Route::apiResource('citas', CitaController::class);
    Route::post('citas/{cita}/confirmar', [CitaController::class, 'confirmar']);
    Route::post('citas/{cita}/cancelar', [CitaController::class, 'cancelar']);

    // Gestión de clientes (Airtable)
    Route::apiResource('clientes', ClienteController::class);
    Route::get('clientes/{cliente}/propiedades-interes', [ClienteController::class, 'propiedadesInteres']);
    Route::post('clientes/{cliente}/agregar-interes/{propiedad}', [ClienteController::class, 'agregarInteres']);
    Route::delete('clientes/{cliente}/quitar-interes/{propiedad}', [ClienteController::class, 'quitarInteres']);

    // Gestión de agentes (Airtable)
    Route::apiResource('agentes', AgenteController::class);
    Route::get('agentes/{agente}/clientes', [AgenteController::class, 'clientes']);

    // Rutas específicas para usuarios logueados
    Route::get('mis-citas', [CitaController::class, 'misCitas']);
    Route::get('mis-propiedades-interes', [ClienteController::class, 'misPropiedadesInteres']);
});

// 🔥 RUTAS DE CONTACTO (públicas - Airtable)
Route::post('contacto', [PropertyController::class, 'enviarContacto']);
Route::post('solicitar-cita', [CitaController::class, 'solicitarCita']);
