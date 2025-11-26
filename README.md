# 🚗💧 Sistema Digital de Reservas para Autolavado

Sistema web moderno y minimalista para la gestión de reservas de servicios de autolavado, desarrollado con **Next.js 16**, **TypeScript**, **Tailwind CSS 4** y **Prisma ORM**.

## ✨ Características Principales

### 🎨 Diseño UX/UI de Clase Mundial
- ✅ **10 Principios de Nielsen implementados** 
- 🎨 **Colorimetría temática**: Paleta cyan/emerald que evoca agua y limpieza
- 📱 **Diseño responsive**: Optimizado para móvil, tablet y desktop
- ♿ **Accesible**: WCAG AA compliant
- 🌊 **Animaciones suaves**: Transiciones fluidas con GPU acceleration

### 🔐 Autenticación y Seguridad
- Sistema de login/registro con NextAuth.js
- Recuperación de contraseña
- Validación en tiempo real
- Sesiones seguras con JWT

### 📅 Gestión de Reservas
- **Calendario interactivo** para selección de fechas
- Vista de tarjetas con información detallada
- Búsqueda y filtros avanzados
- Estados visuales claros (Pendiente, Confirmada, En Proceso, Completada, Cancelada)
- Feedback inmediato con Toast notifications

### 🚙 Gestión de Vehículos
- Registro de múltiples vehículos
- Tipos: Sedán, SUV, Camioneta, Moto
- Información completa: marca, modelo, placa, propietario

### ✨ Catálogo de Servicios
- Servicios diferenciados por tipo de vehículo
- Información de duración y precio
- Selección visual con cards

### 💳 Sistema de Pagos
- Integración con Stripe (preparado)
- Registro de transacciones
- Estados de pago

## 🛠️ Stack Tecnológico

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

## 📦 Componentes UI Reutilizables

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

## 🚀 Inicio Rápido

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

Edita `.env` con tus credenciales:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/lavauto"
NEXTAUTH_SECRET="tu-secret-key-aqui"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
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

## 📁 Estructura del Proyecto

```
lava-auto/
├── prisma/
│   ├── schema.prisma          # Modelo de datos
│   └── migrations/            # Migraciones SQL
├── src/
│   ├── app/
│   │   ├── api/               # API Routes
│   │   ├── dashboard/         # Panel principal
│   │   ├── login/             # Autenticación
│   │   └── globals.css        # Estilos globales + variables
│   ├── components/
│   │   ├── ui/                # Componentes reutilizables
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Calendar.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── Modal.tsx
│   │   ├── auth/              # Componentes de autenticación
│   │   └── reservas/          # Componentes de reservas
│   ├── lib/
│   │   ├── auth.ts            # Configuración NextAuth
│   │   ├── prisma.ts          # Cliente Prisma
│   │   └── validations/       # Schemas Zod
│   └── services/              # Lógica de negocio
├── MEJORAS_UX_NIELSEN.md      # Documentación de mejoras UX
└── README.md                  # Este archivo
```

## 🎨 Sistema de Diseño

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

## 📊 Modelos de Datos

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

## 🔒 Seguridad

- ✅ Autenticación con bcrypt
- ✅ Sesiones JWT seguras
- ✅ Validación de entrada con Zod
- ✅ Protección CSRF
- ✅ Sanitización de datos
- ✅ Rate limiting (pendiente)

## 🧪 Testing (Próximamente)

```bash
npm run test           # Unit tests
npm run test:e2e       # E2E tests con Playwright
npm run test:coverage  # Coverage report
```

## 📈 Roadmap

### Fase 1: Core (Completado ✅)
- [x] Sistema de autenticación
- [x] CRUD de vehículos
- [x] CRUD de servicios
- [x] Gestión de reservas
- [x] Diseño UX/UI con principios de Nielsen
- [x] Calendario interactivo
- [x] Sistema de componentes reutilizables

### Fase 2: Mejoras (En Progreso 🚧)
- [ ] Integración completa de pagos con Stripe
- [ ] Sistema de notificaciones push
- [ ] Chat en tiempo real con Socket.io
- [ ] Dashboard de estadísticas
- [ ] Sistema de calificaciones

### Fase 3: Avanzado (Planeado 📋)
- [ ] Modo oscuro
- [ ] PWA (Progressive Web App)
- [ ] Multi-idioma (i18n)
- [ ] App móvil con React Native
- [ ] Panel de administración avanzado
- [ ] Reportes y analytics

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Scripts Disponibles

```bash
npm run dev          # Desarrollo en localhost:3000
npm run build        # Build de producción
npm run start        # Iniciar servidor de producción
npm run lint         # Linter ESLint
npx prisma studio    # Interfaz visual de la BD
npx prisma migrate   # Crear migración
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

Desarrollado con 💙 aplicando los principios de usabilidad de Jakob Nielsen.

## 📞 Soporte

¿Problemas o preguntas? Abre un [issue](https://github.com/tu-usuario/lava-auto/issues).

---

**Última actualización**: Noviembre 2025

## Stack Tecnológico

- **Framework:** Next.js 16 (App Router con SSR)
- **ORM:** Prisma 6.19
- **Base de datos:** PostgreSQL
- **WebSockets:** Socket.io
- **Autenticación:** NextAuth.js
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS

## Requisitos Previos

- Node.js 18+
- Docker (para PostgreSQL) o PostgreSQL instalado localmente

## Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd autolavado-app

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 4. Levantar PostgreSQL con Docker
docker-compose up -d

# 5. Generar cliente Prisma y ejecutar migraciones
npx prisma generate
npx prisma migrate dev

# 6. Iniciar servidor de desarrollo
npm run dev
```

## Variables de Entorno

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/autolavado?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secreto-aqui"
```

## Docker Compose

Para iniciar solo la base de datos:

```bash
docker-compose up -d
```

Para detenerla:

```bash
docker-compose down
```

## Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── login/              # Página de login
│   ├── register/           # Página de registro
│   ├── reset-password/     # Recuperar contraseña
│   ├── dashboard/          # Panel principal (protegido)
│   │   ├── chat/           # Chat en tiempo real
│   │   └── productos/      # CRUD de productos
│   └── api/                # API Routes
│       ├── auth/           # NextAuth endpoints
│       ├── productos/      # CRUD API
│       └── socket/         # WebSocket
├── components/             # Componentes reutilizables
├── lib/                    # Utilidades y configuración
├── services/               # Capa de servicios (lógica de negocio)
└── middleware.ts           # Protección de rutas
```

## Pantallas Implementadas

| Ruta | Descripción |
|------|-------------|
| `/login` | Inicio de sesión |
| `/register` | Registro de usuario |
| `/reset-password` | Recuperar contraseña |
| `/dashboard` | Panel principal |
| `/dashboard/chat` | Chat en tiempo real |
| `/dashboard/productos` | Lista de productos |
| `/dashboard/productos/nuevo` | Crear producto |
| `/dashboard/productos/[id]` | Ver detalle |
| `/dashboard/productos/[id]/editar` | Editar producto |

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build
npm start

# Prisma
npx prisma studio    # GUI para ver la BD
npx prisma migrate dev --name <nombre>  # Nueva migración
npx prisma db push   # Sincronizar schema sin migración
```

## Licencia

MIT
