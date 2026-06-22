# Stage 1: Build dependencies
FROM node:20-slim AS deps
WORKDIR /app

# Required system packages for building
RUN apt-get update && apt-get install -y openssl python3 make g++ --no-install-recommends && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

# Cache npm install
RUN --mount=type=cache,target=/root/.npm \
    npm install

# Stage 2: Build the application
FROM node:20-slim AS builder
WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl --no-install-recommends && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY prisma ./prisma/

# Prisma Client generation (cached if prisma/schema.prisma doesn't change)
RUN npx prisma generate

# Now copy the rest of the source code
COPY . .

# Environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Next.js Build with cache mount for speed
RUN --mount=type=cache,target=/app/.next/cache \
    DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" \
    NEXTAUTH_SECRET="build-time-placeholder-secret" \
    AUTH_SECRET="build-time-placeholder-secret" \
    NEXTAUTH_URL="http://localhost:5000" \
    GOOGLE_CLIENT_ID="build-time-placeholder-client-id" \
    GOOGLE_CLIENT_SECRET="build-time-placeholder-client-secret" \
    ADMIN_EMAIL="admin@example.com" \
    npm run build

# Stage 3: Production runner
FROM node:20-slim AS runner
WORKDIR /app

# Only required runtime library for Prisma
RUN apt-get update && apt-get install -y openssl --no-install-recommends && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=5000
ENV HOSTNAME="0.0.0.0"

# Copy only necessary artifacts from standalone build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./entrypoint.sh"]
