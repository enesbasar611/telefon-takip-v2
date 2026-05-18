# Stage 1: Build dependencies
FROM node:20-slim AS deps
WORKDIR /app

# Gerekli temel sistem paketleri
RUN apt-get update && apt-get install -y openssl python3 make g++ 

COPY package*.json ./
COPY prisma ./prisma/

# Sadece üretim bağımlılıkları yerine tam yükleme yapıyoruz çünkü build sırasında hepsi gerekiyor
RUN npm install

# Stage 2: Build the application
FROM node:20-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma Client oluştur
RUN npx prisma generate

# Standalone build için gerekli environmentlar
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Next.js Build
RUN npm run build

# Stage 3: Production runner
FROM node:20-slim AS runner
WORKDIR /app

# Puppeteer (WhatsApp Manager vb. için) ve Standalone çalışma zamanı paketleri
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

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PORT=5000
ENV HOSTNAME="0.0.0.0"

# Sadece standalone çıktı klasörünü ve statik dosyaları kopyalıyoruz
# Bu image boyutunu devasa oranda (~2GB -> ~250MB) düşürür
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

# Standalone mode .next/standalone/server.js dosyasını çalıştırır
CMD ["node", "server.js"]
