FROM registry.access.redhat.com/ubi9/nodejs-22 As development

USER root
RUN dnf upgrade -y && dnf clean all
USER 1001

WORKDIR /opt/app-root/src

COPY --chown=1001:0 package.json ./
COPY --chown=1001:0 package-lock.json ./

RUN npm ci

COPY --chown=1001:0 . .

RUN npm run build

FROM registry.access.redhat.com/ubi9/nodejs-22 as production

USER root
RUN dnf upgrade -y && dnf clean all
USER 1001

LABEL name="peaka/peaka-mcp-server" vendor="Peaka" version="1.0.0" release="1" summary="peaka-mcp-server — Peaka platform service" description="peaka-mcp-server, part of the Peaka data integration platform, on Red Hat UBI9 (Node.js 22)." maintainer="furkan@peaka.com"

COPY licenses/ /licenses/

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Disable Traceloop PostHog telemetry to prevent connection errors
ENV TRACELOOP_TELEMETRY=false
ENV POSTHOG_DISABLED=true

WORKDIR /opt/app-root/src

COPY --chown=1001:0 package.json ./
COPY --chown=1001:0 package-lock.json ./

RUN npm ci

COPY --chown=1001:0 --from=development /opt/app-root/src/dist ./dist

CMD ["node", "dist/index"]
