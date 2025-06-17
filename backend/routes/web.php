<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\PropiedadesController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\EmpresaController; // 🔥 VERIFICAR QUE ESTÉ IMPORTADO

// ===============================
// 🏠 RUTA PRINCIPAL
// ===============================
Route::get('/', function () {
    return view('welcome');
});

// ===============================
// 🔐 RUTAS DE API
// ===============================
Route::prefix('api')->group(function () {
    // ===============================
    // 🔓 RUTAS PÚBLICAS (SIN AUTH)
    // ===============================

    // Autenticación
    /*Route::post('/login', [LoginController::class, 'login']);
    Route::post('/register', [LoginController::class, 'register']);*/

    // 🏢 EMPRESAS (PÚBLICAS) - 🔥 AÑADIR ESTAS RUTAS
    Route::get('/empresas', [EmpresaController::class, 'index']); // Listar empresas
    Route::get('/empresas/{id}', [EmpresaController::class, 'show']); // Ver empresa específica

    // 🏠 PROPIEDADES (PÚBLICAS)
    /*Route::get('/propiedades', [PropiedadesController::class, 'index']); // Listar propiedades
    Route::get('/propiedades/{id}', [PropiedadesController::class, 'show']); // Ver propiedad*/
    Route::get('/propiedades', [PropertyController::class, 'index']); // Listar propiedades
    Route::get('/propiedades/{id}', [PropertyController::class, 'show']); // Ver propiedad

    // ===============================
    // 🔒 RUTAS PROTEGIDAS (REQUIEREN AUTH)
    // ===============================
    Route::middleware('auth:sanctum')->group(function () {
        // Autenticación
        /*Route::post('/logout', [LoginController::class, 'logout']);
        Route::get('/user', [LoginController::class, 'user']);*/

        // 🔒 EMPRESAS (SOLO ADMIN)
        Route::middleware('check.role:admin')->group(function () {
            Route::post('/empresas', [EmpresaController::class, 'store']); // Crear empresa
            Route::put('/empresas/{id}', [EmpresaController::class, 'update']); // Actualizar empresa
            Route::delete('/empresas/{id}', [EmpresaController::class, 'destroy']); // Eliminar empresa
        });

        // 🔒 PROPIEDADES (ADMIN/AGENTE)
        /*Route::middleware('check.role:admin,agente')->group(function () {
            //Route::post('/propiedades', [PropiedadesController::class, 'store']);
            //Route::put('/propiedades/{id}', [PropiedadesController::class, 'update']);
            //Route::delete('/propiedades/{id}', [PropiedadesController::class, 'destroy']);
            Route::post('/propiedades', [PropertyController::class, 'store']);
            Route::put('/propiedades/{id}', [PropertyController::class, 'update']);
            Route::delete('/propiedades/{id}', [PropertyController::class, 'destroy']);
        });*/

        // 🔒 USUARIOS (ADMIN)
        /*Route::middleware('check.role:admin')->group(function () {
            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store']);
            Route::put('/users/{id}', [UserController::class, 'update']);
            Route::delete('/users/{id}', [UserController::class, 'destroy']);
        });*/
    });
});
