<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class AirtableService
{
    const AUTHORIZATION_PREFIX = 'Bearer ';
    const CONTENT_TYPE_JSON = 'application/json';

    protected $accessToken;
    protected $baseId;
    protected $tableName;

    public function __construct()
    {
        $this->accessToken = config('services.airtable.token');
        $this->baseId = config('services.airtable.base_id');
        $this->tableName = config('services.airtable.table_name');
    }

    // 🔥 MEJORADO: Método que obtiene TODOS los registros (sin límite de 100)
    public function getRecords()
    {
        $allRecords = [];
        $offset = null;
        $requestCount = 0;
        $maxRequests = 20; // Protección contra loops infinitos

        do {
            $requestCount++;
            if ($requestCount > $maxRequests) {
                \Log::warning("Airtable: Máximo número de requests alcanzado ({$maxRequests}). Total registros obtenidos: " . count($allRecords));
                break;
            }

            $url = "https://api.airtable.com/v0/{$this->baseId}/{$this->tableName}";

            $queryParams = [
                'pageSize' => 100, // Máximo que permite Airtable
            ];

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

            // Agregar registros de esta página
            if (isset($data['records']) && is_array($data['records'])) {
                $allRecords = array_merge($allRecords, $data['records']);
                \Log::info("Página #{$requestCount}: " . count($data['records']) . " registros. Total acumulado: " . count($allRecords));
            }

            // Verificar si hay más páginas
            $offset = $data['offset'] ?? null;

        } while ($offset !== null && $requestCount < $maxRequests);

        \Log::info("Airtable: Carga completa. Total registros: " . count($allRecords) . " en {$requestCount} requests");

        return [
            'records' => $allRecords,
            'total' => count($allRecords),
            'requests_made' => $requestCount,
            'has_more' => ($offset !== null) // Si quedó un offset, significa que hay más
        ];
    }

    public function getRecord($id)
    {
        $response = Http::withHeaders([
            'Authorization' => self::AUTHORIZATION_PREFIX . $this->accessToken,
            'Content-Type'  => self::CONTENT_TYPE_JSON
        ])->get("https://api.airtable.com/v0/{$this->baseId}/{$this->tableName}/{$id}");

        if ($response->failed()) {
            throw new \Exception('Error al obtener el registro de Airtable: ' . $response->body());
        }

        return $response->json();
    }

    public function createRecord($data)
    {
        $response = Http::withHeaders([
            'Authorization' => self::AUTHORIZATION_PREFIX . $this->accessToken,
            'Content-Type'  => self::CONTENT_TYPE_JSON
        ])->post("https://api.airtable.com/v0/{$this->baseId}/{$this->tableName}", [
            'fields' => $data
        ]);

        if ($response->failed()) {
            throw new \Exception('Error al crear el registro en Airtable: ' . $response->body());
        }

        return $response->json();
    }

    public function updateRecord($id, $data)
    {
        $response = Http::withHeaders([
            'Authorization' => self::AUTHORIZATION_PREFIX . $this->accessToken,
            'Content-Type'  => self::CONTENT_TYPE_JSON
        ])->patch("https://api.airtable.com/v0/{$this->baseId}/{$this->tableName}/{$id}", [
            'fields' => $data
        ]);

        if ($response->failed()) {
            throw new \Exception('Error al actualizar el registro en Airtable: ' . $response->body());
        }

        return $response->json();
    }

    public function deleteRecord($id)
    {
        $response = Http::withHeaders([
            'Authorization' => self::AUTHORIZATION_PREFIX . $this->accessToken,
            'Content-Type'  => self::CONTENT_TYPE_JSON
        ])->delete("https://api.airtable.com/v0/{$this->baseId}/{$this->tableName}/{$id}");

        if ($response->failed()) {
            throw new \Exception('Error al eliminar el registro de Airtable: ' . $response->body());
        }

        return $response->json();
    }
}

// Define the AirtableException class
class AirtableException extends \Exception {}
