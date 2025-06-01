/**
 * TEMPLATE DE CONFIGURACIÓN
 *
 * INSTRUCCIONES:
 * 1. Copia este archivo a 'environment.ts'
 * 2. Reemplaza los valores con tus credenciales reales
 * 3. Nunca subas environment.ts a git
 */

export const environment = {
  production: false,
  airtable: {
    apiUrl: 'https://api.airtable.com/v0',
    baseId: 'TU_BASE_ID_AQUI', // Ejemplo: apphK1kfstMHhCctk
    apiKey: 'TU_API_KEY_AQUI', // Ejemplo: patXXXXXXXXXXXXXXXX.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    tables: {
      propiedades: 'Propiedades',
      clientes: 'Clientes',
      agentes: 'Agentes',
      citas: 'Citas',
      usuarios: 'Usuarios'
    }
  },
  api: {
    baseUrl: 'http://localhost:3000/api'
  }
};
