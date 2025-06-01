<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',           // 🔥 NUEVO: Rol del usuario
        'airtable_id',    // 🔥 NUEVO: ID del registro en Airtable
        'status',         // 🔥 NUEVO: Estado del usuario
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * 🔥 NUEVO: Verificar si el usuario es administrador
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * 🔥 NUEVO: Verificar si el usuario es agente
     */
    public function isAgent(): bool
    {
        return $this->role === 'agente';
    }

    /**
     * 🔥 NUEVO: Verificar si el usuario es cliente
     */
    public function isClient(): bool
    {
        return $this->role === 'cliente';
    }

    /**
     * 🔥 NUEVO: Scope para filtrar por rol
     */
    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    /**
     * 🔥 NUEVO: Scope para usuarios activos
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
