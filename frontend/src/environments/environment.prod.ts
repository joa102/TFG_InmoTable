export const environment = {
  production: true,
  //apiUrl: 'http://localhost:8000/api',
  apiUrl: 'https://tfg-inmotable.onrender.com/api',
  apiTimeout: 30000,
  appName: 'InmobTable',
  version: '1.0.0',

  // 🔥 CONFIGURACIÓN CENTRALIZADA DE EMPRESA PARA PRODUCCIÓN
  empresa: {
    nombre: 'InmoTable',              // 🎯 CAMBIAR AQUÍ PARA OTRA EMPRESA
    nombreFallback: 'InmoTable',
    idFallback: 'fas fa-home',
  },

  // Configuración de Airtable
  airtable: {
    apiUrl: 'https://api.airtable.com/v0',
    baseId: 'apphONbM2nnoZThgr',
    apiKey: 'patQUbYDe8i2I10mo.fbed24da061f8c96b9929b9c5a697244e542b8be58e813fa4f49c5801af60861',
    tables: {
      propiedades: 'Propiedades',
      clientes: 'Clientes',
      agentes: 'Agentes',
      citas: 'Citas',
      usuarios: 'Usuarios',
      empresa: 'Empresa'
    }
  },
  api: {
    baseUrl: 'https://tu-api-production.com/api'
    //baseUrl: 'https://tfg-inmotable.onrender.com/api'
  }
};
