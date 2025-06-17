<?php

namespace App\Http\Controllers;

use App\Services\AirtableService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ClienteController extends Controller
{
    protected $airtableService;

    public function __construct(AirtableService $airtableService)
    {
        $this->airtableService = $airtableService;
    }

    /**
     * Listar todos los clientes
     */
    public function index(Request $request)
    {
        try {
            $filters = [];

            // Filtros opcionales
            if ($request->has('search')) {
                $search = $request->get('search');
                $filters['filterByFormula'] = "OR(FIND(LOWER('{$search}'), LOWER({Nombre})), FIND(LOWER('{$search}'), LOWER({Email})))";
            }

            if ($request->has('estado')) {
                $estado = $request->get('estado');
                $filters['filterByFormula'] = "{Estado} = '{$estado}'";
            }

            $clientes = $this->airtableService->getRecords('Clientes', $filters);

            return response()->json([
                'success' => true,
                'data' => $clientes,
                'total' => count($clientes)
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener clientes: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los clientes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nuevo cliente
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'telefono' => 'required|string|max:20',
            'email' => 'required|email|max:255',
            'comentarios' => 'nullable|string|max:1000',
            'agente_id' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar si el email ya existe
            $clientesExistentes = $this->airtableService->searchRecords('Clientes',
                "{Email} = '{$request->email}'"
            );

            if (!empty($clientesExistentes)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ya existe un cliente con este email'
                ], 409);
            }

            $clienteData = [
                'Nombre' => $request->nombre,
                'Teléfono' => $request->telefono,
                'Email' => $request->email,
                'Fecha de Registro' => now()->toISOString(),
                'Comentarios' => $request->comentarios ?? '',
                'Estado' => 'Activo'
            ];

            // Asignar agente si se proporciona
            if ($request->filled('agente_id')) {
                $clienteData['Agente'] = [$request->agente_id];
            }

            $cliente = $this->airtableService->createRecord('Clientes', $clienteData);

            return response()->json([
                'success' => true,
                'message' => 'Cliente creado correctamente',
                'data' => $cliente
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error al crear cliente: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al crear el cliente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener cliente específico
     */
    public function show(string $id)
    {
        try {
            $cliente = $this->airtableService->getRecord('Clientes', $id);

            return response()->json([
                'success' => true,
                'data' => $cliente
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cliente no encontrado',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Actualizar cliente
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:255',
            'telefono' => 'sometimes|required|string|max:20',
            'email' => 'sometimes|required|email|max:255',
            'comentarios' => 'nullable|string|max:1000',
            'estado' => 'sometimes|in:Activo,Inactivo,Suspendido',
            'agente_id' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar si el email ya existe en otro cliente
            if ($request->has('email')) {
                $clientesExistentes = $this->airtableService->searchRecords('Clientes',
                    "AND({Email} = '{$request->email}', NOT(RECORD_ID() = '{$id}'))"
                );

                if (!empty($clientesExistentes)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ya existe otro cliente con este email'
                    ], 409);
                }
            }

            $updateData = [];

            if ($request->has('nombre')) {
                $updateData['Nombre'] = $request->nombre;
            }

            if ($request->has('telefono')) {
                $updateData['Teléfono'] = $request->telefono;
            }

            if ($request->has('email')) {
                $updateData['Email'] = $request->email;
            }

            if ($request->has('comentarios')) {
                $updateData['Comentarios'] = $request->comentarios;
            }

            if ($request->has('estado')) {
                $updateData['Estado'] = $request->estado;
            }

            if ($request->has('agente_id')) {
                if ($request->agente_id) {
                    $updateData['Agente'] = [$request->agente_id];
                } else {
                    $updateData['Agente'] = null; // Quitar agente asignado
                }
            }

            $cliente = $this->airtableService->updateRecord('Clientes', $id, $updateData);

            return response()->json([
                'success' => true,
                'message' => 'Cliente actualizado correctamente',
                'data' => $cliente
            ]);

        } catch (\Exception $e) {
            Log::error('Error al actualizar cliente: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el cliente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar cliente
     */
    public function destroy(string $id)
    {
        try {
            // Verificar si el cliente tiene citas activas
            $citas = $this->airtableService->searchRecords('Citas',
                "AND({Cliente} = '{$id}', OR({Estado} = 'Pendiente', {Estado} = 'Confirmada'))"
            );

            if (!empty($citas)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el cliente porque tiene citas activas'
                ], 409);
            }

            $this->airtableService->deleteRecord('Clientes', $id);

            return response()->json([
                'success' => true,
                'message' => 'Cliente eliminado correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el cliente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener propiedades de interés de un cliente
     */
    public function propiedadesInteres(string $clienteId)
    {
        try {
            $cliente = $this->airtableService->getRecord('Clientes', $clienteId);

            if (!isset($cliente['fields']['InteresPropiedades'])) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'message' => 'El cliente no tiene propiedades de interés'
                ]);
            }

            $propiedadesIds = $cliente['fields']['InteresPropiedades'];
            $propiedades = [];

            foreach ($propiedadesIds as $propiedadId) {
                try {
                    $propiedad = $this->airtableService->getRecord('Propiedades', $propiedadId);
                    $propiedades[] = $propiedad;
                } catch (\Exception $e) {
                    Log::warning("No se pudo obtener la propiedad {$propiedadId}: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'data' => $propiedades,
                'total' => count($propiedades)
            ]);

        } catch (\Exception $e) {
            Log::error('Error al obtener propiedades de interés: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las propiedades de interés',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Agregar propiedad al interés del cliente
     */
    public function agregarInteres(string $clienteId, string $propiedadId)
    {
        try {
            $cliente = $this->airtableService->getRecord('Clientes', $clienteId);

            $propiedadesInteres = $cliente['fields']['InteresPropiedades'] ?? [];

            // Verificar si ya está en interés
            if (in_array($propiedadId, $propiedadesInteres)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La propiedad ya está en la lista de interés'
                ], 409);
            }

            // Agregar la nueva propiedad
            $propiedadesInteres[] = $propiedadId;

            $cliente = $this->airtableService->updateRecord('Clientes', $clienteId, [
                'InteresPropiedades' => $propiedadesInteres
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Propiedad agregada a interés correctamente',
                'data' => $cliente
            ]);

        } catch (\Exception $e) {
            Log::error('Error al agregar propiedad a interés: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al agregar la propiedad a interés',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Quitar propiedad del interés del cliente
     */
    public function quitarInteres(string $clienteId, string $propiedadId)
    {
        try {
            $cliente = $this->airtableService->getRecord('Clientes', $clienteId);

            $propiedadesInteres = $cliente['fields']['InteresPropiedades'] ?? [];

            // Verificar si está en la lista
            if (!in_array($propiedadId, $propiedadesInteres)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La propiedad no está en la lista de interés'
                ], 404);
            }

            // Quitar la propiedad
            $propiedadesInteres = array_values(array_filter($propiedadesInteres, function($id) use ($propiedadId) {
                return $id !== $propiedadId;
            }));

            $cliente = $this->airtableService->updateRecord('Clientes', $clienteId, [
                'InteresPropiedades' => $propiedadesInteres
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Propiedad quitada de interés correctamente',
                'data' => $cliente
            ]);

        } catch (\Exception $e) {
            Log::error('Error al quitar propiedad de interés: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al quitar la propiedad de interés',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔥 OBTENER PROPIEDADES DE INTERÉS DEL USUARIO LOGUEADO (CORREGIDO CON ESTRUCTURA REAL)
     */
    public function misPropiedadesInteres(Request $request)
    {
        try {
            Log::info('🔍 Obteniendo propiedades de interés desde Airtable');

            // 🔥 OBTENER EMAIL DEL USUARIO LOGUEADO DESDE EL FRONTEND
            $emailUsuario = $request->get('email');

            if (!$emailUsuario) {
                Log::warning('⚠️ No se proporcionó email en el request');
                return response()->json([
                    'success' => false,
                    'message' => 'Email del usuario requerido',
                    'error' => 'Parámetro email faltante'
                ], 400);
            }

            Log::info('📧 Buscando usuario con email: ' . $emailUsuario);

            // 1️⃣ BUSCAR USUARIO EN TABLA USUARIOS POR EMAIL
            $usuariosFormula = "LOWER({Email}) = LOWER('{$emailUsuario}')";
            $usuarios = $this->airtableService->searchRecords('Usuarios', $usuariosFormula);

            if (empty($usuarios)) {
                Log::info('🚫 No se encontró usuario con email: ' . $emailUsuario);

                return response()->json([
                    'success' => true,
                    'data' => [],
                    'total' => 0,
                    'message' => 'Usuario no encontrado en el sistema',
                    'info' => [
                        'email_consultado' => $emailUsuario,
                        'usuarios_encontrados' => 0
                    ]
                ]);
            }

            $usuario = $usuarios[0];
            Log::info('✅ Usuario encontrado: ' . $usuario['id'], [
                'nombre' => $usuario['fields']['Nombre'] ?? 'Sin nombre',
                'email' => $usuario['fields']['Email'] ?? 'Sin email',
                'clientes_asignados' => $usuario['fields']['Clientes'] ?? []
            ]);

            // 2️⃣ OBTENER IDS DE CLIENTES DEL USUARIO
            $clientesIds = $usuario['fields']['Clientes'] ?? [];

            if (empty($clientesIds)) {
                Log::info('📝 El usuario no tiene clientes asignados');

                return response()->json([
                    'success' => true,
                    'data' => [],
                    'total' => 0,
                    'message' => 'El usuario no tiene clientes asignados',
                    'info' => [
                        'usuario_id' => $usuario['id'],
                        'usuario_nombre' => $usuario['fields']['Nombre'] ?? 'Sin nombre',
                        'clientes_count' => 0
                    ]
                ]);
            }

            Log::info('👥 Clientes del usuario: ' . count($clientesIds), $clientesIds);

            // 3️⃣ OBTENER TODAS LAS PROPIEDADES DE INTERÉS DE TODOS LOS CLIENTES
            $todasPropiedadesInteres = [];
            $erroresClientes = [];

            foreach ($clientesIds as $clienteId) {
                try {
                    Log::info('🔍 Obteniendo cliente: ' . $clienteId);

                    $cliente = $this->airtableService->getRecord('Clientes', $clienteId);

                    // 🔥 LOG COMPLETO DEL CLIENTE PARA DEBUG
                    Log::info('👥 CLIENTE COMPLETO OBTENIDO:', [
                        'cliente_id' => $clienteId,
                        'cliente_nombre' => $cliente['fields']['Nombre'] ?? 'Sin nombre',
                        'todos_los_campos' => $cliente['fields'], // 🔥 VER TODO EL CONTENIDO
                        'campo_interes_raw' => $cliente['fields']['InteresPropiedades'] ?? 'NO_EXISTE'
                    ]);

                    if (isset($cliente['fields']['InteresPropiedades'])) {
                        $propiedadesDelCliente = $cliente['fields']['InteresPropiedades'];

                        // 🔥 LOG DETALLADO DE LAS PROPIEDADES ENCONTRADAS
                        Log::info('🏠 PROPIEDADES DE INTERÉS ENCONTRADAS:', [
                            'cliente_id' => $clienteId,
                            'cantidad' => count($propiedadesDelCliente),
                            'propiedades_ids' => $propiedadesDelCliente,
                            'tipo_dato' => gettype($propiedadesDelCliente),
                            'es_array' => is_array($propiedadesDelCliente)
                        ]);

                        $todasPropiedadesInteres = array_merge($todasPropiedadesInteres, $propiedadesDelCliente);

                        // 🔥 LOG DEL ESTADO ACUMULADO
                        Log::info('📊 ESTADO ACUMULADO:', [
                            'total_acumulado' => count($todasPropiedadesInteres),
                            'ids_acumulados' => $todasPropiedadesInteres
                        ]);
                    } else {
                        Log::info('📝 Cliente sin propiedades de interés: ' . $clienteId);
                    }

                } catch (\Exception $e) {
                    $erroresClientes[] = "Cliente {$clienteId}: " . $e->getMessage();
                    Log::warning('❌ Error al obtener cliente ' . $clienteId . ': ' . $e->getMessage());
                }
            }

            // Eliminar duplicados de propiedades
            $todasPropiedadesInteres = array_unique($todasPropiedadesInteres);

            if (empty($todasPropiedadesInteres)) {
                Log::info('📝 No hay propiedades de interés en total');

                return response()->json([
                    'success' => true,
                    'data' => [],
                    'total' => 0,
                    'message' => 'Aún no has marcado ninguna propiedad como favorita',
                    'info' => [
                        'usuario_id' => $usuario['id'],
                        'clientes_procesados' => count($clientesIds),
                        'propiedades_interes_count' => 0
                    ]
                ]);
            }

            Log::info('🏠 Total propiedades de interés encontradas: ' . count($todasPropiedadesInteres), $todasPropiedadesInteres);

            // 4️⃣ OBTENER CADA PROPIEDAD DESDE TABLA PROPIEDADES
            $propiedades = [];
            $erroresPropiedades = [];

            foreach ($todasPropiedadesInteres as $propiedadId) {
                try {
                    Log::info('🔍 Obteniendo propiedad: ' . $propiedadId);

                    $propiedad = $this->airtableService->getRecord('Propiedades', $propiedadId);

                    // Validar que la propiedad sea válida
                    if (isset($propiedad['fields'])) {
                        // 🔥 ADAPTAR AL FORMATO QUE ESPERA EL FRONTEND
                        $propiedadFormateada = [
                            'id' => $propiedad['id'],
                            'fields' => $propiedad['fields'],
                            'createdTime' => $propiedad['createdTime'] ?? '2024-01-01T00:00:00.000Z'
                        ];

                        $propiedades[] = $propiedadFormateada;
                        Log::info('✅ Propiedad cargada: ' . ($propiedad['fields']['Título'] ?? 'Sin título'));
                    } else {
                        $erroresPropiedades[] = "Propiedad {$propiedadId}: Datos incompletos";
                        Log::warning('⚠️ Propiedad con datos incompletos: ' . $propiedadId);
                    }

                } catch (\Exception $e) {
                    $erroresPropiedades[] = "Propiedad {$propiedadId}: " . $e->getMessage();
                    Log::warning('❌ Error al obtener propiedad ' . $propiedadId . ': ' . $e->getMessage());
                }
            }

            // 5️⃣ NO APLICAR FILTROS POR ESTADO - DEVOLVER TODAS LAS PROPIEDADES
            // $propiedadesFiltradas = array_filter($propiedades, function($propiedad) {
            //     $estado = $propiedad['fields']['Estado'] ?? 'Disponible';
            //     return in_array($estado, ['Disponible', 'disponible', 'Available']);
            // });

            // 🔥 DEVOLVER TODAS LAS PROPIEDADES SIN FILTRAR
            $propiedadesFiltradas = $propiedades;

            // 6️⃣ ORDENAR POR FECHA DE CREACIÓN (más recientes primero)
            usort($propiedadesFiltradas, function($a, $b) {
                $fechaA = $a['createdTime'] ?? '1970-01-01T00:00:00.000Z';
                $fechaB = $b['createdTime'] ?? '1970-01-01T00:00:00.000Z';
                return strtotime($fechaB) - strtotime($fechaA);
            });

            // 7️⃣ PREPARAR ESTADÍSTICAS ACTUALIZADAS
            $estadisticas = [
                'usuario_clientes' => count($clientesIds),
                'total_interes' => count($todasPropiedadesInteres),
                'propiedades_cargadas' => count($propiedades),
                'total_devueltas' => count($propiedadesFiltradas), // 🔥 CAMBIAR NOMBRE
                'disponibles' => count(array_filter($propiedades, function($p) { // 🔥 CALCULAR PERO NO FILTRAR
                    $estado = $p['fields']['Estado'] ?? 'Disponible';
                    return in_array($estado, ['Disponible', 'disponible', 'Available']);
                })),
                'no_disponibles' => count($propiedades) - count(array_filter($propiedades, function($p) {
                    $estado = $p['fields']['Estado'] ?? 'Disponible';
                    return in_array($estado, ['Disponible', 'disponible', 'Available']);
                })),
                'errores_clientes' => count($erroresClientes),
                'errores_propiedades' => count($erroresPropiedades)
            ];

            Log::info('📊 Estadísticas finales:', $estadisticas);

            // 8️⃣ RESPUESTA EXITOSA - ACTUALIZAR MENSAJE
            $response = [
                'success' => true,
                'data' => array_values($propiedadesFiltradas),
                'total' => count($propiedadesFiltradas),
                'message' => count($propiedadesFiltradas) > 0
                    ? 'Todas las propiedades de interés cargadas exitosamente' // 🔥 CAMBIAR MENSAJE
                    : 'Aún no has marcado ninguna propiedad como favorita',
                'estadisticas' => $estadisticas,
                'info' => [
                    'usuario_id' => $usuario['id'],
                    'usuario_nombre' => $usuario['fields']['Nombre'] ?? 'Sin nombre',
                    'email_consultado' => $emailUsuario,
                    'clientes_procesados' => $clientesIds,
                    'source' => 'Airtable - Todas las propiedades de interés (sin filtrar por estado)',
                    'timestamp' => now()->toISOString()
                ]
            ];

            // Añadir errores si los hay (pero no fallar la respuesta)
            if (!empty($erroresClientes) || !empty($erroresPropiedades)) {
                $response['warnings'] = [
                    'message' => 'Algunos registros no se pudieron cargar',
                    'errores_clientes' => $erroresClientes,
                    'errores_propiedades' => $erroresPropiedades
                ];
            }

            return response()->json($response);

        } catch (\Exception $e) {
            Log::error('❌ Error crítico al obtener propiedades de interés: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener tus propiedades de interés',
                'error' => $e->getMessage(),
                'info' => [
                    'email_consultado' => $request->get('email', 'No especificado'),
                    'timestamp' => now()->toISOString()
                ]
            ], 500);
        }
    }

    /**
     * Buscar clientes por diferentes criterios
     */
    public function buscar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'termino' => 'required|string|min:2',
            'campo' => 'sometimes|in:nombre,email,telefono,todos'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $termino = $request->get('termino');
            $campo = $request->get('campo', 'todos');

            $filterFormula = '';

            switch ($campo) {
                case 'nombre':
                    $filterFormula = "FIND(LOWER('{$termino}'), LOWER({Nombre}))";
                    break;
                case 'email':
                    $filterFormula = "FIND(LOWER('{$termino}'), LOWER({Email}))";
                    break;
                case 'telefono':
                    $filterFormula = "FIND('{$termino}', {Teléfono})";
                    break;
                default:
                    $filterFormula = "OR(FIND(LOWER('{$termino}'), LOWER({Nombre})), FIND(LOWER('{$termino}'), LOWER({Email})), FIND('{$termino}', {Teléfono}))";
            }

            $clientes = $this->airtableService->searchRecords('Clientes', $filterFormula);

            return response()->json([
                'success' => true,
                'data' => $clientes,
                'total' => count($clientes),
                'termino_busqueda' => $termino,
                'campo_busqueda' => $campo
            ]);

        } catch (\Exception $e) {
            Log::error('Error al buscar clientes: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al buscar clientes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔥 AGREGAR PROPIEDAD A INTERÉS DEL USUARIO LOGUEADO
     */
    public function agregarInteresUsuario(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'propiedad_id' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $emailUsuario = $request->get('email');
            $propiedadId = $request->get('propiedad_id');

            Log::info('🔥 Agregando propiedad a interés', [
                'email' => $emailUsuario,
                'propiedad_id' => $propiedadId
            ]);

            // 1️⃣ BUSCAR USUARIO
            $usuarios = $this->airtableService->searchRecords('Usuarios', 
                "LOWER({Email}) = LOWER('{$emailUsuario}')"
            );

            if (empty($usuarios)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            $usuario = $usuarios[0];
            $clientesIds = $usuario['fields']['Clientes'] ?? [];

            if (empty($clientesIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario sin cliente asignado'
                ], 400);
            }

            $clienteId = $clientesIds[0]; // Primer cliente

            // 2️⃣ OBTENER CLIENTE Y SUS PROPIEDADES DE INTERÉS
            $cliente = $this->airtableService->getRecord('Clientes', $clienteId);
            $propiedadesInteres = $cliente['fields']['InteresPropiedades'] ?? [];

            // 3️⃣ VERIFICAR SI YA ESTÁ EN INTERÉS
            if (in_array($propiedadId, $propiedadesInteres)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La propiedad ya está en tus favoritos'
                ], 409);
            }

            // 4️⃣ AGREGAR LA NUEVA PROPIEDAD
            $propiedadesInteres[] = $propiedadId;

            $clienteActualizado = $this->airtableService->updateRecord('Clientes', $clienteId, [
                'InteresPropiedades' => $propiedadesInteres
            ]);

            Log::info('✅ Propiedad agregada a interés exitosamente', [
                'cliente_id' => $clienteId,
                'propiedad_id' => $propiedadId,
                'total_propiedades' => count($propiedadesInteres)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Propiedad agregada a tus favoritos',
                'data' => [
                    'cliente_id' => $clienteId,
                    'propiedad_id' => $propiedadId,
                    'total_interes' => count($propiedadesInteres),
                    'accion' => 'agregada'
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error al agregar propiedad a interés: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al agregar la propiedad a favoritos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔥 QUITAR PROPIEDAD DE INTERÉS DEL USUARIO LOGUEADO
     */
    public function quitarInteresUsuario(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'propiedad_id' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $emailUsuario = $request->get('email');
            $propiedadId = $request->get('propiedad_id');

            Log::info('🔥 Quitando propiedad de interés', [
                'email' => $emailUsuario,
                'propiedad_id' => $propiedadId
            ]);

            // 1️⃣ BUSCAR USUARIO
            $usuarios = $this->airtableService->searchRecords('Usuarios', 
                "LOWER({Email}) = LOWER('{$emailUsuario}')"
            );

            if (empty($usuarios)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            $usuario = $usuarios[0];
            $clientesIds = $usuario['fields']['Clientes'] ?? [];

            if (empty($clientesIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario sin cliente asignado'
                ], 400);
            }

            $clienteId = $clientesIds[0];

            // 2️⃣ OBTENER CLIENTE Y SUS PROPIEDADES DE INTERÉS
            $cliente = $this->airtableService->getRecord('Clientes', $clienteId);
            $propiedadesInteres = $cliente['fields']['InteresPropiedades'] ?? [];

            // 3️⃣ VERIFICAR SI ESTÁ EN LA LISTA
            if (!in_array($propiedadId, $propiedadesInteres)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La propiedad no está en tus favoritos'
                ], 409);
            }

            // 4️⃣ QUITAR LA PROPIEDAD
            $propiedadesInteres = array_values(array_filter($propiedadesInteres, function($id) use ($propiedadId) {
                return $id !== $propiedadId;
            }));

            $clienteActualizado = $this->airtableService->updateRecord('Clientes', $clienteId, [
                'InteresPropiedades' => $propiedadesInteres
            ]);

            Log::info('✅ Propiedad quitada de interés exitosamente', [
                'cliente_id' => $clienteId,
                'propiedad_id' => $propiedadId,
                'total_propiedades' => count($propiedadesInteres)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Propiedad quitada de tus favoritos',
                'data' => [
                    'cliente_id' => $clienteId,
                    'propiedad_id' => $propiedadId,
                    'total_interes' => count($propiedadesInteres),
                    'accion' => 'quitada'
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error al quitar propiedad de interés: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al quitar la propiedad de favoritos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔥 VERIFICAR SI UNA PROPIEDAD ESTÁ EN INTERÉS DEL USUARIO LOGUEADO
     */
    public function verificarInteresUsuario(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'propiedad_id' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $emailUsuario = $request->get('email');
            $propiedadId = $request->get('propiedad_id');

            // 1️⃣ BUSCAR USUARIO
            $usuarios = $this->airtableService->searchRecords('Usuarios', 
                "LOWER({Email}) = LOWER('{$emailUsuario}')"
            );

            if (empty($usuarios)) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'es_favorito' => false,
                        'mensaje' => 'Usuario no encontrado'
                    ]
                ]);
            }

            $usuario = $usuarios[0];
            $clientesIds = $usuario['fields']['Clientes'] ?? [];

            if (empty($clientesIds)) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'es_favorito' => false,
                        'mensaje' => 'Usuario sin cliente asignado'
                    ]
                ]);
            }

            $clienteId = $clientesIds[0];

            // 2️⃣ OBTENER CLIENTE Y VERIFICAR PROPIEDADES DE INTERÉS
            $cliente = $this->airtableService->getRecord('Clientes', $clienteId);
            $propiedadesInteres = $cliente['fields']['InteresPropiedades'] ?? [];

            $esFavorito = in_array($propiedadId, $propiedadesInteres);

            return response()->json([
                'success' => true,
                'data' => [
                    'es_favorito' => $esFavorito,
                    'cliente_id' => $clienteId,
                    'propiedad_id' => $propiedadId
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error al verificar interés: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al verificar interés',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
