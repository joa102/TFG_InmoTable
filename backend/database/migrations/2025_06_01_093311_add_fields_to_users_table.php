<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('cliente')->after('email'); // cliente, agente, admin
            $table->string('airtable_id')->nullable()->after('role'); // ID del registro en Airtable
            $table->string('status')->default('active')->after('airtable_id'); // active, inactive, suspended
            $table->timestamp('last_login_at')->nullable()->after('status');

            // Índices para mejorar rendimiento
            $table->index('role');
            $table->index('status');
            $table->index('airtable_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['status']);
            $table->dropIndex(['airtable_id']);

            $table->dropColumn([
                'role',
                'airtable_id',
                'status',
                'last_login_at'
            ]);
        });
    }
};
