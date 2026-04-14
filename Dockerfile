# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app

# Install dependencies for Prisma and build
RUN apt-get update && apt-get install -y openssl python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

# Generate Prisma client and build Next.js
RUN npx prisma generate
RUN npm run build

# Stage 2: Run
FROM node:20-slim AS runner
WORKDIR /app

# Install browser dependencies for WhatsApp (Puppeteer)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose the port (matches package.json script)
EXPOSE 5000
ENV PORT 5000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
