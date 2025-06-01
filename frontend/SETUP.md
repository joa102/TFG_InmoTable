# 🚀 Setup del Frontend

## 📋 Configuración de Environment

### 1. Copiar template de configuración
```bash
cp src/environments/environment.template.ts src/environments/environment.ts
```

### 2. Configurar credenciales de Airtable

Edita `src/environments/environment.ts` y reemplaza:

- `TU_BASE_ID_AQUI` → Tu Base ID de Airtable
- `TU_API_KEY_AQUI` → Tu Personal Access Token de Airtable

### 3. Generar API Key de Airtable

1. Ve a: https://airtable.com/create/tokens
2. Crea un nuevo token con permisos: `data.records:read`
3. Selecciona tu base
4. Copia el token generado

### 4. Instalar dependencias
```bash
npm install
```

### 5. Ejecutar aplicación
```bash
npm start
```

## 🔒 Seguridad

- ❌ **NUNCA** subas `environment.ts` a git
- ✅ Solo sube `environment.template.ts`
- 🔑 Las API keys deben estar siempre en variables de entorno
