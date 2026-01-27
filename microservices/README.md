# Lava Auto - Microservices Architecture

Esta carpeta contiene la arquitectura de microservicios para la aplicación Lava Auto.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                       │
│                    http://localhost:3000                      │
│                    (Docker Container)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway                               │
│                  http://localhost:4000                        │
│  - Rate Limiting                                              │
│  - JWT Validation                                             │
│  - Request Routing                                            │
└───────┬─────────┬─────────┬─────────┬─────────┬─────────────┘
        │         │         │         │         │
        ▼         ▼         ▼         ▼         ▼
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│   Auth    │ │  Vehicle  │ │Reservation│ │  Payment  │ │Notification│
│  Service  │ │  Service  │ │  Service  │ │  Service  │ │  Service  │
│   :4001   │ │   :4002   │ │   :4003   │ │   :4004   │ │   :4005   │
└─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
      │             │             │             │             │
      ▼             ▼             ▼             ▼             ▼
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│lava_auto_ │ │lava_auto_ │ │lava_auto_ │ │lava_auto_ │ │lava_auto_ │
│   auth    │ │ vehicles  │ │reservations│ │ payments │ │notifications│
│    DB     │ │    DB     │ │    DB     │ │    DB    │ │    DB     │
└───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘
```

## 🐳 Ejecución con Docker (Recomendado)

Todo el sistema, incluyendo el frontend, se ejecuta en contenedores Docker:

```bash
# Desde la raíz del proyecto - Iniciar todo (frontend + microservicios)
docker-compose -f docker-compose.microservices.yml up -d --build

# Ver logs de todos los servicios
docker-compose -f docker-compose.microservices.yml logs -f

# Ver logs solo del frontend
docker-compose -f docker-compose.microservices.yml logs -f frontend

# Detener servicios
docker-compose -f docker-compose.microservices.yml down

# Limpiar todo (incluyendo datos)
docker-compose -f docker-compose.microservices.yml down -v
```

Una vez iniciados los contenedores, accede a:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:4000
- **Socket.IO (Notifications)**: http://localhost:4005

## Patrones de Diseño Implementados

### 1. API Gateway Pattern
- Punto de entrada único para todos los microservicios
- Maneja autenticación JWT centralizada
- Rate limiting y seguridad
- Enrutamiento de requests a los servicios correspondientes

### 2. Repository Pattern
- Cada microservicio implementa el patrón Repository
- Abstracción de acceso a datos
- Facilita testing y mantenimiento
- Separación de la lógica de negocio del acceso a datos

## Database Per Microservice
Cada microservicio tiene su propia base de datos PostgreSQL:
- `lava_auto_auth` - Usuarios y autenticación
- `lava_auto_vehicles` - Vehículos
- `lava_auto_reservations` - Reservaciones, servicios, ratings
- `lava_auto_payments` - Pagos
- `lava_auto_notifications` - Notificaciones y mensajes

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Instalación Local

1. **Instalar dependencias de todos los servicios:**
```bash
cd microservices
npm run install:all
```

2. **Configurar variables de entorno:**
Copia los archivos `.env.example` a `.env` en cada servicio y ajusta las credenciales.

```bash
# Para cada servicio
cp api-gateway/.env.example api-gateway/.env
cp auth-service/.env.example auth-service/.env
cp vehicle-service/.env.example vehicle-service/.env
cp reservation-service/.env.example reservation-service/.env
cp payment-service/.env.example payment-service/.env
cp notification-service/.env.example notification-service/.env
```

3. **Inicializar bases de datos:**
```bash
npm run db:init:all
```

4. **Sembrar datos de prueba (opcional):**
```bash
node scripts/seed-data.js
```

5. **Iniciar todos los servicios:**
```bash
npm run start:all
# o para desarrollo con hot-reload:
npm run dev:all
```

## Estructura de Servicios

Cada microservicio sigue la misma estructura:
```
service-name/
├── package.json
├── .env.example
└── src/
    ├── index.js           # Entry point
    ├── database/
    │   ├── db.js          # Database connection
    │   ├── init.js        # DB initialization
    │   └── schema.sql     # SQL schema
    ├── repositories/      # Repository Pattern
    │   └── *.repository.js
    ├── routes/            # Express routes
    │   └── *.routes.js
    └── middleware/        # Middlewares
        ├── auth.js
        └── error-handler.js
```

## Comunicación entre Servicios

Los servicios se comunican a través del API Gateway que:
1. Valida el JWT del usuario
2. Extrae la información del usuario (id, role, email)
3. Reenvía la petición al servicio correspondiente con headers X-User-*
4. Cada servicio confía en estos headers para autorización
