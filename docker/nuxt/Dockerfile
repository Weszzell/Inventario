FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package*.json ./
RUN npm install

FROM node:22-alpine AS builder
WORKDIR /app
ARG DATABASE_URL=postgresql://inventory:inventory@postgres:5432/inventory?schema=public
ENV DATABASE_URL=$DATABASE_URL
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG DATABASE_URL=postgresql://inventory:inventory@postgres:5432/inventory?schema=public
ENV DATABASE_URL=$DATABASE_URL
RUN apk add --no-cache libc6-compat openssl
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/data ./data
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
