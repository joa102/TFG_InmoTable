<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    //'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'paths' => ['*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        // 🔥 DESARROLLO
        'http://localhost:4200',
        'http://127.0.0.1:4200',
        'http://localhost:3000',

        // 🔥 PRODUCCIÓN - AÑADIR TU DOMINIO DE VERCEL
        'https://tfg-inmo-table-git-features-juandis-projects-f502d067.vercel.app',     // 🔥 Tu dominio real de Vercel
        'https://tfg-inmo-table-4kg810yyq-juandis-projects-f502d067.vercel.app',         // 🔥 Si tienes otro dominio
        'https://tfg-inmo-table-git-main-juandis-projects-f502d067.vercel.app',            // 🔥 Reemplaza con tu dominio real

        // 🔥 RENDER BACKEND (para pruebas internas)
        'https://tfg-inmotable.onrender.com',
    ],

    'allowed_origins_patterns' => [
        // 🔥 PATRONES PARA DOMINIOS DINÁMICOS DE VERCEL
        '/^https:\/\/.*\.vercel\.app$/',
        '/^https:\/\/.*-.*\.vercel\.app$/',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
