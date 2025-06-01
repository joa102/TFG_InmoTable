export const environment = {
  production: true,
  //apiUrl: 'https://tu-dominio-produccion.com/api'  // Cambiar por tu URL real en producción
  apiUrl: 'http://localhost:8000/api', // Cambiar por tu URL real en producción
  apiTimeout: 30000,
  appName: 'InmobTable',
  version: '1.0.0',
  // Configuración de Airtable
  airtable: {
    apiUrl: 'https://api.airtable.com/v0',
    baseId: 'apphONbM2nnoZThgr', // 🏗️ Aquí va tu base ID
    apiKey: 'patQUbYDe8i2I10mo.fbed24da061f8c96b9929b9c5a697244e542b8be58e813fa4f49c5801af60861', // 🔑 En producción esto vendrá de variables de entorno del servidor
    tables: {
      propiedades: 'Propiedades',
      clientes: 'Clientes',
      agentes: 'Agentes',
      citas: 'Citas',
      usuarios: 'Usuarios'
    }
  },
  api: {
    baseUrl: 'https://tu-api-production.com/api'
  }
};
