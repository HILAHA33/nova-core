# syntax=docker/dockerfile:1
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build Vite frontend and esbuild server bundle
RUN npm run build

# Production runner image
FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install production runtime dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled build artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/metadata.json ./metadata.json

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
