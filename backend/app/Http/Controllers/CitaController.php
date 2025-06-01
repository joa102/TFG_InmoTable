<?php

namespace App\Http\Controllers;

use App\Services\AirtableService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CitaController extends Controller
{
    protected $airtableService;

    public function __construct(AirtableService $airtableService)
    {
        $this->airtableService = $airtableService;
    }

    /**
     * Listar todas las citas
     */
    public function index(Request $request)
    {
        try {
            $citas = $this->airtableService->getRecords('Citas');

            return response()->json([
                'success' => true,
                'data' => $citas,
                'total' => count($citas)
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al obtener citas: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las citas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nueva cita
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'propiedad_id' => 'required|string',
            'cliente_id' => 'required|string',
            'fecha_hora' => 'required|date',
            'comentarios' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $citaData = [
                'Propiedad' => [$request->propiedad_id],
                'Cliente' => [$request->cliente_id],
                'Fecha y Hora' => $request->fecha_hora,
                'Estado' => 'Pendiente',
                'Comentarios' => $request->comentarios ?? ''
            ];

            $cita = $this->airtableService->createRecord('Citas', $citaData);

            return response()->json([
                'success' => true,
                'message' => 'Cita creada correctamente',
                'data' => $cita
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Error al crear cita: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al crear la cita',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener cita específica
     */
    public function show(string $id)
    {
        try {
            $cita = $this->airtableService->getRecord('Citas', $id);

            return response()->json([
                'success' => true,
                'data' => $cita
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cita no encontrada',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Actualizar cita
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'fecha_hora' => 'sometimes|date',
            'estado' => 'sometimes|in:Pendiente,Confirmada,Realizada,Cancelada',
            'comentarios' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $updateData = [];

            if ($request->has('fecha_hora')) {
                $updateData['Fecha y Hora'] = $request->fecha_hora;
            }

            if ($request->has('estado')) {
                $updateData['Estado'] = $request->estado;
            }

            if ($request->has('comentarios')) {
                $updateData['Comentarios'] = $request->comentarios;
            }

            $cita = $this->airtableService->updateRecord('Citas', $id, $updateData);

            return response()->json([
                'success' => true,
                'message' => 'Cita actualizada correctamente',
                'data' => $cita
            ]);

        } catch (\Exception $e) {
            \Log::error('Error al actualizar cita: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la cita',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar cita
     */
    public function destroy(string $id)
    {
        try {
            $this->airtableService->deleteRecord('Citas', $id);

            return response()->json([
                'success' => true,
                'message' => 'Cita eliminada correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la cita',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Solicitar cita (público - sin autenticación)
     */
    public function solicitarCita(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'propiedad_id' => 'required|string',
            'nombre' => 'required|string|max:255',
            'email' => 'required|email',
            'telefono' => 'required|string|max:20',
            'fecha_preferida' => 'required|date|after:today',
            'mensaje' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Buscar o crear cliente
            $clientes = $this->airtableService->getRecords('Clientes');
            $clienteExistente = collect($clientes)->firstWhere('fields.Email', $request->email);

            if (!$clienteExistente) {
                // Crear nuevo cliente
                $clienteData = [
                    'Nombre' => $request->nombre,
                    'Email' => $request->email,
                    'Teléfono' => $request->telefono,
                    'Fecha de Registro' => now()->toISOString()
                ];

                $clienteExistente = $this->airtableService->createRecord('Clientes', $clienteData);
            }

            // Crear la cita
            $citaData = [
                'Propiedad' => [$request->propiedad_id],
                'Cliente' => [$clienteExistente['id']],
                'Fecha y Hora' => $request->fecha_preferida,
                'Estado' => 'Pendiente',
                'Comentarios' => $request->mensaje ?? 'Solicitud desde web'
            ];

            $cita = $this->airtableService->createRecord('Citas', $citaData);

            return response()->json([
                'success' => true,
                'message' => 'Solicitud de cita enviada correctamente. Nos pondremos en contacto contigo pronto.',
                'data' => $cita
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Error al solicitar cita: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al procesar la solicitud de cita',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener citas del usuario logueado
     */
    public function misCitas(Request $request)
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
                    'message' => 'No tienes citas programadas'
                ]);
            }

            // Obtener citas del cliente
            $todasLasCitas = $this->airtableService->getRecords('Citas');
            $misCitas = collect($todasLasCitas)->filter(function ($cita) use ($cliente) {
                return isset($cita['fields']['Cliente']) &&
                       in_array($cliente['id'], $cita['fields']['Cliente']);
            });

            return response()->json([
                'success' => true,
                'data' => $misCitas->values()->all(),
                'total' => $misCitas->count()
            ]);

        } catch (\Exception $e) {
            \Log::error('Error al obtener mis citas: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener tus citas',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
