<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AirtableService
{
    private $token; // 🔥 CAMBIAR DE apiKey a token
    private $baseId;
    private $baseUrl = 'https://api.airtable.com/v0';

    public function __construct()
    {
        $this->token = env('AIRTABLE_TOKEN'); // 🔥 USAR AIRTABLE_TOKEN en lugar de AIRTABLE_API_KEY
        $this->baseId = env('AIRTABLE_BASE_ID');

        if (!$this->token || !$this->baseId) {
            throw new \Exception('Airtable Token y Base ID son requeridos'); // 🔥 CAMBIAR MENSAJE
        }
    }

    /**
     * Obtener registros de una tabla
     */
    public function getRecords($tableName, $filters = [])
    {
        try {
            $url = "{$this->baseUrl}/{$this->baseId}/{$tableName}";

            Log::info("🔍 Consultando Airtable", [
                'url' => $url,
                'table' => $tableName,
                'filters' => $filters
            ]);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token, // 🔥 USAR token en lugar de apiKey
            ])->get($url, $filters);

            if ($response->successful()) {
                $data = $response->json();
                $records = collect($data['records'] ?? [])->map(function ($record) {
                    return [
                        'id' => $record['id'],
                        'recordId' => $record['id'],
                        'createdTime' => $record['createdTime'] ?? null,
                        ...$this->transformFields($record['fields'] ?? [])
                    ];
                })->toArray();

                Log::info("✅ Registros obtenidos exitosamente", [
                    'count' => count($records),
                    'records' => $records
                ]);

                return $records;
            } else {
                Log::error("❌ Error en respuesta de Airtable", [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception("Error al obtener registros: " . $response->body());
            }
        } catch (\Exception $e) {
            Log::error("❌ Error en getRecords", [
                'exception' => $e->getMessage(),
                'table' => $tableName,
                'filters' => $filters
            ]);
            throw $e;
        }
    }

    /**
     * Obtener un registro específico
     */
    public function getRecord($tableName, $recordId)
    {
        try {
            $url = "{$this->baseUrl}/{$this->baseId}/{$tableName}/{$recordId}";

            Log::info("🔍 Consultando registro específico", [
                'url' => $url,
                'table' => $tableName,
                'recordId' => $recordId
            ]);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token, // 🔥 USAR token
            ])->get($url);

            if ($response->successful()) {
                $record = $response->json();
                $result = [
                    'id' => $record['id'],
                    'recordId' => $record['id'],
                    'createdTime' => $record['createdTime'] ?? null,
                    ...$this->transformFields($record['fields'] ?? [])
                ];

                Log::info("✅ Registro obtenido exitosamente", $result);
                return $result;
            } else {
                Log::error("❌ Error al obtener registro", [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return null;
            }
        } catch (\Exception $e) {
            Log::error("❌ Error en getRecord", [
                'exception' => $e->getMessage(),
                'table' => $tableName,
                'recordId' => $recordId
            ]);
            throw $e;
        }
    }

    /**
     * Transformar campos de Airtable al formato esperado
     */
    private function transformFields($fields)
    {
        $transformed = [];

        foreach ($fields as $key => $value) {
            // Convertir nombres de campos a camelCase
            $fieldName = $this->transformFieldName($key);
            $transformed[$fieldName] = $value;
        }

        return $transformed;
    }

    /**
     * Transformar nombre de campo
     */
    private function transformFieldName($fieldName)
    {
        // Mapeo específico para empresas
        $mapping = [
            'ID Empresa' => 'idEmpresa',
            'Nombre' => 'nombre',
            'Logo' => 'logo',
            'Estado' => 'estado'
        ];

        return $mapping[$fieldName] ?? strtolower(str_replace(' ', '_', $fieldName));
    }

    /**
     * Crear un nuevo registro
     */
    public function createRecord($tableName, $fields)
    {
        try {
            $url = "{$this->baseUrl}/{$this->baseId}/{$tableName}";

            $data = [
                'fields' => $fields
            ];

            Log::info("🔨 Creando registro en Airtable", [
                'url' => $url,
                'table' => $tableName,
                'data' => $data
            ]);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token, // 🔥 USAR token
                'Content-Type' => 'application/json',
            ])->post($url, $data);

            if ($response->successful()) {
                $record = $response->json();
                $result = [
                    'id' => $record['id'],
                    'recordId' => $record['id'],
                    'createdTime' => $record['createdTime'] ?? null,
                    ...$this->transformFields($record['fields'] ?? [])
                ];

                Log::info("✅ Registro creado exitosamente", $result);
                return $result;
            } else {
                Log::error("❌ Error al crear registro", [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception("Error al crear registro: " . $response->body());
            }
        } catch (\Exception $e) {
            Log::error("❌ Error en createRecord", [
                'exception' => $e->getMessage(),
                'table' => $tableName,
                'fields' => $fields
            ]);
            throw $e;
        }
    }

    /**
     * Actualizar un registro
     */
    public function updateRecord($tableName, $recordId, $fields)
    {
        try {
            $url = "{$this->baseUrl}/{$this->baseId}/{$tableName}/{$recordId}";

            $data = [
                'fields' => $fields
            ];

            Log::info("📝 Actualizando registro en Airtable", [
                'url' => $url,
                'table' => $tableName,
                'recordId' => $recordId,
                'data' => $data
            ]);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token, // 🔥 USAR token
                'Content-Type' => 'application/json',
            ])->patch($url, $data);

            if ($response->successful()) {
                $record = $response->json();
                $result = [
                    'id' => $record['id'],
                    'recordId' => $record['id'],
                    'createdTime' => $record['createdTime'] ?? null,
                    ...$this->transformFields($record['fields'] ?? [])
                ];

                Log::info("✅ Registro actualizado exitosamente", $result);
                return $result;
            } else {
                Log::error("❌ Error al actualizar registro", [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception("Error al actualizar registro: " . $response->body());
            }
        } catch (\Exception $e) {
            Log::error("❌ Error en updateRecord", [
                'exception' => $e->getMessage(),
                'table' => $tableName,
                'recordId' => $recordId,
                'fields' => $fields
            ]);
            throw $e;
        }
    }

    /**
     * Eliminar un registro
     */
    public function deleteRecord($tableName, $recordId)
    {
        try {
            $url = "{$this->baseUrl}/{$this->baseId}/{$tableName}/{$recordId}";

            Log::info("🗑️ Eliminando registro en Airtable", [
                'url' => $url,
                'table' => $tableName,
                'recordId' => $recordId
            ]);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token, // 🔥 USAR token
            ])->delete($url);

            if ($response->successful()) {
                Log::info("✅ Registro eliminado exitosamente");
                return true;
            } else {
                Log::error("❌ Error al eliminar registro", [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception("Error al eliminar registro: " . $response->body());
            }
        } catch (\Exception $e) {
            Log::error("❌ Error en deleteRecord", [
                'exception' => $e->getMessage(),
                'table' => $tableName,
                'recordId' => $recordId
            ]);
            throw $e;
        }
    }
}
