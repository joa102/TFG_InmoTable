# 🏠 Sistema de Gestión Inmobiliaria - TFGJOA102

> Sistema web completo para la gestión de propiedades inmobiliarias con funcionalidades avanzadas de visualización, filtrado y mapas interactivos.

[![Angular](https://img.shields.io/badge/Angular-17+-red.svg)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Material Design](https://img.shields.io/badge/Material-Design-blue.svg)](https://material.angular.io/)
[![Leaflet](https://img.shields.io/badge/Leaflet-Maps-green.svg)](https://leafletjs.com/)

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Desarrollo](#-desarrollo)
- [Roadmap](#-roadmap)
- [Contribución](#-contribución)

## ✨ Características

### 🎯 Funcionalidades Principales

- **📂 Gestión CRUD Completa**: Crear, leer, actualizar y eliminar propiedades
- **🔍 Sistema de Filtros Avanzados**: Filtrado por zona, tipo, precio, superficie y operación
- **📱 Diseño Responsive**: Compatible con dispositivos móviles, tablets y desktop
- **🗺️ Mapas Interactivos**: Integración con Leaflet y OpenStreetMap para ubicaciones
- **📊 Gráficos de Visitas**: Visualización de estadísticas con Chart.js
- **🖼️ Galería de Imágenes**: Carrusel con vista en pantalla completa
- **⚡ Paginación Inteligente**: Navegación eficiente con información detallada
- **🎨 Material Design**: Interfaz moderna y accesible

### 🚀 Características Técnicas

- **🔄 Datos en Tiempo Real**: Integración con Airtable como backend
- **🧭 Geocodificación Automática**: Conversión automática de direcciones a coordenadas
- **📈 Gráficos Dinámicos**: Visualización de datos de visitas y estadísticas
- **🛡️ Manejo de Errores**: Sistema robusto de manejo de errores y estados de carga
- **♿ Accesibilidad**: Cumple con estándares WCAG 2.1
- **🎯 SEO Optimizado**: Meta tags y estructura semántica

## 🛠️ Tecnologías

### Frontend
- **Angular 17+** - Framework principal
- **TypeScript 5.0+** - Lenguaje de programación
- **Angular Material** - Componentes UI y theming
- **Leaflet** - Mapas interactivos
- **Chart.js** - Gráficos y visualizaciones
- **RxJS** - Programación reactiva
- **SCSS** - Preprocesador CSS

### Backend/Datos
- **Airtable** - Base de datos y API
- **OpenStreetMap** - Tiles de mapas
- **Nominatim** - Servicio de geocodificación

### Herramientas de Desarrollo
- **Angular CLI** - Herramientas de desarrollo
- **ESLint** - Linting de código
- **Prettier** - Formateo de código
- **Git** - Control de versiones

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+ y npm
- Angular CLI 17+
- Git

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/TFGJOA102.git
cd TFGJOA102
```

2. **Instalar dependencias del frontend**
```bash
cd frontend
npm install
```

3. **Configurar variables de entorno**
```bash
# Copiar el archivo de ejemplo
cp src/environments/environment.example.ts src/environments/environment.ts

# Editar las variables de Airtable
# AIRTABLE_API_KEY=tu_api_key
# AIRTABLE_BASE_ID=tu_base_id
```

4. **Ejecutar el proyecto**
```bash
npm start
# o
ng serve
```

5. **Abrir en el navegador**
```
http://localhost:4200
```

## 📖 Uso

### Navegación Principal

1. **Listado de Propiedades** (`/propiedades`)
   - Ver todas las propiedades disponibles
   - Aplicar filtros por zona, tipo, precio, superficie
   - Navegar con paginación
   - Acceder al detalle de cada propiedad

2. **Detalle de Propiedad** (`/propiedades/:id`)
   - Ver información completa de la propiedad
   - Navegar por galería de imágenes
   - Ver ubicación en mapa interactivo
   - Consultar gráfico de visitas
   - Revisar clasificación energética

3. **Gestión de Propiedades** (Admin)
   - Crear nuevas propiedades
   - Editar propiedades existentes
   - Eliminar propiedades

### Filtros Disponibles

- **Zona**: Filtrar por ubicación geográfica
- **Tipo de Inmueble**: Casa, Piso, Local, Oficina, etc.
- **Tipo de Operación**: Venta, Alquiler
- **Rango de Precio**: Precio mínimo y máximo
- **Superficie**: Metros cuadrados mínimos y máximos

## 📁 Estructura del Proyecto

```
TFGJOA102/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── properties/           # Módulo de propiedades
│   │   │   │   ├── property-list/    # Listado con filtros
│   │   │   │   ├── property-detail/  # Detalle con mapa
│   │   │   │   └── property-form/    # Formulario CRUD
│   │   │   ├── services/             # Servicios Angular
│   │   │   │   ├── property.service.ts
│   │   │   │   └── airtable.service.ts
│   │   │   ├── shared/               # Componentes compartidos
│   │   │   │   └── navbar/
│   │   │   ├── models/               # Interfaces TypeScript
│   │   │   └── guards/               # Guards de ruta
│   │   ├── assets/                   # Recursos estáticos
│   │   ├── environments/             # Configuración
│   │   └── styles/                   # Estilos globales
│   ├── angular.json                  # Configuración Angular
│   ├── package.json                  # Dependencias
│   └── tsconfig.json                 # Configuración TypeScript
├── docs/                             # Documentación
├── .gitignore
└── README.md
```

## 🔧 Desarrollo

### Comandos Disponibles

```bash
# Desarrollo
npm start                    # Servidor de desarrollo
npm run build               # Build de producción
npm run build:dev           # Build de desarrollo
npm run test                # Ejecutar tests
npm run lint                # Linting de código

# Específicos de Angular
ng generate component nombre # Generar componente
ng generate service nombre   # Generar servicio
ng generate guard nombre     # Generar guard
```

### Estructura de Ramas

- **main** - Producción estable
- **develop** - Desarrollo principal
- **feature/*** - Nuevas características
- **bugfix/*** - Corrección de errores
- **hotfix/*** - Correcciones urgentes

### Estándares de Código

- **ESLint** para calidad de código TypeScript
- **Prettier** para formateo consistente
- **Conventional Commits** para mensajes de commit
- **Angular Style Guide** para estructura y nomenclatura

## 🎯 Roadmap

### ✅ Fase 1 - Base (Completado)
- [x] Setup inicial Angular + Material
- [x] Integración con Airtable
- [x] CRUD básico de propiedades
- [x] Sistema de navegación

### ✅ Fase 2 - Filtros (Completado)
- [x] Filtros avanzados en listado
- [x] Paginación inteligente
- [x] Búsqueda por múltiples criterios
- [x] Estado de "sin resultados"

### ✅ Fase 3 - UI/UX (Completado)
- [x] Diseño responsive completo
- [x] Galería de imágenes con carrusel
- [x] Clasificación energética visual
- [x] Estados de carga y error

### ✅ Fase 4 - Visualización (Completado)
- [x] Gráficos de visitas con Chart.js
- [x] Indicadores de popularidad
- [x] Estadísticas por período
- [x] Datos dinámicos

### ✅ Fase 5 - Mapas (Completado)
- [x] Integración Leaflet + OpenStreetMap
- [x] Geocodificación automática
- [x] Marcadores personalizados
- [x] Popups informativos

### 🚧 Fase 6 - Autenticación (En Progreso)
- [ ] Sistema de login/registro
- [ ] Gestión de roles (Admin/Agente/Cliente)
- [ ] Protección de rutas
- [ ] Perfil de usuario

### 📋 Fase 7 - Funcionalidades Avanzadas (Planificado)
- [ ] Sistema de favoritos
- [ ] Comparador de propiedades
- [ ] Alertas de nuevas propiedades
- [ ] Sistema de citas y contacto

### 🔧 Fase 8 - Optimización (Planificado)
- [ ] Cache inteligente
- [ ] Lazy loading avanzado
- [ ] PWA (Progressive Web App)
- [ ] Optimización SEO

## 📊 Métricas del Proyecto

- **Líneas de Código**: ~3,000+ TS/HTML/SCSS
- **Componentes Angular**: 8+
- **Servicios**: 3+
- **Páginas/Rutas**: 4+
- **Tests**: En desarrollo
- **Cobertura**: TBD

## 🤝 Contribución

### Cómo Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'feat: añadir nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

### Tipos de Commits

- `feat:` Nueva característica
- `fix:` Corrección de error
- `docs:` Cambios en documentación
- `style:` Cambios de formato
- `refactor:` Refactorización de código
- `test:` Añadir o modificar tests
- `chore:` Tareas de mantenimiento

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**TFGJOA102**
- GitHub: [@tu-usuario](https://github.com/tu-usuario)
- Email: tu-email@ejemplo.com

## 🙏 Agradecimientos

- **Angular Team** por el fantástico framework
- **Material Design** por los componentes UI
- **Leaflet** por la librería de mapas
- **Airtable** por la API de datos
- **OpenStreetMap** por los tiles de mapas gratuitos

---

⭐ **¡Dale una estrella si te gusta el proyecto!** ⭐