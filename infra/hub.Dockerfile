# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:24-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20

FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/hub-api/package.json packages/hub-api/
COPY packages/app-contract/package.json packages/app-contract/
COPY packages/connectors/package.json packages/connectors/
COPY packages/app/package.json packages/app/
COPY apps/edge/package.json apps/edge/
RUN npm ci --no-audit --no-fund
COPY tsconfig.base.json ./
COPY packages packages
COPY apps/web apps/web
COPY apps/server apps/server
RUN npm run build -w @conexus/web && npm run build -w @conexus/server

# Google's sign-in program (decision 0049): the release by its sha256, then the binary by its own,
# the one platform/config.ts pins.
FROM ${NODE_IMAGE} AS cliproxy
ADD --checksum=sha256:16c40b08ace32c5b8956d61385d9d41c312b744412fd10cb547139809cf9e49b \
  https://github.com/router-for-me/CLIProxyAPI/releases/download/v8.0.33/CLIProxyAPI_8.0.33_linux_amd64.tar.gz /tmp/cliproxy.tar.gz
RUN mkdir /opt/cliproxy \
  && tar -xzf /tmp/cliproxy.tar.gz -C /opt/cliproxy cli-proxy-api LICENSE \
  && echo "e78e2ea753a1f6f020b3f9558081a0f433968b86e500fcb8c556365ee13c90dc  /opt/cliproxy/cli-proxy-api" | sha256sum -c -

FROM ${NODE_IMAGE}
ARG CONEXUS_VERSION
LABEL conexus.migrate=1 conexus.reseal=1
ENV CONEXUS_VERSION=${CONEXUS_VERSION} \
    HUB_PORT=8080 \
    HUB_EDGE_PORT=8081 \
    LOG_LEVEL=info
# CLIProxyAPI is a Go binary and reads the system roots; node:24-slim ships none (Node carries its own bundle).
# git keeps each app's repository (decision 0051); its folder is the named volume of compose.yaml,
# owned by the Hub's user so a new volume starts writable.
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates git && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /var/lib/conexus/git && chown node:node /var/lib/conexus/git
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/hub-api/package.json packages/hub-api/
COPY packages/app-contract/package.json packages/app-contract/
COPY packages/connectors/package.json packages/connectors/
COPY packages/app/package.json packages/app/
COPY apps/edge/package.json apps/edge/
# Node refuses .ts files under node_modules, so the workspace packages stay linked to their folders.
RUN npm ci --omit=dev --omit=optional --no-audit --no-fund -w @conexus/server && npm cache clean --force
COPY packages/hub-api packages/hub-api
COPY packages/app-contract packages/app-contract
COPY packages/connectors packages/connectors
COPY packages/app packages/app
COPY apps/server apps/server
COPY --from=build /app/apps/web/dist apps/web/dist
COPY --from=cliproxy /opt/cliproxy /opt/cliproxy
COPY --from=build /app/apps/server/src/hub/identity/invitation-render.mjs apps/server/src/hub/identity/invitation-render.mjs
COPY --from=build /app/apps/server/src/hub/notifications/notification-render.mjs apps/server/src/hub/notifications/notification-render.mjs
USER node
EXPOSE 8080
# 4096 MiB of heap: half the 8 GB host, beside the kernel, Docker, cloudflared and CLIProxyAPI. V8's
# default there is about 2 GB, which a long Builder turn reached (2026-10-31).
CMD ["node", "--max-old-space-size=4096", "apps/server/src/main.ts"]
