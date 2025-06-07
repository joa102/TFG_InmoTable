export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  apiTimeout: 30000,
  appName: 'Inmobiliaria TFG',
  version: '1.0.0',
  // Configuración de Airtable
  airtable: {
    apiUrl: 'https://api.airtable.com/v0',
    baseId: 'apphONbM2nnoZThgr', // 🏗️ Aquí va tu base ID
    apiKey: 'patQUbYDe8i2I10mo.fbed24da061f8c96b9929b9c5a697244e542b8be58e813fa4f49c5801af60861', // 🔑 Aquí va tu API key
    tables: {
      propiedades: 'Propiedades',
      clientes: 'Clientes',
      agentes: 'Agentes',
      citas: 'Citas',
      usuarios: 'Usuarios',
      empresa: 'Empresa' // 🔥 AÑADIR TABLA DE EMPRESA
    }
  },
  api: {
    baseUrl: 'http://localhost:3000/api' // Para futuras APIs
  }
};
