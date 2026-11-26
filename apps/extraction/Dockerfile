# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:24-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20
ARG PYTHON_IMAGE=python:3.13-slim@sha256:7249d5587b78209a006dc4a3b5340678f84ea729239193aa559962cd8c1fce50
ARG UV_IMAGE=ghcr.io/astral-sh/uv:0.13.9@sha256:d3b601f0c7b118bc1753febf7c41cc80981df678445e0254284eecf84db79a7d

FROM ${UV_IMAGE} AS uv

FROM ${NODE_IMAGE} AS adapter
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY apps/edge/package.json apps/edge/
COPY apps/extraction/tap/package.json apps/extraction/tap/
COPY packages/hub-api/package.json packages/hub-api/
COPY packages/app-contract/package.json packages/app-contract/
COPY packages/connectors/package.json packages/connectors/
COPY packages/app/package.json packages/app/
COPY infra/aws/package.json infra/aws/
# Node refuses .ts files under node_modules, so the kit stays linked to its folder, as in the Hub's image.
RUN npm ci --omit=dev --omit=optional --no-audit --no-fund -w @conexus/tap && npm cache clean --force
COPY packages/connectors packages/connectors
COPY apps/extraction/tap apps/extraction/tap

# dbt-athena holds mmh3 below 4.2, which has no wheel for Python 3.13: only this stage has a compiler.
FROM ${PYTHON_IMAGE} AS python-deps
RUN apt-get update && apt-get install -y --no-install-recommends gcc libc6-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app/apps/extraction
COPY apps/extraction/pyproject.toml apps/extraction/uv.lock ./
RUN --mount=from=uv,source=/uv,target=/usr/local/bin/uv \
  UV_PYTHON_DOWNLOADS=never uv sync --frozen --no-dev --no-install-project

FROM ${PYTHON_IMAGE}
COPY --from=adapter /usr/local/bin/node /usr/local/bin/node
COPY --from=adapter /app /app
WORKDIR /app/apps/extraction
COPY apps/extraction/pyproject.toml apps/extraction/uv.lock ./
COPY --from=python-deps /app/apps/extraction/.venv .venv
COPY apps/extraction/meltano.yml ./
COPY apps/extraction/contract contract
COPY apps/extraction/src src
RUN --mount=from=uv,source=/uv,target=/usr/local/bin/uv \
  UV_PYTHON_DOWNLOADS=never uv sync --frozen --no-dev \
  && printf '#!/bin/sh\nexec node /app/apps/extraction/tap/src/tap.ts "$@"\n' > /usr/local/bin/tap-conexus \
  && chmod 755 /usr/local/bin/tap-conexus \
  && useradd --create-home copia
ENV PATH=/app/apps/extraction/.venv/bin:$PATH
USER copia
ENTRYPOINT ["conexus-copy"]
