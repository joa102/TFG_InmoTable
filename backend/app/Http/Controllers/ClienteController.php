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
     * Obtener propiedades de interés del usuario logueado
     */
    public function misPropiedadesInteres(Request $request)
    {
        try {
            $user = $request->user();

            // Buscar cliente en Airtable por email
            $clientes = $this->airtableService->getRecords('Clientes');
            $cliente = collect($clientes)->firstWhere('fields.Email', $user->email);

            if (!$cliente) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'message' => 'No tienes propiedades de interés'
                ]);
            }

            return $this->propiedadesInteres($cliente['id']);

        } catch (\Exception $e) {
            Log::error('Error al obtener mis propiedades de interés: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener tus propiedades de interés',
                'error' => $e->getMessage()
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
}
