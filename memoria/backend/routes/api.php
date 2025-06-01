<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\PropertyController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Define una constante para la ruta base de propiedades
const PROPIEDADES_BASE = '/propiedades';

Route::get(PROPIEDADES_BASE, [PropertyController::class, 'index']);
Route::get(PROPIEDADES_BASE . '/{id}', [PropertyController::class, 'show']);
Route::post(PROPIEDADES_BASE, [PropertyController::class, 'store']);
Route::put(PROPIEDADES_BASE . '/{id}', [PropertyController::class, 'update']);
Route::delete(PROPIEDADES_BASE . '/{id}', [PropertyController::class, 'destroy']);
