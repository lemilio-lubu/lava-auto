# =============================================================================
# backend/Dockerfile — Express.js API  (Railway deployment)
# =============================================================================
# Railway inyecta PORT automáticamente. PostgreSQL se provisiona como plugin
# de Railway; configura las variables de entorno en el panel de Railway:
#   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET
#   FRONTEND_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (opcionales)
# =============================================================================

# ── Etapa 1: instalar solo dependencias de producción ─────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
# --omit=dev reduce el tamaño final (~40% menos)
RUN npm ci --omit=dev

# ── Etapa 2: imagen final de producción ───────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiar node_modules ya instalados (sin devDeps)
COPY --from=deps /app/node_modules ./node_modules

# ARG CACHEBUST invalida el cache de Docker desde este punto hacia abajo
# cada vez que se cambia su valor. Incrementar si Railway sigue usando cache viejo.
ARG CACHEBUST=3
RUN echo "Build cache bust: $CACHEBUST"

# Copiar código fuente y scripts
COPY src/      ./src/
COPY scripts/  ./scripts/

# Puerto por defecto del backend (Railway sobreescribe con su propio PORT)
EXPOSE 4000

# 1. Correr migración idempotente (no bloquea el arranque si falla).
# 2. Iniciar el servidor Express.
# Se usa ';' en lugar de '&&' para que el servidor arranque SIEMPRE,
# incluso si la migración falla temporalmente (ej. BD aún no disponible).
CMD ["sh", "-c", "node scripts/migrate.js; node src/index.js"]
