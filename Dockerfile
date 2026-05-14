# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app

# Gerekli sistem paketleri
RUN apt-get update && apt-get install -y openssl python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

# Bağımlılıkları yükle
RUN npm install

COPY . .

# 1. Prisma Client oluştur
RUN npx prisma generate

# 2. Next.js Build (Tüm korumalar tek komutta)
RUN NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    PRISMA_SKIP_DATABASE_CHECK=1 \
    DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    npm run build

# Stage 2: Run
FROM node:20-slim AS runner
WORKDIR /app

# Puppeteer ve çalışma zamanı paketleri
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    openssl \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Ortam değişkenlerini "=" ile tanımlayalım (Warningleri siler)
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PORT=5000
ENV HOSTNAME="0.0.0.0"

# Builder'dan gelen dosyaları kopyala
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

CMD ["node", "server.js"]
