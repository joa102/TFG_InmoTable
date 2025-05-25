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

    public function index()
    {
        $data = $this->airtable->getAllRecords();
        // Airtable te devolverá un array con 'records'
        // Retorna la respuesta al front (Angular)
        return response()->json($data);
    }

    public function show($id)
    {
        $property = $this->airtable->getRecord($id);

        if (isset($property['id'])) {
            return response()->json($property);
        } else {
            return response()->json(['error' => 'Propiedad no encontrada'], 404);
        }
    }

    public function store(Request $request)
    {
        // Valida la petición
        $request->validate([
            'titulo' => 'required|string',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric',
            'precio_m2' => 'nullable|numeric',
            'estado' => 'required|string',
            'fecha_registro' => 'nullable|date',
            'fecha_venta' => 'nullable|date',
            'dias_en_venta' => 'nullable|integer',
            'dias_hasta_su_venta' => 'nullable|integer',
            'citas' => 'nullable|string',
            'tipo' => 'required|string',
            'estado_conservacion' => 'nullable|string',
            'habitaciones' => 'nullable|integer',
            'banos' => 'nullable|integer',
            'superficie' => 'nullable|numeric',
            'anio_construccion' => 'nullable|integer',
            'clasificacion_energetica' => 'nullable|string',
            'direccion' => 'nullable|string',
            'coordenadas' => 'nullable|string',
            'imagenes' => 'nullable|string',
            'clientes' => 'nullable|string',
            'numero_de_visitas' => 'nullable|integer',
        ]);

        // Campos que espera Airtable en "fields"
        $fields = [
            'Título' => $request->titulo,
            'Descripción' => $request->descripcion,
            'Precio' => (float)$request->precio,
            'Precio m2' => $request->precio_m2,
            'Estado' => $request->estado,
            'Fecha de Registro' => $request->fecha_registro,
            'Fecha de Venta' => $request->fecha_venta,
            'Días en venta' => $request->dias_en_venta,
            'Días hasta su venta' => $request->dias_hasta_su_venta,
            'Citas' => $request->citas,
            'Tipo' => $request->tipo,
            'EstadoConservacion' => $request->estado_conservacion,
            'Habitaciones' => $request->habitaciones,
            'Baños' => $request->banos,
            'Superficie' => $request->superficie,
            'Año Construcción' => $request->anio_construccion,
            'Clasificación Energética' => $request->clasificacion_energetica,
            'Dirección' => $request->direccion,
            'Coordenadas (Lat, Lng)' => $request->coordenadas,
            'Imágenes' => $request->imagenes,
            'Clientes' => $request->clientes,
            'Número de visitas' => $request->numero_de_visitas,
        ];

        // Llamar al servicio de Airtable para crear el registro
        $newRecord = $this->airtable->createRecord($fields);

        return response()->json($newRecord, 201);
    }

    public function update(Request $request, $id)
    {
        // Validar los datos recibidos
        $request->validate([
            'titulo' => 'required|string',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric',
            'precio_m2' => 'nullable|numeric',
            'estado' => 'required|string',
            'fecha_registro' => 'nullable|date',
            'fecha_venta' => 'nullable|date',
            'dias_en_venta' => 'nullable|integer',
            'dias_hasta_su_venta' => 'nullable|integer',
            'citas' => 'nullable|string',
            'tipo' => 'required|string',
            'estado_conservacion' => 'nullable|string',
            'habitaciones' => 'nullable|integer',
            'banos' => 'nullable|integer',
            'superficie' => 'nullable|numeric',
            'anio_construccion' => 'nullable|integer',
            'clasificacion_energetica' => 'nullable|string',
            'direccion' => 'nullable|string',
            'coordenadas' => 'nullable|string',
            'imagenes' => 'nullable|string',
            'clientes' => 'nullable|string',
            'numero_de_visitas' => 'nullable|integer',
        ]);

        // Estructurar los datos para Airtable
        $fields = [
            'Título' => $request->titulo,
            'Descripción' => $request->descripcion,
            'Precio' => (float) $request->precio,
            'Precio m2' => $request->precio_m2,
            'Estado' => $request->estado,
            'Fecha de Registro' => $request->fecha_registro,
            'Fecha de Venta' => $request->fecha_venta,
            'Días en venta' => $request->dias_en_venta,
            'Días hasta su venta' => $request->dias_hasta_su_venta,
            'Citas' => $request->citas,
            'Tipo' => $request->tipo,
            'EstadoConservacion' => $request->estado_conservacion,
            'Habitaciones' => $request->habitaciones,
            'Baños' => $request->banos,
            'Superficie' => $request->superficie,
            'Año Construcción' => $request->anio_construccion,
            'Clasificación Energética' => $request->clasificacion_energetica,
            'Dirección' => $request->direccion,
            'Coordenadas (Lat, Lng)' => $request->coordenadas,
            'Imágenes' => $request->imagenes,
            'Clientes' => $request->clientes,
            'Número de visitas' => $request->numero_de_visitas,
        ];

        // Llamar al servicio de Airtable para actualizar el registro
        $updatedRecord = $this->airtable->updateRecord($id, $fields);

        return response()->json($updatedRecord, 200);
    }

    public function destroy($id)
    {
        $response = $this->airtable->deleteRecord($id);

        if (isset($response['deleted']) && $response['deleted'] === true) {
            return response()->json(['message' => 'Propiedad eliminada correctamente'], 200);
        } else {
            return response()->json(['error' => 'No se pudo eliminar la propiedad'], 500);
        }
    }

}
