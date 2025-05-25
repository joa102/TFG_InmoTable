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

    public function getAllRecords()
    {
        $url = "https://api.airtable.com/v0/{$this->baseId}/{$this->tableName}";

        $response = Http::withHeaders([
            'Authorization' => self::AUTHORIZATION_PREFIX . $this->accessToken,
            'Content-Type'  => self::CONTENT_TYPE_JSON
        ])->get($url);

        if ($response->failed()) {
            throw new AirtableException('Error al obtener los registros de Airtable: ' . $response->body());
        }

        return $response->json();
    }

    public function getRecord($id)
    {
        $url = "https://api.airtable.com/v0/{$this->baseId}/{$this->tableName}/{$id}";

        $response = Http::withHeaders([
            'Authorization' => self::AUTHORIZATION_PREFIX . $this->accessToken,
            'Content-Type' => self::CONTENT_TYPE_JSON
        ])->get($url);

        if ($response->failed()) {
            throw new AirtableException('Error al obtener el registro de Airtable: ' . $response->body());
        }

        return $response->json();
    }

    public function createRecord($fields)
    {
        $url = "https://api.airtable.com/v0/{$this->baseId}/{$this->tableName}";

        $response = Http::withHeaders([
            'Authorization' => self::AUTHORIZATION_PREFIX . $this->accessToken,
            'Content-Type' => self::CONTENT_TYPE_JSON,
        ])->post($url, ['fields' => $fields]);

        if ($response->failed()) {
            throw new AirtableException('Error al crear el registro en Airtable: ' . $response->body());
        }

        return $response->json();
    }

    public function updateRecord($id, $fields)
    {
        $url = "https://api.airtable.com/v0/{$this->baseId}/{$this->tableName}/{$id}";

        $response = Http::withHeaders([
            'Authorization' => self::AUTHORIZATION_PREFIX . $this->accessToken,
            'Content-Type' => self::CONTENT_TYPE_JSON,
        ])->patch($url, ['fields' => $fields]);

        if ($response->failed()) {
            throw new AirtableException('Error al actualizar el registro en Airtable: ' . $response->body());
        }

        return $response->json();
    }

    public function deleteRecord($id)
    {
        $url = "https://api.airtable.com/v0/{$this->baseId}/{$this->tableName}/{$id}";

        $response = Http::withHeaders([
            'Authorization' => self::AUTHORIZATION_PREFIX . $this->accessToken,
            'Content-Type' => self::CONTENT_TYPE_JSON
        ])->delete($url);

        if ($response->failed()) {
            throw new AirtableException('Error al eliminar el registro en Airtable: ' . $response->body());
        }

        return $response->json();
    }
}

// Define the AirtableException class
class AirtableException extends \Exception {}
