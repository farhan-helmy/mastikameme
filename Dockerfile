FROM oven/bun:latest as deps

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json bun.lockb ./
RUN bun install

# Build the app
FROM deps AS builder
WORKDIR /app
COPY . .

RUN bun run build

# Production image, copy all the files and run next
FROM node:20.10.0-slim AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder  /app/public ./public
COPY --from=builder  /app/.next/standalone ./
COPY --from=builder  /app/.next/static ./.next/static

USER nextjs

EXPOSE 3068

ENV PORT 3068

CMD HOSTNAME="0.0.0.0" node server.js