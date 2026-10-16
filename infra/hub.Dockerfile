# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:24-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20

FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/hub-api/package.json packages/hub-api/
RUN npm ci --no-audit --no-fund
COPY tsconfig.base.json ./
COPY packages packages
COPY apps/web apps/web
COPY apps/server apps/server
RUN npm run build -w @conexus/web && npm run build -w @conexus/server

FROM ${NODE_IMAGE}
ARG CONEXUS_VERSION
LABEL conexus.migrate=1
ENV CONEXUS_VERSION=${CONEXUS_VERSION} \
    HUB_PORT=8080 \
    LOG_LEVEL=info
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/hub-api/package.json packages/hub-api/
# Node refuses .ts files under node_modules, so the workspace packages stay linked to their folders.
RUN npm ci --omit=dev --no-audit --no-fund -w @conexus/server && npm cache clean --force
COPY packages/hub-api packages/hub-api
COPY apps/server apps/server
COPY --from=build /app/apps/web/dist apps/web/dist
COPY --from=build /app/apps/server/src/hub/identity/invitation-render.mjs apps/server/src/hub/identity/invitation-render.mjs
USER node
EXPOSE 8080
CMD ["node", "apps/server/src/main.ts"]
