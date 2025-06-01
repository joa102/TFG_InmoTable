<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AirtableService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    protected $airtableService;

    public function __construct(AirtableService $airtableService)
    {
        $this->airtableService = $airtableService;
    }

    /**
     * Registrar nuevo usuario (Híbrido: Laravel + Airtable)
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'telefono' => 'required|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // 🔥 PASO 1: Crear cliente en Airtable PRIMERO
            $clienteData = [
                'Nombre' => $request->nombre,
                'Email' => $request->email,
                'Teléfono' => $request->telefono,
                'Fecha de Registro' => now()->toISOString(),
                'Estado' => 'Activo'
            ];

            $airtableCliente = $this->airtableService->createRecord('Clientes', $clienteData);

            // 🔥 PASO 2: Crear usuario en Airtable (tabla Usuarios)
            $usuarioData = [
                'Email' => $request->email,
                'Password' => Hash::make($request->password), // Hash para seguridad
                'Rol' => 'cliente',
                'Estado' => 'Activo',
                'Fecha de Registro' => now()->toISOString(),
                'Clientes' => [$airtableCliente['id']] // Vincular con cliente
            ];

            $airtableUsuario = $this->airtableService->createRecord('Usuarios', $usuarioData);

            // 🔥 PASO 3: Crear usuario en Laravel (SQLite) para autenticación
            $user = User::create([
                'name' => $request->nombre,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'cliente',
                'airtable_id' => $airtableUsuario['id'], // 🔗 Vincular con Airtable
                'status' => 'active'
            ]);

            // 🔥 PASO 4: Crear token de autenticación
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Usuario registrado correctamente',
                'data' => [
                    'user' => $user,
                    'airtable_usuario_id' => $airtableUsuario['id'],
                    'airtable_cliente_id' => $airtableCliente['id'],
                    'token' => $token,
                    'token_type' => 'Bearer'
                ]
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Error en registro híbrido: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Iniciar sesión (Híbrido: Laravel auth + Airtable sync)
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de login inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        // 🔥 AUTENTICACIÓN en Laravel (SQLite)
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        // 🔥 ACTUALIZAR último login en Airtable
        try {
            if ($user->airtable_id) {
                $this->airtableService->updateRecord('Usuarios', $user->airtable_id, [
                    'Último login' => now()->toISOString()
                ]);
            }

            // Actualizar en Laravel también
            $user->update(['last_login_at' => now()]);

        } catch (\Exception $e) {
            \Log::warning('No se pudo actualizar último login en Airtable: ' . $e->getMessage());
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login exitoso',
            'data' => [
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer'
            ]
        ]);
    }

    /**
     * Cerrar sesión
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada correctamente'
        ]);
    }

    /**
     * Obtener usuario autenticado con datos de Airtable
     */
    public function user(Request $request)
    {
        $user = $request->user();

        // 🔥 OBTENER datos adicionales de Airtable si es necesario
        $airtableData = null;

        try {
            if ($user->airtable_id) {
                $airtableData = $this->airtableService->getRecord('Usuarios', $user->airtable_id);
            }
        } catch (\Exception $e) {
            \Log::warning('No se pudieron obtener datos de Airtable para el usuario: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'airtable_data' => $airtableData
            ]
        ]);
    }

    /**
     * 🔥 NUEVO: Sincronizar usuario Laravel con Airtable
     */
    public function syncWithAirtable(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->airtable_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no tiene ID de Airtable asociado'
                ], 400);
            }

            $airtableUser = $this->airtableService->getRecord('Usuarios', $user->airtable_id);

            return response()->json([
                'success' => true,
                'message' => 'Datos sincronizados correctamente',
                'data' => [
                    'laravel_user' => $user,
                    'airtable_user' => $airtableUser
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al sincronizar con Airtable',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
