# syntax=docker/dockerfile:1

# Base image with Node 20 (Debian slim for better Prisma compatibility)
FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN ./node_modules/.bin/prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Accept DATABASE_URL as build argument for migrations
ARG DATABASE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Run migrations if DATABASE_URL is provided
RUN if [ -n "$DATABASE_URL" ] && [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then \
      echo "Running Prisma migrations..." && \
      ./node_modules/.bin/prisma migrate deploy; \
    else \
      echo "Skipping migrations (no DATABASE_URL or no migrations)"; \
    fi

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Copy the standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma client only
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
