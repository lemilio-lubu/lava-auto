# =============================================================================
# Dockerfile — Next.js Frontend  (Railway deployment)
# =============================================================================
# next.config.ts ya tiene output: 'standalone', lo que genera un servidor
# Node.js autónomo sin node_modules completos (~80% menos peso).
#
# Variables de entorno a configurar en Railway:
#   NEXT_PUBLIC_API_URL       → URL pública del servicio backend de Railway
#   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY  (opcional)
#   NEXTAUTH_SECRET / NODE_ENV=production  (opcional)
# =============================================================================

# ── Etapa 1: instalar TODAS las dependencias (dev incluidas para el build) ────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ── Etapa 2: construir la aplicación Next.js ──────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
# Copiar todo el proyecto (src/, public/, config files)
COPY . .

RUN npm run build

# ── Etapa 3: imagen mínima de producción ─────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# HOSTNAME debe ser 0.0.0.0 para que Railway (y Docker) reciba el tráfico
ENV HOSTNAME=0.0.0.0

# Usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# ── Artefactos del build standalone ──────────────────────────────────────────
# public/ (assets estáticos)
COPY --from=builder /app/public ./public

# .next/standalone contiene server.js + node_modules mínimos
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# .next/static (JS/CSS del cliente; Next lo sirve desde aquí)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Puerto por defecto del frontend (Railway sobreescribe con su propio PORT)
EXPOSE 3000
ENV PORT=3000

# El servidor standalone generado por Next.js vive en /app/server.js
CMD ["node", "server.js"]
