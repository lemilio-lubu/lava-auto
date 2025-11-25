# 🚗 Autolavado Digital

Sistema monolítico de reservas para autolavado con gestión integral de operaciones.

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
