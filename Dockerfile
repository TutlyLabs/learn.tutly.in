FROM node:lts AS base
WORKDIR /app

RUN apt-get update && apt-get install -y openssl curl && apt-get clean

COPY package.json package-lock.json ./
COPY prisma ./prisma/

FROM base AS prod-deps

ENV HUSKY=0

RUN npm ci
RUN npx prisma generate

RUN cp ./node_modules/.prisma/client/*.* ./node_modules/@prisma/client/

FROM base AS build
COPY --from=prod-deps /app/node_modules ./node_modules
COPY . .

ENV NODE_OPTIONS="--experimental-vm-modules"
RUN npm run build

FROM base AS runtime
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prod-deps /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma

ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production

RUN npx astro telemetry disable

EXPOSE 4321

CMD ["sh", "-c", "node ./dist/server/entry.mjs"]
