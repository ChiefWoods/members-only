FROM oven/bun:latest AS base
WORKDIR /app

FROM base AS development-dependencies-env
ENV HUSKY=0
COPY package.json bun.lock /app/
RUN bun install --frozen-lockfile

FROM base AS production-dependencies-env
ENV HUSKY=0
COPY package.json bun.lock /app/
RUN bun install --frozen-lockfile --production

FROM base AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
RUN bun run build

FROM base AS runtime
COPY package.json bun.lock /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
CMD ["bun", "run", "start"]