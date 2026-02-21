FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY payment-service/package.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source and shared code
COPY payment-service/src ./src
COPY shared ./shared

# Expose port
EXPOSE 4004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4004/health || exit 1

# Start the service
CMD ["npm", "start"]
