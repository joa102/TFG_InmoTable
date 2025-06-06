<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\CitaController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\AgenteController;

/*
|--------------------------------------------------------------------------
| API Routes - SOLO AIRTABLE DATA
| Sin autenticación Laravel - Frontend maneja login falso
|--------------------------------------------------------------------------
*/

// 🔥 RUTAS PÚBLICAS (Airtable data) - SIN AUTENTICACIÓN
Route::prefix('propiedades')->group(function () {
    Route::get('/', [PropertyController::class, 'index']);
    Route::get('/{id}', [PropertyController::class, 'show']);
    Route::get('/{id}/similar', [PropertyController::class, 'getSimilar']);
    Route::post('/', [PropertyController::class, 'store']);
    Route::put('/{id}', [PropertyController::class, 'update']);
    Route::delete('/{id}', [PropertyController::class, 'destroy']);
});

Route::prefix('citas')->group(function () {
    Route::get('/', [CitaController::class, 'index']);
    Route::get('/{id}', [CitaController::class, 'show']);
    Route::post('/', [CitaController::class, 'store']);
    Route::put('/{id}', [CitaController::class, 'update']);
    Route::delete('/{id}', [CitaController::class, 'destroy']);
});

Route::prefix('clientes')->group(function () {
    Route::get('/', [ClienteController::class, 'index']);
    Route::get('/{id}', [ClienteController::class, 'show']);
    Route::post('/', [ClienteController::class, 'store']);
    Route::put('/{id}', [ClienteController::class, 'update']);
    Route::delete('/{id}', [ClienteController::class, 'destroy']);
    Route::get('/{id}/propiedades-interes', [ClienteController::class, 'propiedadesInteres']);
    Route::post('/{id}/agregar-interes', [ClienteController::class, 'agregarInteres']);
    Route::post('/{id}/quitar-interes', [ClienteController::class, 'quitarInteres']);
    Route::get('/buscar', [ClienteController::class, 'buscar']);
});

Route::prefix('agentes')->group(function () {
    Route::get('/', [AgenteController::class, 'index']);
    Route::get('/{id}', [AgenteController::class, 'show']);
    Route::post('/', [AgenteController::class, 'store']);
    Route::put('/{id}', [AgenteController::class, 'update']);
    Route::delete('/{id}', [AgenteController::class, 'destroy']);
    Route::get('/{id}/clientes', [AgenteController::class, 'getClientes']);
    Route::post('/{id}/asignar-cliente', [AgenteController::class, 'asignarCliente']);
    Route::post('/{id}/quitar-cliente', [AgenteController::class, 'quitarCliente']);
});

// 🔥 RUTA DE HEALTH CHECK
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'API funcionando correctamente - Solo datos de Airtable',
        'timestamp' => now()->toISOString(),
        'frontend_auth' => 'Login falso en Angular'
    ]);
});
