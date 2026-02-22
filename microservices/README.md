# Microservicios - Lava Auto

Esta carpeta contiene los microservicios backend de la aplicación Lava Auto.

## 📋 Servicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **API Gateway** | 4000 | Punto de entrada, JWT validation, routing |
| **Auth Service** | 4001 | Autenticación, usuarios, tokens |
| **Vehicle Service** | 4002 | CRUD de vehículos |
| **Reservation Service** | 4003 | Reservas, servicios, ratings |
| **Payment Service** | 4004 | Procesamiento de pagos mock |
| **Notification Service** | 4005 | Chat WebSocket, notificaciones |

## 🗂️ Estructura de cada Servicio

```
service-name/
├── Dockerfile
├── package.json
└── src/
    ├── index.js              # Entry point
    ├── database/
    │   ├── schema.sql        # Esquema de la BD
    │   └── seed.sql          # Datos iniciales
    ├── repositories/         # Repository Pattern
    │   └── *.repository.js
    ├── routes/               # Express routes
    │   └── *.routes.js
    └── middleware/
        ├── auth.js           # Validación de headers X-User-*
        └── error-handler.js
```

## 🔄 Patrones de Diseño

### API Gateway Pattern
- Punto de entrada único para todos los microservicios
- Validación JWT centralizada
- Rate limiting y seguridad
- Enrutamiento de requests

### Repository Pattern
- Abstracción del acceso a datos
- Facilita testing y mantenimiento
- Separación de lógica de negocio

### Database per Service
Cada microservicio tiene su propia base de datos PostgreSQL para garantizar independencia y escalabilidad.

## 🔗 Comunicación entre Servicios

1. El API Gateway valida el JWT del usuario
2. Extrae información del usuario (id, role, email)
3. Reenvía la petición con headers `X-User-*`
4. Cada servicio confía en estos headers para autorización

```
Headers internos:
- X-User-Id: ID del usuario
- X-User-Role: CLIENT | WASHER | ADMIN
- X-User-Email: Email del usuario
```

## 🛠️ Desarrollo Local

### Prerrequisitos
- Node.js 18+
- PostgreSQL 14+

### Instalación

```bash
# Desde esta carpeta (microservices/)
npm run install:all

# Configurar variables de entorno
cp api-gateway/.env.example api-gateway/.env
cp auth-service/.env.example auth-service/.env
# ... repetir para cada servicio

# Iniciar todos los servicios
npm run start:all

# O con hot-reload
npm run dev:all
```

## 📦 Carpeta Shared

Contiene código compartido entre servicios:

- `db.js` - Conexión a PostgreSQL
- `base-repository.js` - Clase base para repositorios
- `middleware/auth.js` - Middleware de autenticación
- `middleware/error-handler.js` - Manejo de errores
- `utils/id-generator.js` - Generador de IDs únicos

## 🐳 Docker

Todos los servicios están containerizados. Ver el archivo `docker-compose.microservices.yml` en la raíz del proyecto para la configuración completa.

```bash
# Desde la raíz del proyecto
docker-compose -f docker-compose.microservices.yml up -d --build
```
