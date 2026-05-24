# Stage 1: Build the TypeScript application
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

# Stage 2: Install ONLY production-level dependencies
FROM node:20-alpine AS prod-deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate

# Stage 3: Lean runtime image copy
FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/package*.json ./
COPY --from=prod-deps /app/prisma ./prisma

EXPOSE 4000
CMD ["node", "dist/server.js"]
