<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class AirtableService
{
    const AUTHORIZATION_PREFIX = 'Bearer ';
    const CONTENT_TYPE_JSON = 'application/json';

    protected $accessToken;
    protected $baseId;

    public function __construct()
    {
        $this->accessToken = config('services.airtable.token');
        $this->baseId = config('services.airtable.base_id');
    }

    /**
     * Obtener todos los registros de una tabla específica
     */
    public function getRecords(string $tableName, array $filters = [])
    {
        $allRecords = [];
        $offset = null;
        $requestCount = 0;
        $maxRequests = 20;

        do {
            $requestCount++;
            if ($requestCount > $maxRequests) {
                \Log::warning("Airtable: Máximo número de requests alcanzado ({$maxRequests}). Total registros obtenidos: " . count($allRecords));
                break;
            }

            $url = "https://api.airtable.com/v0/{$this->baseId}/{$tableName}";

            $queryParams = [
                'pageSize' => 100,
            ];

            // Agregar filtros si existen
            if (!empty($filters)) {
                $queryParams = array_merge($queryParams, $filters);
            }

            if ($offset) {
                $queryParams['offset'] = $offset;
            }

            \Log::info("Airtable request #{$requestCount}" . ($offset ? " con offset: {$offset}" : " (primera página)"));

            $response = Http::withHeaders([
                'Authorization' => self::AUTHORIZATION_PREFIX . $this->accessToken,
                'Content-Type'  => self::CONTENT_TYPE_JSON
            ])->get($url, $queryParams);

            if ($response->failed()) {
                \Log::error('Error en petición a Airtable: ' . $response->body());
                throw new \Exception('Error al obtener los registros de Airtable: ' . $response->body());
            }

            $data = $response->json();

            if (isset($data['records']) && is_array($data['records'])) {
                $allRecords = array_merge($allRecords, $data['records']);
                \Log::info("Registros obtenidos en request #{$requestCount}: " . count($data['records']));
            }

            $offset = $data['offset'] ?? null;

        } while ($offset && $requestCount < $maxRequests);

        \Log::info("Total final de registros de {$tableName}: " . count($allRecords));

        return $allRecords;
    }

    /**
     * Obtener un registro específico por ID
     */
    public function getRecord(string $tableName, string $recordId)
    {
        $url = "https://api.airtable.com/v0/{$this->baseId}/{$tableName}/{$recordId}";

        $response = Http::withHeaders([
            'Authorization' => self::AUTHORIZATION_PREFIX . $this->accessToken,
            'Content-Type'  => self::CONTENT_TYPE_JSON
        ])->get($url);

        if ($response->failed()) {
            \Log::error('Error al obtener registro de Airtable: ' . $response->body());
            throw new \Exception('Error al obtener el registro: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Crear un nuevo registro
     */
    public function createRecord(string $tableName, array $fields)
    {
        $url = "https://api.airtable.com/v0/{$this->baseId}/{$tableName}";

        $data = [
            'fields' => $fields
        ];

        $response = Http::withHeaders([
            'Authorization' => self::AUTHORIZATION_PREFIX . $this->accessToken,
            'Content-Type'  => self::CONTENT_TYPE_JSON
        ])->post($url, $data);

        if ($response->failed()) {
            \Log::error('Error al crear registro en Airtable: ' . $response->body());
            throw new \Exception('Error al crear el registro: ' . $response->body());
        }

        \Log::info("Registro creado en {$tableName}: " . $response->json()['id']);

        return $response->json();
    }

    /**
     * Actualizar un registro existente
     */
    public function updateRecord(string $tableName, string $recordId, array $fields)
    {
        $url = "https://api.airtable.com/v0/{$this->baseId}/{$tableName}/{$recordId}";

        $data = [
            'fields' => $fields
        ];

        $response = Http::withHeaders([
            'Authorization' => self::AUTHORIZATION_PREFIX . $this->accessToken,
            'Content-Type'  => self::CONTENT_TYPE_JSON
        ])->patch($url, $data);

        if ($response->failed()) {
            \Log::error('Error al actualizar registro en Airtable: ' . $response->body());
            throw new \Exception('Error al actualizar el registro: ' . $response->body());
        }

        \Log::info("Registro actualizado en {$tableName}: " . $recordId);

        return $response->json();
    }

    /**
     * Eliminar un registro
     */
    public function deleteRecord(string $tableName, string $recordId)
    {
        $url = "https://api.airtable.com/v0/{$this->baseId}/{$tableName}/{$recordId}";

        $response = Http::withHeaders([
            'Authorization' => self::AUTHORIZATION_PREFIX . $this->accessToken,
            'Content-Type'  => self::CONTENT_TYPE_JSON
        ])->delete($url);

        if ($response->failed()) {
            \Log::error('Error al eliminar registro en Airtable: ' . $response->body());
            throw new \Exception('Error al eliminar el registro: ' . $response->body());
        }

        \Log::info("Registro eliminado en {$tableName}: " . $recordId);

        return $response->json();
    }

    /**
     * Crear múltiples registros de una vez (batch)
     */
    public function createMultipleRecords(string $tableName, array $recordsData)
    {
        $url = "https://api.airtable.com/v0/{$this->baseId}/{$tableName}";

        // Airtable permite máximo 10 registros por batch
        $chunks = array_chunk($recordsData, 10);
        $allCreatedRecords = [];

        foreach ($chunks as $chunk) {
            $data = [
                'records' => array_map(function($fields) {
                    return ['fields' => $fields];
                }, $chunk)
            ];

            $response = Http::withHeaders([
                'Authorization' => self::AUTHORIZATION_PREFIX . $this->accessToken,
                'Content-Type'  => self::CONTENT_TYPE_JSON
            ])->post($url, $data);

            if ($response->failed()) {
                \Log::error('Error al crear registros batch en Airtable: ' . $response->body());
                throw new \Exception('Error al crear los registros: ' . $response->body());
            }

            $result = $response->json();
            if (isset($result['records'])) {
                $allCreatedRecords = array_merge($allCreatedRecords, $result['records']);
            }
        }

        \Log::info("Registros batch creados en {$tableName}: " . count($allCreatedRecords));

        return $allCreatedRecords;
    }

    /**
     * Buscar registros con filtros específicos
     */
    public function searchRecords(string $tableName, string $filterFormula)
    {
        return $this->getRecords($tableName, [
            'filterByFormula' => $filterFormula
        ]);
    }

    /**
     * Obtener registros ordenados
     */
    public function getRecordsOrdered(string $tableName, array $sort = [])
    {
        $filters = [];

        if (!empty($sort)) {
            $filters['sort'] = $sort;
        }

        return $this->getRecords($tableName, $filters);
    }
}
