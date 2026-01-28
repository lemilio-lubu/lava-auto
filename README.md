# Lava Auto - Sistema de Reservas de Autolavado

Sistema web completo para la gestión de reservas de servicios de autolavado, desarrollado con una **arquitectura de microservicios** usando **Next.js 16**, **TypeScript**, **Express.js** y **PostgreSQL**.

## 🏗️ Arquitectura

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
│  - Rate Limiting  - JWT Validation  - Request Routing         │
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
│  Auth DB  │ │Vehicles DB│ │Reserv. DB │ │Payments DB│ │  Notif DB │
└───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘
```

## ✨ Características

### 👥 Roles de Usuario
- **Cliente**: Reserva servicios, gestiona vehículos, realiza pagos
- **Lavador**: Visualiza trabajos asignados, actualiza estados, tracking GPS
- **Administrador**: Gestiona usuarios, servicios, reservas y configuración

### 🎨 Diseño UX/UI
- Principios de Nielsen implementados
- Paleta temática cyan/emerald (agua y limpieza)
- Diseño responsive (móvil, tablet, desktop)
- Modo claro/oscuro
- Animaciones suaves

### 💬 Chat en Tiempo Real
- Comunicación via WebSockets (Socket.IO)
- Cliente ↔ Admin
- Lavador ↔ Admin
- Indicadores de mensajes leídos/no leídos

### 💳 Sistema de Pagos
- Integración mock de Stripe
- Historial de transacciones
- Estados de pago

### 📍 Geolocalización
- Selector de ubicación con Google Maps
- Tracking de lavadores en tiempo real

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| **Backend** | Node.js, Express.js, API Gateway Pattern |
| **Base de Datos** | PostgreSQL (una por microservicio) |
| **Tiempo Real** | Socket.IO |
| **Contenedores** | Docker, Docker Compose |
| **UI** | Lucide Icons, Custom Components |

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker y Docker Compose
- Node.js 18+ (solo para desarrollo local)

### Ejecutar con Docker (Recomendado)

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/lava-auto.git
cd lava-auto

# Configurar Google Maps API Key (opcional)
echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key" > .env

# Iniciar todos los servicios
docker-compose -f docker-compose.microservices.yml up -d --build

# Ver logs
docker-compose -f docker-compose.microservices.yml logs -f

# Detener servicios
docker-compose -f docker-compose.microservices.yml down
```

### URLs de Acceso

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| API Gateway | http://localhost:4000 |
| Socket.IO | http://localhost:4005 |

### Usuarios de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@lavauto.com | admin123 |
| Cliente | cliente@test.com | client123 |
| Lavador | lavador@test.com | washer123 |

## 📁 Estructura del Proyecto

```
lava-auto/
├── docker-compose.microservices.yml   # Orquestación de contenedores
├── Dockerfile                         # Build del frontend
├── .dockerignore                      # Archivos excluidos del build
├── package.json                       # Dependencias del frontend
├── next.config.ts                     # Configuración Next.js
├── tsconfig.json                      # Configuración TypeScript
│
├── src/                               # Código fuente del frontend
│   ├── app/                           # App Router (Next.js)
│   │   ├── dashboard/                 # Dashboards por rol
│   │   │   ├── admin/                 # Panel de administrador
│   │   │   ├── client/                # Panel de cliente
│   │   │   ├── washer/                # Panel de lavador
│   │   │   └── chat/                  # Chat en tiempo real
│   │   ├── login/                     # Autenticación
│   │   ├── register/                  # Registro
│   │   └── reset-password/            # Recuperación de contraseña
│   ├── components/                    # Componentes React
│   │   ├── ui/                        # Componentes base (Button, Card, etc.)
│   │   ├── auth/                      # Login, Register forms
│   │   ├── maps/                      # Google Maps integration
│   │   ├── reservas/                  # Tabla de reservas
│   │   └── vehicles/                  # Gestión de vehículos
│   ├── contexts/                      # React Contexts
│   ├── hooks/                         # Custom hooks
│   ├── lib/                           # Utilidades y API client
│   └── types/                         # Tipos TypeScript
│
├── microservices/                     # Backend - Microservicios
│   ├── api-gateway/                   # Gateway central (:4000)
│   ├── auth-service/                  # Autenticación (:4001)
│   ├── vehicle-service/               # Vehículos (:4002)
│   ├── reservation-service/           # Reservas y servicios (:4003)
│   ├── payment-service/               # Pagos (:4004)
│   ├── notification-service/          # Notificaciones y chat (:4005)
│   ├── shared/                        # Código compartido
│   └── scripts/                       # Scripts de utilidad
│
└── public/                            # Archivos estáticos
```

## 🔧 Microservicios

### API Gateway (Puerto 4000)
- Punto de entrada único
- Validación JWT centralizada
- Rate limiting
- Enrutamiento a servicios

### Auth Service (Puerto 4001)
- Registro e inicio de sesión
- Gestión de usuarios
- Tokens JWT

### Vehicle Service (Puerto 4002)
- CRUD de vehículos
- Tipos: Sedán, SUV, Camioneta, Moto

### Reservation Service (Puerto 4003)
- Gestión de reservas
- Catálogo de servicios
- Sistema de calificaciones

### Payment Service (Puerto 4004)
- Procesamiento de pagos (mock Stripe)
- Historial de transacciones

### Notification Service (Puerto 4005)
- WebSocket con Socket.IO
- Chat en tiempo real
- Notificaciones push

## 🎨 Componentes UI

```tsx
// Botones
<Button variant="primary|secondary|outline|ghost|danger" size="sm|md|lg" />

// Tarjetas
<Card><CardHeader><CardTitle/></CardHeader><CardContent/></Card>

// Badges
<Badge variant="primary|success|warning|error|info" />

// Notificaciones
<Toast type="success|error|warning|info" />

// Calendario interactivo
<Calendar selectedDate={date} onDateSelect={fn} />

// Modal de confirmación
<ConfirmModal isOpen={bool} onConfirm={fn} />
```

## 🔒 Seguridad

- Autenticación con bcrypt + JWT
- Validación de entrada
- Comunicación entre servicios autenticada
- Rate limiting en API Gateway
- Headers X-User-* para identificación interna

## 📝 Comandos Útiles

```bash
# Ver todos los contenedores
docker-compose -f docker-compose.microservices.yml ps

# Logs de un servicio específico
docker-compose -f docker-compose.microservices.yml logs -f frontend
docker-compose -f docker-compose.microservices.yml logs -f api-gateway

# Reconstruir un servicio
docker-compose -f docker-compose.microservices.yml up -d --build frontend

# Limpiar todo (incluyendo datos)
docker-compose -f docker-compose.microservices.yml down -v

# Desarrollo local del frontend (requiere microservicios corriendo)
npm run dev
```

## 📊 Base de Datos

Cada microservicio tiene su propia base de datos PostgreSQL:

| Base de Datos | Contenido |
|---------------|-----------|
| lava_auto_auth | Usuarios, roles |
| lava_auto_vehicles | Vehículos |
| lava_auto_reservations | Reservas, servicios, ratings |
| lava_auto_payments | Pagos, transacciones |
| lava_auto_notifications | Mensajes, notificaciones |

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/NuevaFuncionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/NuevaFuncionalidad`)
5. Abre un Pull Request

## � CI/CD

El proyecto incluye un pipeline de GitHub Actions que se ejecuta en cada push y pull request:

| Job | Descripción |
|-----|-------------|
| **Frontend** | Lint y build de Next.js |
| **Microservices** | Build de imágenes Docker (en paralelo) |
| **Integration** | Levanta todos los servicios y verifica health checks |
| **Security** | Auditoría de dependencias (solo en PRs) |

El workflow se encuentra en `.github/workflows/ci.yml`.

## �📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

**Última actualización**: Enero 2026
