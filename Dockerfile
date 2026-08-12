FROM node:22-bookworm

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml vitest.workspace.ts ./
COPY software ./software

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @potty/web build

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/potty.db
ENV STATIC_ROOT=/app/software/apps/web/dist

EXPOSE 3000
VOLUME ["/data"]

CMD ["pnpm", "--filter", "@potty/api", "exec", "tsx", "src/index.ts"]
