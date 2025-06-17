<?php

namespace App\Http\Controllers;

use App\Services\AirtableService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class UsuarioController extends Controller
{
    protected $airtableService;

    public function __construct(AirtableService $airtableService)
    {
        $this->airtableService = $airtableService;
    }

    /**
     * 🔄 Actualizar usuario específico - CON DEBUG DETALLADO
     */
    public function update(Request $request, string $recordId)
    {
        Log::info('🔄 UsuarioController::update - Inicio', [
            'recordId' => $recordId,
            'request_data' => $request->all(),
            'method' => $request->method(),
            'url' => $request->fullUrl()
        ]);

        try {
            // 🔥 VALIDACIÓN BÁSICA
            $validator = Validator::make($request->all(), [
                'email' => 'sometimes|required|email|max:255',
                'password' => 'sometimes|required|string|min:6',
                'nombre' => 'sometimes|required|string|max:255',
                'telefono' => 'sometimes|required|string|max:20'
            ]);

            if ($validator->fails()) {
                Log::error('❌ Validación fallida', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'Errores de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            Log::info('✅ Validación pasada');

            // 🔥 VERIFICAR QUE EL USUARIO EXISTE
            Log::info('🔍 Verificando si existe usuario en Airtable', ['recordId' => $recordId]);

            $usuario = $this->airtableService->getRecord('Usuarios', $recordId);

            Log::info('📋 Resultado de getRecord:', [
                'usuario_encontrado' => !!$usuario,
                'usuario_data' => $usuario ? 'Datos encontrados' : 'NULL'
            ]);

            if (!$usuario) {
                Log::error('❌ Usuario no encontrado en Airtable', ['recordId' => $recordId]);
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado',
                    'debug' => ['recordId' => $recordId]
                ], 404);
            }

            // 🔥 PREPARAR DATOS PARA ACTUALIZAR (SIN VALIDACIÓN DE EMAIL DUPLICADO)
            $updateData = [];

            if ($request->has('email')) {
                $updateData['Email'] = $request->email;
                Log::info('📧 Actualizando email', ['nuevo_email' => $request->email]);
            }

            if ($request->has('password')) {
                $updateData['Password'] = $request->password;
                Log::info('🔒 Actualizando password');
            }

            if ($request->has('nombre')) {
                $updateData['Nombre'] = $request->nombre;
                Log::info('👤 Actualizando nombre', ['nuevo_nombre' => $request->nombre]);
            }

            if ($request->has('telefono')) {
                $updateData['Teléfono'] = $request->telefono;
                Log::info('📞 Actualizando teléfono', ['nuevo_telefono' => $request->telefono]);
            }

            // 🔥 COMENTAR TEMPORALMENTE PARA TESTING
            // $updateData['Último login'] = now()->toISOString();

            Log::info('📝 Datos preparados para actualizar:', $updateData);

            // 🔥 ACTUALIZAR EN AIRTABLE
            Log::info('🔄 Iniciando actualización en Airtable...');

            $usuarioActualizado = $this->airtableService->updateRecord('Usuarios', $recordId, $updateData);

            Log::info('✅ Usuario actualizado exitosamente:', [
                'recordId' => $recordId,
                'usuario_actualizado' => !!$usuarioActualizado
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Usuario actualizado correctamente',
                'data' => $usuarioActualizado
            ]);

        } catch (\Exception $e) {
            Log::error('💥 Error en UsuarioController::update:', [
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'recordId' => $recordId,
                'request_data' => $request->all(),
                'stack_trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el usuario',
                'error' => $e->getMessage(),
                'debug' => [
                    'recordId' => $recordId,
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]
            ], 500);
        }
    }

    /**
     * 📧 Obtener usuario por email
     */
    public function getByEmail(Request $request)
    {
        try {
            $email = $request->query('email');

            Log::info('📧 Buscando usuario por email', ['email' => $email]);

            if (!$email) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email es requerido'
                ], 400);
            }

            $usuarios = $this->airtableService->searchRecords('Usuarios',
                "{Email} = '{$email}'"
            );

            Log::info('🔍 Resultado búsqueda por email:', [
                'email' => $email,
                'usuarios_encontrados' => count($usuarios)
            ]);

            if (empty($usuarios)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $usuarios[0]
            ]);

        } catch (\Exception $e) {
            Log::error('💥 Error en getByEmail:', [
                'error' => $e->getMessage(),
                'email' => $request->query('email')
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al buscar usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🆔 Obtener usuario por recordId
     */
    public function show(string $recordId)
    {
        try {
            Log::info('👁️ Mostrando usuario', ['recordId' => $recordId]);

            $usuario = $this->airtableService->getRecord('Usuarios', $recordId);

            Log::info('📋 Usuario obtenido:', [
                'recordId' => $recordId,
                'encontrado' => !!$usuario
            ]);

            return response()->json([
                'success' => true,
                'data' => $usuario
            ]);
        } catch (\Exception $e) {
            Log::error('💥 Error en show:', [
                'error' => $e->getMessage(),
                'recordId' => $recordId
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado',
                'error' => $e->getMessage()
            ], 404);
        }
    }
}
