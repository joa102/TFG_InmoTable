<?php

namespace App\Http\Controllers;

use App\Services\AirtableService;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    protected $airtable;

    public function __construct(AirtableService $airtable)
    {
        $this->airtable = $airtable;
    }

    // 🔥 MEJORADO: Ahora obtiene TODOS los registros automáticamente
    public function index()
    {
        try {
            \Log::info('PropertyController: Iniciando carga de propiedades');

            $data = $this->airtable->getRecords();

            \Log::info('PropertyController: Propiedades cargadas exitosamente', [
                'total' => $data['total'],
                'requests' => $data['requests_made'],
                'has_more' => $data['has_more']
            ]);

            // 🔥 MANTENER: Misma estructura de respuesta para compatibilidad
            return response()->json([
                'records' => $data['records'],
                'total' => $data['total'],
                'metadata' => [
                    'requests_made' => $data['requests_made'],
                    'has_more_data' => $data['has_more'],
                    'loaded_at' => now()->toISOString()
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('PropertyController: Error cargando propiedades', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Error al cargar las propiedades',
                'message' => $e->getMessage(),
                'records' => [],
                'total' => 0
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $property = $this->airtable->getRecord($id);
            return response()->json($property);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $property = $this->airtable->createRecord($request->all());
            return response()->json($property, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $property = $this->airtable->updateRecord($id, $request->all());
            return response()->json($property);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function destroy($id)
    {
        try {
            $this->airtable->deleteRecord($id);
            return response()->json(['message' => 'Propiedad eliminada correctamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
