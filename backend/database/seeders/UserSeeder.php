<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Usuario administrador
        User::create([
            'name' => 'Administrador',
            'email' => 'admin@inmotable.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        // Usuario agente
        User::create([
            'name' => 'Agente Inmobiliario',
            'email' => 'agente@inmotable.com',
            'password' => Hash::make('password123'),
            'role' => 'agente',
            'status' => 'active',
        ]);

        // Usuario cliente
        User::create([
            'name' => 'Cliente Test',
            'email' => 'cliente@inmotable.com',
            'password' => Hash::make('password123'),
            'role' => 'cliente',
            'status' => 'active',
        ]);

        // Usuario de prueba
        User::create([
            'name' => 'Usuario Prueba',
            'email' => 'test@inmotable.com',
            'password' => Hash::make('password123'),
            'role' => 'cliente',
            'status' => 'active',
        ]);
    }
}
