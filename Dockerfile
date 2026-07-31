FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/database/package.json packages/database/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/logger/package.json packages/logger/
COPY packages/services/package.json packages/services/
COPY packages/trpc/package.json packages/trpc/
COPY packages/typescript-config/package.json packages/typescript-config/
RUN pnpm install --frozen-lockfile
COPY . .

ARG DATABASE_URL
ARG JWT_SECRET
ARG RAZORPAY_KEY_ID
ARG RAZORPAY_KEY_SECRET
ARG BASE_URL
ARG ALLOWED_ORIGIN
ARG NEXT_PUBLIC_API_URL
ARG RESEND_API_KEY
ARG RESEND_FROM
ARG CLOUDINARY_API_KEY
ARG CLOUDINARY_API_SECRET
ARG CLOUDINARY_CLOUD_NAME
ARG NODE_ENV=production

ENV DATABASE_URL=$DATABASE_URL
ENV JWT_SECRET=$JWT_SECRET
ENV RAZORPAY_KEY_ID=$RAZORPAY_KEY_ID
ENV RAZORPAY_KEY_SECRET=$RAZORPAY_KEY_SECRET
ENV BASE_URL=$BASE_URL
ENV ALLOWED_ORIGIN=$ALLOWED_ORIGIN
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV RESEND_FROM=$RESEND_FROM
ENV CLOUDINARY_API_KEY=$CLOUDINARY_API_KEY
ENV CLOUDINARY_API_SECRET=$CLOUDINARY_API_SECRET
ENV CLOUDINARY_CLOUD_NAME=$CLOUDINARY_CLOUD_NAME
ENV NODE_ENV=$NODE_ENV

RUN pnpm build

FROM base AS api-deps
WORKDIR /tmp/api-deps
RUN echo '{"name":"api-runtime","private":true,"dependencies":{"pg":"^8","express":"^5","cors":"^2.8","cookie-parser":"^1.4","@trpc/server":"^11","zod":"^4","trpc-to-openapi":"^3"}}' > package.json && npm install

FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=api-deps /tmp/api-deps/node_modules ./api-node-modules

COPY --from=builder /app/packages/database/drizzle ./packages/database/drizzle

COPY migrate.js /app/migrate.js
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV NODE_PATH=/app/api-node-modules

EXPOSE 8600 5600

CMD ["/app/entrypoint.sh"]
