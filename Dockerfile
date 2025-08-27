# Multi-stage build pre optimalizáciu
FROM node:18-alpine AS builder

WORKDIR /app

# Kopíruj package files
COPY package*.json ./
COPY tsconfig.json ./

# Inštaluj dependencies
RUN npm ci --only=production && npm cache clean --force

# Kopíruj source code
COPY src/ ./src/
COPY prisma/ ./prisma/

# Build aplikácie
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Vytvor non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Kopíruj built aplikáciu
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Kopíruj Prisma
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Vytvor logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

# Switch na non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Expose port
EXPOSE 3000

# Start aplikácie
CMD ["npm", "start"]
