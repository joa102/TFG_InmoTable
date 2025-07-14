<?php

namespace App\Http\Controllers;

use App\Services\AirtableService;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Facades\JWTFactory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{

    protected $airtableService;

    public function __construct(AirtableService $airtableService)
    {
        $this->airtableService = $airtableService;
    }

    /**
     * Registrar nuevo usuario
     */
    // public function register(Request $request)
    // {
    //     $validator = Validator::make($request->all(), [
    //         'name' => 'required|string|max:255',
    //         'email' => 'required|string|email|max:255|unique:users',
    //         'password' => 'required|string|min:8|confirmed',
    //     ]);

    //     if ($validator->fails()) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Errores de validación',
    //             'errors' => $validator->errors()
    //         ], 422);
    //     }

    //     try {
    //         // Crear usuario en la base de datos local
    //         $user = User::create([
    //             'name' => $request->name,
    //             'email' => $request->email,
    //             'password' => Hash::make($request->password),
    //         ]);

    //         // Crear token de autenticación con Passport
    //         $token = $user->createToken('auth_token')->accessToken;

    //         return response()->json([
    //             'success' => true,
    //             'message' => 'Usuario registrado correctamente',
    //             'data' => [
    //                 'user' => $user,
    //                 'access_token' => $token,
    //                 'token_type' => 'Bearer'
    //             ]
    //         ], 201);

    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Error interno del servidor',
    //             'error' => $e->getMessage()
    //         ], 500);
    //     }
    // }

    /**
     * Iniciar sesión
     */
    public function login(Request $request)
    {
        // 1️⃣ Validar los datos de entrada
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

        try {
            // 2️⃣ Buscar usuario en Airtable
            $records = $this->airtableService->searchRecords('Usuarios', "{Email} = '{$request->email}'");
            //dump($records);

            // Imprimir respuesta de Airtable
            //Log::info('Usuario encontrado en Airtable', $records);
            //print_r('Usuario encontrado en Airtable' + $records);

            // Verificar si hay algún registro
            if (empty($records) || count($records) === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            $usuario = $records[0]['fields'];

            // 3️⃣ Comparar email y password (suponiendo que en Airtable tienes el campo Password en texto plano)
            if (
                $usuario['Email'] !== $request->email ||
                $usuario['Password'] !== $request->password
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'Credenciales incorrectas'
                ], 401);
            }

            // 4️⃣ Crear payload personalizado (puedes meter el ID de Airtable si quieres)
            // Creamos la factoría y le añadimos solo los claims propios
            $factory = JWTFactory::customClaims([
                'sub'   => $usuario['RECORD_ID'],      // identificador único
                'email' => $usuario['Email'],      // claim extra
            ]);

            // Pedimos que la factoría construya el payload completo
           $payload = $factory->make();           // ← aquí se añaden automáticamente iat, exp, nbf, jti, iss

           // Codificamos y obtenemos el token
           $token = JWTAuth::encode($payload)->get();

            // 5️⃣ Actualizar Airtable con el JWT
            $this->airtableService->updateRecord('Usuarios', $records[0]['id'], [
                'JWT' => $token
            ]);

            // 6️⃣ Responder
            return response()->json([
                'success' => true,
                'message' => 'Login exitoso',
                'user' => $usuario,
                'data' => [
                    'user' => [
                        'email' => $usuario['Email'],
                    ],
                    'access_token' => $token,
                    'token_type' => 'Bearer'
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error en login: '.$e->getMessage());
            print_r('Error en login: '.$e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error interno en el servidor'
            ], 500);
        }
    }

    /**
     * Cerrar sesión
     */
    // public function logout(Request $request)
    // {
    //     $request->user()->token()->revoke();

    //     return response()->json([
    //         'success' => true,
    //         'message' => 'Sesión cerrada correctamente'
    //     ]);
    // }

    /**
     * Obtener usuario autenticado
     */
    // public function user(Request $request)
    // {
    //     return response()->json([
    //         'success' => true,
    //         'data' => [
    //             'user' => $request->user()
    //         ]
    //     ]);
    // }
}
