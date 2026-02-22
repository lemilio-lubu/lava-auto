# Lava Auto — Sistema de Reservas de Autolavado

Aplicación web full-stack para la gestión de servicios de autolavado a domicilio.  
**Next.js 16** (frontend) + **Express.js modular** (backend) + **PostgreSQL** (una sola base de datos).

---

## 🏗️ Arquitectura

```
┌───────────────────────────────────────┐
│          Frontend (Next.js 16)         │
│          http://localhost:3000         │
└─────────────────┬─────────────────────┘
                  │ HTTP REST / WebSocket
                  ▼
┌───────────────────────────────────────┐
│        Backend monolítico (Express)    │
│          http://localhost:4000         │
│                                        │
│  /api/auth          → módulo auth      │
│  /api/vehicles      → módulo vehicles  │
│  /api/reservations  → módulo reservas  │
│  /api/payments      → módulo pagos     │
│  /api/services      → módulo servicios │
│  ws://              → Socket.IO chat   │
└─────────────────┬─────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────┐
│           PostgreSQL — lava_auto       │
└───────────────────────────────────────┘
```

---

## ✨ Funcionalidades

### 👥 Roles

| Rol | Capacidades |
|-----|-------------|
| **Cliente** | Solicitar servicios, gestionar vehículos, pagar (tarjeta o efectivo), ver historial |
| **Lavador** | Ver trabajos disponibles, aceptar trabajos, actualizar estados, confirmar pago en efectivo |
| **Admin** | Gestionar usuarios, lavadores, servicios, reservas y reportes |

### 💳 Pagos
- **Tarjeta** via Stripe (modo test)
- **Efectivo** — cliente indica que pagará en mano; lavador confirma la recepción
- Estado visual en reservas: badge **Pagado ✓** / **Pago en efectivo pendiente**

### 💬 Chat en tiempo real
- WebSockets con Socket.IO integrado en el backend
- Cliente ↔ Admin · Lavador ↔ Admin
- Indicadores de leído/no leído

### 🎨 Diseño
- Paleta cyan/emerald (agua y limpieza)
- **Totalmente responsive** — drawer lateral en móvil, hamburguesa en header
- Modo claro/oscuro con persistencia

---

## 🛠️ Stack

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| **Backend** | Node.js 18+, Express.js, Socket.IO 4 |
| **Base de datos** | PostgreSQL (única instancia, base `lava_auto`) |
| **Pagos** | Stripe SDK (modo test) |
| **Contenedores** | Docker, Docker Compose |
| **UI** | Lucide React, componentes propios |

---

## 🚀 Inicio rápido

### Prerrequisitos
- Node.js 18+
- PostgreSQL corriendo (local o Docker)

### 1. Base de datos con Docker (recomendado)

```bash
cd backend
npm run db:up        # levanta PostgreSQL en Docker
npm run migrate      # crea las tablas
npm run seed         # carga datos de prueba
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # y edita los valores
npm install
npm run dev            # nodemon en :4000
```

### 3. Frontend

```bash
# en la raíz del proyecto
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                  # Turbopack en :3000
```

### URLs

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Swagger/Docs | http://localhost:4000/api-docs |

### Usuarios de prueba (seed)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@lavauto.com | admin123 |
| Cliente | cliente@test.com | client123 |
| Lavador | lavador@test.com | washer123 |

---

## 📁 Estructura del proyecto

```
lava-auto/
├── backend/                         # API REST + WebSocket
│   ├── src/
│   │   ├── index.js                 # Entry point (Express + Socket.IO)
│   │   ├── config/                  # Configuración de BD, JWT, etc.
│   │   ├── database/                # Pool de conexión PostgreSQL
│   │   ├── middleware/              # Auth, error handler, rate limit
│   │   ├── shared/                  # Base repository, utilidades
│   │   └── modules/
│   │       ├── auth/                # Registro, login, JWT
│   │       ├── vehicles/            # CRUD vehículos
│   │       ├── reservations/        # Reservas + catálogo de servicios
│   │       ├── payments/            # Stripe + efectivo
│   │       └── notifications/       # Chat en tiempo real
│   ├── scripts/
│   │   ├── migrate.js               # Crea tablas
│   │   └── seed.js                  # Datos de prueba
│   ├── docker-compose.dev.yml       # PostgreSQL local
│   └── .env.example
│
├── src/                             # Frontend Next.js
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── layout.tsx           # Sidebar responsive
│   │   │   ├── admin/               # Panel administrador
│   │   │   ├── client/
│   │   │   │   ├── nueva-reserva/   # Solicitar servicio
│   │   │   │   ├── reservas/        # Historial con estado de pago
│   │   │   │   └── vehiculos/       # Garaje virtual
│   │   │   ├── washer/
│   │   │   │   ├── disponibles/     # Trabajos sin asignar
│   │   │   │   ├── trabajos/        # Trabajos propios + confirmar efectivo
│   │   │   │   └── estadisticas/    # Ganancias y rendimiento
│   │   │   ├── pagos/[id]/          # Pago por tarjeta o efectivo
│   │   │   └── chat/                # Chat en tiempo real
│   │   ├── login/
│   │   ├── register/
│   │   └── reset-password/
│   ├── components/
│   │   ├── ui/                      # Button, Card, Badge, Toast, Modal...
│   │   ├── auth/                    # LoginForm, RegisterForm
│   │   ├── reservas/                # ReservationsTable (badges de pago)
│   │   ├── vehicles/                # VehicleList, VehicleFormModal
│   │   └── washer/                  # JobActions, WasherLocationTracker
│   ├── contexts/                    # AuthContext, ThemeContext
│   ├── hooks/                       # useApi, useModal
│   └── lib/
│       ├── api-client.ts            # Cliente HTTP + todos los módulos API
│       └── validations/             # Schemas Zod
│
└── public/                          # Archivos estáticos
```

---

## 🔌 API — Endpoints principales

### Auth
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
```

### Vehículos
```
GET    /api/vehicles
POST   /api/vehicles
PUT    /api/vehicles/:id
DELETE /api/vehicles/:id
```

### Reservas
```
GET  /api/reservations/my
POST /api/reservations
PUT  /api/reservations/:id/status
DELETE /api/reservations/:id
GET  /api/services
```

### Pagos
```
POST /api/payments/cash              # Iniciar pago en efectivo
POST /api/payments/:id/confirm-cash  # Lavador confirma recepción
POST /api/payments/create-intent     # Stripe PaymentIntent
GET  /api/payments
GET  /api/payments/reservation/:id
```

### Chat
```
GET  /api/messages/:roomId
POST /api/messages
WebSocket  (Socket.IO)
```

---

## 💳 Flujo de pago

```
Cliente solicita servicio
        │
        ▼
  Reserva creada (PENDING)
        │
   Lavador asignado (CONFIRMED)
        │
        ├── Pagar con tarjeta ──→ Stripe PaymentIntent ──→ COMPLETED
        │
        └── Pagar en efectivo ──→ badge "Pago en efectivo pendiente"
                                        │
                               Lavador confirma recepción
                                        │
                                   COMPLETED → badge "Pagado ✓"
```

---

## 📊 Base de datos

Una sola instancia PostgreSQL, base de datos `lava_auto`:

| Tabla | Contenido |
|-------|-----------|
| `users` | Usuarios (CLIENT, WASHER, ADMIN) |
| `vehicles` | Vehículos de los clientes |
| `services` | Catálogo de servicios |
| `reservations` | Reservas con estado |
| `payments` | Pagos y transacciones |
| `messages` | Mensajes del chat |

---

## 🔒 Seguridad

- Contraseñas con bcrypt
- JWT con expiración configurable (`JWT_EXPIRES_IN`)
- Rate limiting en todos los endpoints
- Helmet (headers HTTP seguros)
- Validación de entrada con Zod (frontend) y Express (backend)

---

## 📝 Comandos útiles

```bash
# Backend
cd backend
npm run dev          # Desarrollo con nodemon
npm run start        # Producción
npm run migrate      # (Re)crear tablas
npm run seed         # Cargar datos de prueba
npm run db:up        # Iniciar PostgreSQL en Docker
npm run db:down      # Detener PostgreSQL
npm run db:reset     # Limpiar y reiniciar BD

# Frontend
npm run dev          # Turbopack dev server
npm run build        # Build de producción
npm run lint         # ESLint

# Stripe (test)
npm run stripe:listen   # Escuchar webhooks locales
npm run stripe:login    # Autenticar Stripe CLI
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'feat: descripción del cambio'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## 📄 Licencia

MIT © 2026

---

**Última actualización**: Febrero 2026
