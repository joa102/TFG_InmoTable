<?php

namespace App\Http\Controllers;

use App\Services\AirtableService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AgenteController extends Controller
{
    protected $airtableService;

    public function __construct(AirtableService $airtableService)
    {
        $this->airtableService = $airtableService;
    }

    /**
     * Listar todos los agentes
     */
    public function index(Request $request)
    {
        try {
            $filters = [];

            // Filtros opcionales
            if ($request->has('search')) {
                $search = $request->get('search');
                $filters['filterByFormula'] = "OR(FIND(LOWER('{$search}'), LOWER({Nombre})), FIND(LOWER('{$search}'), LOWER({Email})), FIND(LOWER('{$search}'), LOWER({Zona asignada})))";
            }

            if ($request->has('estado')) {
                $estado = $request->get('estado');
                $existingFormula = $filters['filterByFormula'] ?? '';
                $stateFormula = "{Estado} = '{$estado}'";

                $filters['filterByFormula'] = $existingFormula ?
                    "AND({$stateFormula}, {$existingFormula})" :
                    $stateFormula;
            }

            if ($request->has('zona')) {
                $zona = $request->get('zona');
                $existingFormula = $filters['filterByFormula'] ?? '';
                $zoneFormula = "FIND(LOWER('{$zona}'), LOWER({Zona asignada}))";

                $filters['filterByFormula'] = $existingFormula ?
                    "AND({$zoneFormula}, {$existingFormula})" :
                    $zoneFormula;
            }

            // Ordenar por nombre por defecto
            $filters['sort'] = [
                [
                    'field' => 'Nombre',
                    'direction' => 'asc'
                ]
            ];

            $agentes = $this->airtableService->getRecords('Agentes', $filters);

            return response()->json([
                'success' => true,
                'data' => $agentes,
                'total' => count($agentes)
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al obtener agentes: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los agentes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nuevo agente
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'telefono' => 'required|string|max:20',
            'zona_asignada' => 'required|string|max:255',
            'estado' => 'sometimes|in:Activo,Inactivo,Vacaciones,Suspendido'
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
            $agentesExistentes = $this->airtableService->searchRecords('Agentes',
                "{Email} = '{$request->email}'"
            );

            if (!empty($agentesExistentes)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ya existe un agente con este email'
                ], 409);
            }

            // Generar ID único para el agente
            $ultimoId = $this->obtenerUltimoIdAgente();
            $nuevoId = 'AG' . str_pad($ultimoId + 1, 4, '0', STR_PAD_LEFT);

            $agenteData = [
                'ID Agente' => $nuevoId,
                'Nombre' => $request->nombre,
                'Email' => $request->email,
                'Teléfono' => $request->telefono,
                'Zona asignada' => $request->zona_asignada,
                'Estado' => $request->get('estado', 'Activo')
            ];

            $agente = $this->airtableService->createRecord('Agentes', $agenteData);

            return response()->json([
                'success' => true,
                'message' => 'Agente creado correctamente',
                'data' => $agente
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Error al crear agente: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al crear el agente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener agente específico
     */
    public function show(string $id)
    {
        try {
            $agente = $this->airtableService->getRecord('Agentes', $id);

            // Obtener estadísticas del agente
            $estadisticas = $this->obtenerEstadisticasAgente($id);

            return response()->json([
                'success' => true,
                'data' => array_merge($agente, ['estadisticas' => $estadisticas])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Agente no encontrado',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Actualizar agente
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255',
            'telefono' => 'sometimes|required|string|max:20',
            'zona_asignada' => 'sometimes|required|string|max:255',
            'estado' => 'sometimes|in:Activo,Inactivo,Vacaciones,Suspendido'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar si el email ya existe en otro agente
            if ($request->has('email')) {
                $agentesExistentes = $this->airtableService->searchRecords('Agentes',
                    "AND({Email} = '{$request->email}', NOT(RECORD_ID() = '{$id}'))"
                );

                if (!empty($agentesExistentes)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ya existe otro agente con este email'
                    ], 409);
                }
            }

            $updateData = [];

            if ($request->has('nombre')) {
                $updateData['Nombre'] = $request->nombre;
            }

            if ($request->has('email')) {
                $updateData['Email'] = $request->email;
            }

            if ($request->has('telefono')) {
                $updateData['Teléfono'] = $request->telefono;
            }

            if ($request->has('zona_asignada')) {
                $updateData['Zona asignada'] = $request->zona_asignada;
            }

            if ($request->has('estado')) {
                $updateData['Estado'] = $request->estado;
            }

            $agente = $this->airtableService->updateRecord('Agentes', $id, $updateData);

            return response()->json([
                'success' => true,
                'message' => 'Agente actualizado correctamente',
                'data' => $agente
            ]);

        } catch (\Exception $e) {
            \Log::error('Error al actualizar agente: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el agente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar agente
     */
    public function destroy(string $id)
    {
        try {
            // Verificar si el agente tiene clientes asignados
            $clientes = $this->airtableService->searchRecords('Clientes',
                "{Agente} = '{$id}'"
            );

            if (!empty($clientes)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el agente porque tiene clientes asignados. Reasigne los clientes a otro agente primero.',
                    'clientes_asignados' => count($clientes)
                ], 409);
            }

            $this->airtableService->deleteRecord('Agentes', $id);

            return response()->json([
                'success' => true,
                'message' => 'Agente eliminado correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el agente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener clientes asignados a un agente
     */
    public function clientes(string $agenteId)
    {
        try {
            $clientes = $this->airtableService->searchRecords('Clientes',
                "{Agente} = '{$agenteId}'"
            );

            return response()->json([
                'success' => true,
                'data' => $clientes,
                'total' => count($clientes)
            ]);

        } catch (\Exception $e) {
            \Log::error('Error al obtener clientes del agente: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los clientes del agente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Asignar cliente a agente
     */
    public function asignarCliente(Request $request, string $agenteId)
    {
        $validator = Validator::make($request->all(), [
            'cliente_id' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'ID de cliente requerido',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar que el agente existe
            $agente = $this->airtableService->getRecord('Agentes', $agenteId);

            // Verificar que el cliente existe
            $cliente = $this->airtableService->getRecord('Clientes', $request->cliente_id);

            // Asignar agente al cliente
            $clienteActualizado = $this->airtableService->updateRecord('Clientes', $request->cliente_id, [
                'Agente' => [$agenteId]
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Cliente asignado al agente correctamente',
                'data' => [
                    'agente' => $agente,
                    'cliente' => $clienteActualizado
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error al asignar cliente: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al asignar cliente al agente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Quitar cliente de agente
     */
    public function quitarCliente(Request $request, string $agenteId)
    {
        $validator = Validator::make($request->all(), [
            'cliente_id' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'ID de cliente requerido',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Quitar agente del cliente
            $clienteActualizado = $this->airtableService->updateRecord('Clientes', $request->cliente_id, [
                'Agente' => null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Cliente desasignado del agente correctamente',
                'data' => $clienteActualizado
            ]);

        } catch (\Exception $e) {
            \Log::error('Error al quitar cliente: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al quitar cliente del agente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de un agente
     */
    public function estadisticas(string $agenteId)
    {
        try {
            $estadisticas = $this->obtenerEstadisticasAgente($agenteId);

            return response()->json([
                'success' => true,
                'data' => $estadisticas
            ]);

        } catch (\Exception $e) {
            \Log::error('Error al obtener estadísticas del agente: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar agentes por diferentes criterios
     */
    public function buscar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'termino' => 'required|string|min:2',
            'campo' => 'sometimes|in:nombre,email,zona,todos'
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
                case 'zona':
                    $filterFormula = "FIND(LOWER('{$termino}'), LOWER({Zona asignada}))";
                    break;
                default:
                    $filterFormula = "OR(FIND(LOWER('{$termino}'), LOWER({Nombre})), FIND(LOWER('{$termino}'), LOWER({Email})), FIND(LOWER('{$termino}'), LOWER({Zona asignada})))";
            }

            $agentes = $this->airtableService->searchRecords('Agentes', $filterFormula);

            return response()->json([
                'success' => true,
                'data' => $agentes,
                'total' => count($agentes),
                'termino_busqueda' => $termino,
                'campo_busqueda' => $campo
            ]);

        } catch (\Exception $e) {
            \Log::error('Error al buscar agentes: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al buscar agentes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Método privado para obtener el último ID de agente
     */
    private function obtenerUltimoIdAgente()
    {
        try {
            $agentes = $this->airtableService->getRecords('Agentes');
            $ultimoNumero = 0;

            foreach ($agentes as $agente) {
                if (isset($agente['fields']['ID Agente'])) {
                    $idAgente = $agente['fields']['ID Agente'];
                    if (preg_match('/AG(\d+)/', $idAgente, $matches)) {
                        $numero = intval($matches[1]);
                        if ($numero > $ultimoNumero) {
                            $ultimoNumero = $numero;
                        }
                    }
                }
            }

            return $ultimoNumero;
        } catch (\Exception $e) {
            \Log::warning('Error al obtener último ID de agente: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Método privado para obtener estadísticas de un agente
     */
    private function obtenerEstadisticasAgente(string $agenteId)
    {
        try {
            // Obtener clientes asignados
            $clientes = $this->airtableService->searchRecords('Clientes',
                "{Agente} = '{$agenteId}'"
            );

            // Obtener citas relacionadas con los clientes del agente
            $todasLasCitas = $this->airtableService->getRecords('Citas');
            $citasAgente = [];

            $clientesIds = array_column(array_column($clientes, 'id'), null);

            foreach ($todasLasCitas as $cita) {
                if (isset($cita['fields']['Cliente'])) {
                    $clientesCita = $cita['fields']['Cliente'];
                    foreach ($clientesCita as $clienteId) {
                        if (in_array($clienteId, $clientesIds)) {
                            $citasAgente[] = $cita;
                            break;
                        }
                    }
                }
            }

            // Calcular estadísticas
            $estadisticas = [
                'total_clientes' => count($clientes),
                'total_citas' => count($citasAgente),
                'citas_pendientes' => count(array_filter($citasAgente, function($cita) {
                    return ($cita['fields']['Estado'] ?? '') === 'Pendiente';
                })),
                'citas_confirmadas' => count(array_filter($citasAgente, function($cita) {
                    return ($cita['fields']['Estado'] ?? '') === 'Confirmada';
                })),
                'citas_realizadas' => count(array_filter($citasAgente, function($cita) {
                    return ($cita['fields']['Estado'] ?? '') === 'Realizada';
                })),
                'citas_canceladas' => count(array_filter($citasAgente, function($cita) {
                    return ($cita['fields']['Estado'] ?? '') === 'Cancelada';
                })),
                'clientes_activos' => count(array_filter($clientes, function($cliente) {
                    return ($cliente['fields']['Estado'] ?? '') === 'Activo';
                }))
            ];

            return $estadisticas;

        } catch (\Exception $e) {
            \Log::error('Error al calcular estadísticas del agente: ' . $e->getMessage());
            return [
                'total_clientes' => 0,
                'total_citas' => 0,
                'citas_pendientes' => 0,
                'citas_confirmadas' => 0,
                'citas_realizadas' => 0,
                'citas_canceladas' => 0,
                'clientes_activos' => 0
            ];
        }
    }
}
