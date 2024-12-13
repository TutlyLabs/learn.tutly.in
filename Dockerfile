FROM oven/bun:latest AS base

WORKDIR /app

RUN apt-get update && apt-get install -y openssl

COPY package.json bun.lockb ./
COPY prisma ./prisma/

FROM base AS prod-deps

ENV HUSKY=0
RUN bun install --global astro
RUN bun install
RUN bun add @astrojs/check typescript
RUN bunx prisma generate

FROM base AS build
COPY . .
RUN bun install --global astro
RUN bun install
RUN bun add @astrojs/check typescript
RUN bun run build || true
RUN ls -la dist/ || true

FROM base AS runtime
RUN apt-get update && apt-get install -y curl
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma

ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

EXPOSE 4321

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4321/health || exit 1

CMD ["sh", "-c", "bunx prisma generate && bunx prisma migrate deploy && HOST=0.0.0.0 bun ./dist/server/entry.mjs"]