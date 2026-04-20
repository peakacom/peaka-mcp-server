FROM node:23-alpine As development

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm

RUN pnpm install

COPY . .

RUN pnpm run build

FROM node:23-alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Disable Traceloop PostHog telemetry to prevent connection errors
ENV TRACELOOP_TELEMETRY=false
ENV POSTHOG_DISABLED=true

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm

RUN pnpm install --prod

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main"]