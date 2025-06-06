<?php

namespace App\Http\Controllers;

use App\Services\AirtableService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EmpresaController extends Controller
{
    protected $airtableService;

    public function __construct(AirtableService $airtableService)
    {
        $this->airtableService = $airtableService;
    }

    /**
     * 🏢 PÚBLICO: Listar empresas (sin autenticación)
     */
    public function index(Request $request)
    {
        try {
            $filters = [];

            // Filtros opcionales
            if ($request->has('search')) {
                $search = $request->get('search');
                $filters['filterByFormula'] = "OR(FIND(LOWER('{$search}'), LOWER({Nombre})), FIND(LOWER('{$search}'), LOWER({ID Empresa})))";
            }

            if ($request->has('estado')) {
                $estado = $request->get('estado');
                $existingFormula = $filters['filterByFormula'] ?? '';
                $stateFormula = "{Estado} = '{$estado}'";

                $filters['filterByFormula'] = $existingFormula ?
                    "AND({$stateFormula}, {$existingFormula})" :
                    $stateFormula;
            }

            // Filtro específico por nombre exacto
            if ($request->has('filterByFormula')) {
                $filters['filterByFormula'] = $request->get('filterByFormula');
            }

            // Ordenar por nombre por defecto
            $filters['sort'] = [
                [
                    'field' => 'Nombre',
                    'direction' => 'asc'
                ]
            ];

            $empresas = $this->airtableService->getRecords('Empresa', $filters);

            return response()->json([
                'success' => true,
                'data' => $empresas,
                'total' => count($empresas),
                'filters_applied' => $filters
            ]);

        } catch (\Exception $e) {
            \Log::error('Error al obtener empresas: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las empresas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🏢 PÚBLICO: Obtener empresa por ID
     */
    public function show($id)
    {
        try {
            $empresa = $this->airtableService->getRecord('Empresa', $id);

            if (!$empresa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Empresa no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $empresa
            ]);

        } catch (\Exception $e) {
            \Log::error('Error al obtener empresa: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la empresa',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔒 Crear nueva empresa (requiere autenticación de admin)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_empresa' => 'required|string|max:50',
            'nombre' => 'required|string|max:255',
            'logo' => 'required|url',
            'estado' => 'required|in:Activo,Inactivo'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $empresaData = [
                'ID Empresa' => $request->id_empresa,
                'Nombre' => $request->nombre,
                'Logo' => $request->logo,
                'Estado' => $request->estado
            ];

            $empresa = $this->airtableService->createRecord('Empresa', $empresaData);

            return response()->json([
                'success' => true,
                'message' => 'Empresa creada exitosamente',
                'data' => $empresa
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Error al crear empresa: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al crear la empresa',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
