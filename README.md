# Sistema Digital de Reservas para Autolavado

Sistema web moderno y minimalista para la gestión de reservas de servicios de autolavado, desarrollado con **Next.js 16**, **TypeScript**, **Tailwind CSS 4** y **Prisma ORM**.

## Características Principales

### Diseño UX/UI de Clase Mundial
- **10 Principios de Nielsen implementados** 
- **Colorimetría temática**: Paleta cyan/emerald que evoca agua y limpieza
- **Diseño responsive**: Optimizado para móvil, tablet y desktop
- **Accesible**: WCAG AA compliant
- **Animaciones suaves**: Transiciones fluidas con GPU acceleration

### Autenticación y Seguridad
- Sistema de login/registro con NextAuth.js
- Recuperación de contraseña
- Validación en tiempo real
- Sesiones seguras con JWT

### Gestión de Reservas
- **Calendario interactivo** para selección de fechas
- Vista de tarjetas con información detallada
- Búsqueda y filtros avanzados
- Estados visuales claros (Pendiente, Confirmada, En Proceso, Completada, Cancelada)
- Feedback inmediato con Toast notifications

### Gestión de Vehículos
- Registro de múltiples vehículos
- Tipos: Sedán, SUV, Camioneta, Moto
- Información completa: marca, modelo, placa, propietario

### Catálogo de Servicios
- Servicios diferenciados por tipo de vehículo
- Información de duración y precio
- Selección visual con cards

### Sistema de Pagos
- Integración con Stripe (preparado)
- Registro de transacciones
- Estados de pago

## Stack Tecnológico

```json
{
  "Frontend": ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS 4"],
  "Backend": ["Next.js API Routes", "NextAuth.js"],
  "Database": ["PostgreSQL", "Prisma ORM"],
  "UI Components": ["Lucide React Icons", "Custom Components"],
  "Pagos": ["Stripe"],
  "Tiempo Real": ["Socket.io (preparado)"]
}
```

## Componentes UI Reutilizables

### Nuevos componentes creados:

```typescript
// Notificaciones
<Toast type="success|error|warning|info" />

// Botones versátiles
<Button variant="primary|secondary|outline|ghost|danger" size="sm|md|lg" />

// Etiquetas
<Badge variant="primary|success|warning|error|info|neutral" />

// Sistema de tarjetas
<Card>
  <CardHeader>
    <CardTitle />
    <CardDescription />
  </CardHeader>
  <CardContent />
  <CardFooter />
</Card>

// Calendario interactivo
<Calendar 
  selectedDate={date}
  onDateSelect={handleSelect}
  minDate={new Date()}
  highlightedDates={[...]}
/>
```

## Inicio Rápido

### Prerrequisitos
- Node.js 18+ 
- PostgreSQL
- Docker (opcional)

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/lava-auto.git
cd lava-auto
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales reales (ver `.env.example` para referencia completa):
```env
# Base de datos
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/autolavado?schema=public"

# Autenticación
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-secreto-con-openssl-rand-base64-32"

# Stripe (Pagos)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Aplicación
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="tu_api_key_aqui"
```

4. **Iniciar base de datos con Docker**
```bash
docker-compose up -d
```

5. **Ejecutar migraciones**
```bash
npx prisma migrate dev
npx prisma generate
```

6. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

7. **Abrir en navegador**
```
http://localhost:3000
```

## Estructura del Proyecto

```
lava-auto/
├── prisma/
│   ├── schema.prisma          # Modelo de datos
│   ├── seed.ts                # Datos iniciales
│   └── migrations/            # Migraciones SQL
├── src/
│   ├── app/
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Autenticación y usuarios
│   │   │   ├── chat/          # Chat en tiempo real
│   │   │   ├── payments/      # Pagos con Stripe
│   │   │   ├── reservations/  # Gestión de reservas
│   │   │   ├── services/      # Servicios de autolavado
│   │   │   └── vehicles/      # Vehículos
│   │   ├── dashboard/         # Dashboards por rol
│   │   │   ├── layout.tsx     # Layout con navegación
│   │   │   ├── page.tsx       # Dashboard principal
│   │   │   ├── chat/          # Chat
│   │   │   ├── pagos/         # Checkout y pagos
│   │   │   ├── reservas/      # Gestión de reservas
│   │   │   ├── servicios/     # Catálogo de servicios
│   │   │   ├── vehiculos/     # Gestión de vehículos
│   │   │   └── admin/         # Panel administrador
│   │   │       ├── usuarios/  # Gestión de usuarios
│   │   │       └── configuracion/
│   │   ├── login/             # Página de login
│   │   ├── register/          # Registro de usuarios
│   │   ├── reset-password/    # Recuperar contraseña
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Página de inicio
│   │   └── globals.css        # Estilos globales + variables
│   ├── components/
│   │   ├── ui/                # Componentes reutilizables
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Calendar.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── ConfirmModal.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── auth/              # Componentes de autenticación
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ResetPasswordForm.tsx
│   │   │   └── SessionProvider.tsx
│   │   ├── maps/              # Mapas y geolocalización
│   │   │   └── LocationPicker.tsx
│   │   ├── reservas/          # Componentes de reservas
│   │   │   └── ReservationsTable.tsx
│   │   └── washer/            # Componentes de lavadores
│   │       └── WasherLocationTracker.tsx
│   ├── contexts/              # Contextos de React
│   │   └── ThemeContext.tsx
│   ├── hooks/                 # Custom hooks
│   │   └── useModal.ts
│   ├── lib/
│   │   ├── auth.ts            # Configuración NextAuth
│   │   ├── prisma.ts          # Cliente Prisma
│   │   ├── stripe.ts          # Configuración Stripe
│   │   └── validations/       # Schemas Zod
│   │       ├── auth.schema.ts
│   │       └── producto.schema.ts
│   ├── services/              # Lógica de negocio
│   │   ├── producto.service.ts
│   │   └── user.service.ts
│   └── types/                 # Definiciones de tipos
│       └── next-auth.d.ts
├── public/                    # Archivos estáticos
├── scripts/                   # Scripts auxiliares
├── .env                       # Variables de entorno (no subir)
├── .env.example              # Plantilla de variables
├── .gitignore                # Archivos ignorados por Git
├── docker-compose.yml        # Configuración Docker
├── next.config.ts            # Configuración Next.js
├── package.json              # Dependencias
├── server.js                 # Servidor Socket.io
├── tsconfig.json             # Configuración TypeScript
└── README.md                 # Este archivo
```

## Sistema de Diseño

### Paleta de Colores

```css
/* Primarios */
--color-primary: #0891b2        /* Cyan-600 - Agua fresca */
--color-secondary: #10b981      /* Emerald-500 - Limpieza */
--color-accent: #06b6d4         /* Cyan-500 - Agua brillante */

/* Estados */
--color-success: #10b981        /* Verde */
--color-warning: #f59e0b        /* Ámbar */
--color-error: #ef4444          /* Rojo */
--color-info: #3b82f6           /* Azul */
```

### Tipografía
- **Font**: Inter (sistema)
- **Escala**: 12px / 14px / 16px / 18px / 20px / 24px / 30px / 36px

### Espaciado
- Sistema basado en múltiplos de 4px: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px

## Modelos de Datos

```prisma
model User {
  id            String        @id @default(cuid())
  email         String        @unique
  name          String?
  password      String
  createdAt     DateTime      @default(now())
  vehicles      Vehicle[]
  reservations  Reservation[]
}

model Vehicle {
  id           String        @id @default(cuid())
  ownerName    String
  brand        String
  model        String
  plate        String        @unique
  vehicleType  VehicleType
  userId       String
  user         User          @relation(...)
  reservations Reservation[]
}

model Service {
  id           String        @id @default(cuid())
  name         String
  description  String?
  price        Float
  duration     Int
  vehicleType  VehicleType
  reservations Reservation[]
}

model Reservation {
  id             String           @id @default(cuid())
  scheduledDate  DateTime
  scheduledTime  String
  totalAmount    Float
  status         ReservationStatus @default(PENDING)
  notes          String?
  userId         String
  vehicleId      String
  serviceId      String
  user           User             @relation(...)
  vehicle        Vehicle          @relation(...)
  service        Service          @relation(...)
  payment        Payment?
}
```

## Seguridad

- Autenticación con bcrypt
- Sesiones JWT seguras
- Validación de entrada con Zod
- Protección CSRF
- Sanitización de datos
- Rate limiting (pendiente)

## Testing (Próximamente)

```bash
npm run test           # Unit tests
npm run test:e2e       # E2E tests con Playwright
npm run test:coverage  # Coverage report
```

## Roadmap

### Fase 1: Core (Completado)
- [x] Sistema de autenticación
- [x] CRUD de vehículos
- [x] CRUD de servicios
- [x] Gestión de reservas
- [x] Diseño UX/UI con principios de Nielsen
- [x] Calendario interactivo
- [x] Sistema de componentes reutilizables

### Fase 2: Mejoras (En Progreso)
- [ ] Integración completa de pagos con Stripe
- [ ] Sistema de notificaciones push
- [ ] Chat en tiempo real con Socket.io
- [ ] Dashboard de estadísticas
- [ ] Sistema de calificaciones

### Fase 3: Avanzado (Planeado)
- [ ] Modo oscuro
- [ ] PWA (Progressive Web App)
- [ ] Multi-idioma (i18n)
- [ ] App móvil con React Native
- [ ] Panel de administración avanzado
- [ ] Reportes y analytics

## Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Scripts Disponibles

```bash
npm run dev          # Desarrollo en localhost:3000
npm run build        # Build de producción
npm run start        # Iniciar servidor de producción
npm run lint         # Linter ESLint
npx prisma studio    # Interfaz visual de la BD
npx prisma migrate   # Crear migración
```

## Licencia

Este proyecto está bajo la Licencia MIT - ver [LICENSE](LICENSE) para más detalles.

## Autor

Desarrollado aplicando los principios de usabilidad de Jakob Nielsen.

## Soporte

¿Problemas o preguntas? Abre un [issue](https://github.com/tu-usuario/lava-auto/issues).

---

**Última actualización**: Noviembre 2025
