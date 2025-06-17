<?php

namespace App\Http\Controllers;

use App\Services\AirtableService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PropertyController extends Controller
{
    protected $airtableService;

    public function __construct(AirtableService $airtableService)
    {
        $this->airtableService = $airtableService;
    }

    /**
     * 🔥 PÚBLICO: Listar propiedades (sin autenticación)
     */
    public function index(Request $request)
    {
        try {
            $filters = [];
            $queryParams = [];

            // 🔍 FILTROS DISPONIBLES
            if ($request->has('tipo') && $request->tipo !== 'all') {
                $tipo = $request->get('tipo');
                $filters[] = "{Tipo} = '{$tipo}'";
            }

            if ($request->has('zona') && $request->zona !== 'all') {
                $zona = $request->get('zona');
                $filters[] = "FIND(LOWER('{$zona}'), LOWER({Dirección}))";
            }

            if ($request->has('precio_min')) {
                $precioMin = $request->get('precio_min');
                $filters[] = "{Precio} >= {$precioMin}";
            }

            if ($request->has('precio_max')) {
                $precioMax = $request->get('precio_max');
                $filters[] = "{Precio} <= {$precioMax}";
            }

            if ($request->has('habitaciones')) {
                $habitaciones = $request->get('habitaciones');
                $filters[] = "{Habitaciones} >= {$habitaciones}";
            }

            if ($request->has('superficie_min')) {
                $superficieMin = $request->get('superficie_min');
                $filters[] = "{Superficie} >= {$superficieMin}";
            }

            // Solo mostrar propiedades disponibles por defecto
            if (!$request->has('estado')) {
                $filters[] = "{Estado} = 'Disponible'";
            } else if ($request->estado !== 'all') {
                $estado = $request->get('estado');
                $filters[] = "{Estado} = '{$estado}'";
            }

            // Combinar filtros
            if (!empty($filters)) {
                $queryParams['filterByFormula'] = 'AND(' . implode(', ', $filters) . ')';
            }

            // Ordenamiento
            $sortField = $request->get('sort_by', 'Fecha de Registro');
            $sortDirection = $request->get('sort_direction', 'desc');

            $queryParams['sort'] = [
                [
                    'field' => $sortField,
                    'direction' => $sortDirection
                ]
            ];

            $propiedades = $this->airtableService->getRecords('Propiedades', $queryParams);

            // 🔍 BÚSQUEDA POR TEXTO
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = strtolower($request->search);
                $propiedades = array_filter($propiedades, function($propiedad) use ($searchTerm) {
                    $fields = $propiedad['fields'];
                    $searchableText = strtolower(
                        ($fields['Título'] ?? '') . ' ' .
                        ($fields['Descripción'] ?? '') . ' ' .
                        ($fields['Dirección'] ?? '') . ' ' .
                        ($fields['Tipo'] ?? '')
                    );
                    return strpos($searchableText, $searchTerm) !== false;
                });
                $propiedades = array_values($propiedades); // Reindexar array
            }

            // 📊 ESTADÍSTICAS
            $estadisticas = [
                'total' => count($propiedades),
                'filtros_aplicados' => $request->except(['page', 'per_page']),
                'disponibles' => count(array_filter($propiedades, function($p) {
                    return ($p['fields']['Estado'] ?? '') === 'Disponible';
                }))
            ];

            return response()->json([
                'success' => true,
                'data' => $propiedades,
                'estadisticas' => $estadisticas
            ]);

        } catch (\Exception $e) {
            Log::error('Error al obtener propiedades: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las propiedades',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔥 PÚBLICO: Mostrar propiedad específica (sin autenticación)
     */
    public function show(string $id)
    {
        try {
            $propiedad = $this->airtableService->getRecord('Propiedades', $id);

            // Incrementar contador de visitas
            $this->incrementarVisitas($id);

            return response()->json([
                'success' => true,
                'data' => $propiedad
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Propiedad no encontrada',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * 🔒 PROTEGIDO: Crear nueva propiedad (requiere autenticación)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:255',
            'descripcion' => 'required|string',
            'precio' => 'required|numeric|min:0',
            'tipo' => 'required|in:Casa,Apartamento,Local,Oficina,Terreno',
            'habitaciones' => 'nullable|integer|min:0',
            'banos' => 'nullable|integer|min:0',
            'superficie' => 'required|numeric|min:0',
            'direccion' => 'required|string|max:500',
            'coordenadas' => 'nullable|string',
            'imagenes' => 'nullable|array',
            'año_construccion' => 'nullable|integer|min:1800|max:' . date('Y'),
            'estado_conservacion' => 'nullable|in:Excelente,Bueno,Regular,A reformar',
            'clasificacion_energetica' => 'nullable|in:A,B,C,D,E,F,G'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Generar ID único para la propiedad
            $ultimoId = $this->obtenerUltimoIdPropiedad();
            $nuevoId = 'PROP' . str_pad($ultimoId + 1, 4, '0', STR_PAD_LEFT);

            $propiedadData = [
                'ID Propiedad' => $nuevoId,
                'Título' => $request->titulo,
                'Descripción' => $request->descripcion,
                'Precio' => $request->precio,
                'Tipo' => $request->tipo,
                'Estado' => 'Disponible',
                'Fecha de Registro' => now()->toISOString(),
                'Superficie' => $request->superficie,
                'Dirección' => $request->direccion,
                'Número de visitas' => 0
            ];

            // Campos opcionales
            if ($request->filled('habitaciones')) {
                $propiedadData['Habitaciones'] = $request->habitaciones;
            }

            if ($request->filled('banos')) {
                $propiedadData['Baños'] = $request->banos;
            }

            if ($request->filled('año_construccion')) {
                $propiedadData['Año Construcción'] = $request->año_construccion;
            }

            if ($request->filled('estado_conservacion')) {
                $propiedadData['Estado de Conservación'] = $request->estado_conservacion;
            }

            if ($request->filled('clasificacion_energetica')) {
                $propiedadData['Clasificación Energética'] = $request->clasificacion_energetica;
            }

            if ($request->filled('coordenadas')) {
                $propiedadData['Coordenadas (Lat, Lng)'] = $request->coordenadas;
            }

            if ($request->filled('imagenes')) {
                $propiedadData['Imágenes'] = $request->imagenes;
            }

            // Calcular precio por m2
            if ($request->superficie > 0) {
                $propiedadData['Precio m2'] = round($request->precio / $request->superficie, 2);
            }

            $propiedad = $this->airtableService->createRecord('Propiedades', $propiedadData);

            return response()->json([
                'success' => true,
                'message' => 'Propiedad creada correctamente',
                'data' => $propiedad
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error al crear propiedad: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al crear la propiedad',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔒 PROTEGIDO: Actualizar propiedad (requiere autenticación)
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'titulo' => 'sometimes|required|string|max:255',
            'descripcion' => 'sometimes|required|string',
            'precio' => 'sometimes|required|numeric|min:0',
            'tipo' => 'sometimes|required|in:Casa,Apartamento,Local,Oficina,Terreno',
            'estado' => 'sometimes|in:Disponible,Reservada,Vendida,Retirada',
            'habitaciones' => 'nullable|integer|min:0',
            'banos' => 'nullable|integer|min:0',
            'superficie' => 'sometimes|required|numeric|min:0',
            'direccion' => 'sometimes|required|string|max:500',
            'coordenadas' => 'nullable|string',
            'imagenes' => 'nullable|array'
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

            // Mapear campos del request a campos de Airtable
            $fieldMapping = [
                'titulo' => 'Título',
                'descripcion' => 'Descripción',
                'precio' => 'Precio',
                'tipo' => 'Tipo',
                'estado' => 'Estado',
                'habitaciones' => 'Habitaciones',
                'banos' => 'Baños',
                'superficie' => 'Superficie',
                'direccion' => 'Dirección',
                'coordenadas' => 'Coordenadas (Lat, Lng)',
                'imagenes' => 'Imágenes'
            ];

            foreach ($fieldMapping as $requestField => $airtableField) {
                if ($request->has($requestField)) {
                    $updateData[$airtableField] = $request->get($requestField);
                }
            }

            // Recalcular precio por m2 si cambió precio o superficie
            if ($request->has('precio') || $request->has('superficie')) {
                $propiedadActual = $this->airtableService->getRecord('Propiedades', $id);
                $precio = $request->get('precio', $propiedadActual['fields']['Precio'] ?? 0);
                $superficie = $request->get('superficie', $propiedadActual['fields']['Superficie'] ?? 0);

                if ($superficie > 0) {
                    $updateData['Precio m2'] = round($precio / $superficie, 2);
                }
            }

            // Actualizar fecha de venta si se marca como vendida
            if ($request->has('estado') && $request->estado === 'Vendida') {
                $updateData['Fecha de Venta'] = now()->toISOString();
            }

            $propiedad = $this->airtableService->updateRecord('Propiedades', $id, $updateData);

            return response()->json([
                'success' => true,
                'message' => 'Propiedad actualizada correctamente',
                'data' => $propiedad
            ]);

        } catch (\Exception $e) {
            Log::error('Error al actualizar propiedad: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la propiedad',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔒 PROTEGIDO: Eliminar propiedad (requiere autenticación)
     */
    public function destroy(string $id)
    {
        try {
            // Verificar si la propiedad tiene citas activas
            $citas = $this->airtableService->searchRecords('Citas',
                "AND({Propiedad} = '{$id}', OR({Estado} = 'Pendiente', {Estado} = 'Confirmada'))"
            );

            if (!empty($citas)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar la propiedad porque tiene citas activas',
                    'citas_activas' => count($citas)
                ], 409);
            }

            $this->airtableService->deleteRecord('Propiedades', $id);

            return response()->json([
                'success' => true,
                'message' => 'Propiedad eliminada correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la propiedad',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔥 PÚBLICO: Enviar mensaje de contacto
     */
    public function enviarContacto(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'email' => 'required|email',
            'telefono' => 'nullable|string|max:20',
            'mensaje' => 'required|string|max:1000',
            'propiedad_id' => 'nullable|string'
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
                    'Teléfono' => $request->telefono ?? '',
                    'Fecha de Registro' => now()->toISOString(),
                    'Comentarios' => 'Contacto desde web: ' . $request->mensaje
                ];

                $clienteExistente = $this->airtableService->createRecord('Clientes', $clienteData);
            } else {
                // Actualizar comentarios del cliente existente
                $comentariosActuales = $clienteExistente['fields']['Comentarios'] ?? '';
                $nuevosComentarios = $comentariosActuales . "\n\n[" . now()->format('Y-m-d H:i') . "] " . $request->mensaje;

                $this->airtableService->updateRecord('Clientes', $clienteExistente['id'], [
                    'Comentarios' => $nuevosComentarios
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Mensaje de contacto enviado correctamente. Nos pondremos en contacto contigo pronto.'
            ]);

        } catch (\Exception $e) {
            Log::error('Error al enviar contacto: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al enviar el mensaje de contacto',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔥 PÚBLICO: Obtener propiedades destacadas
     */
    public function destacadas()
    {
        try {
            // Obtener propiedades con más visitas
            $propiedades = $this->airtableService->getRecordsOrdered('Propiedades', [
                [
                    'field' => 'Número de visitas',
                    'direction' => 'desc'
                ]
            ]);

            // Filtrar solo disponibles y tomar las primeras 6
            $destacadas = array_slice(
                array_filter($propiedades, function($propiedad) {
                    return ($propiedad['fields']['Estado'] ?? '') === 'Disponible';
                }),
                0,
                6
            );

            return response()->json([
                'success' => true,
                'data' => $destacadas,
                'total' => count($destacadas)
            ]);

        } catch (\Exception $e) {
            Log::error('Error al obtener propiedades destacadas: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener propiedades destacadas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Método privado para incrementar visitas
     */
    private function incrementarVisitas(string $propiedadId)
    {
        try {
            $propiedad = $this->airtableService->getRecord('Propiedades', $propiedadId);
            $visitasActuales = $propiedad['fields']['Número de visitas'] ?? 0;

            $this->airtableService->updateRecord('Propiedades', $propiedadId, [
                'Número de visitas' => $visitasActuales + 1
            ]);
        } catch (\Exception $e) {
            Log::warning('No se pudo incrementar contador de visitas: ' . $e->getMessage());
        }
    }

    /**
     * Método privado para obtener último ID de propiedad
     */
    private function obtenerUltimoIdPropiedad()
    {
        try {
            $propiedades = $this->airtableService->getRecords('Propiedades');
            $ultimoNumero = 0;

            foreach ($propiedades as $propiedad) {
                if (isset($propiedad['fields']['ID Propiedad'])) {
                    $idPropiedad = $propiedad['fields']['ID Propiedad'];
                    if (preg_match('/PROP(\d+)/', $idPropiedad, $matches)) {
                        $numero = intval($matches[1]);
                        if ($numero > $ultimoNumero) {
                            $ultimoNumero = $numero;
                        }
                    }
                }
            }

            return $ultimoNumero;
        } catch (\Exception $e) {
            Log::warning('Error al obtener último ID de propiedad: ' . $e->getMessage());
            return 0;
        }
    }
}
