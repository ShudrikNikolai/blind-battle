ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN --mount=type=cache,id=yarn-backend,target=/usr/local/share/.cache/yarn,sharing=locked \
    yarn install --frozen-lockfile

FROM deps AS build
COPY . .
RUN yarn build

FROM node:${NODE_VERSION}-alpine AS prod-deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN --mount=type=cache,id=yarn-backend,target=/usr/local/share/.cache/yarn,sharing=locked \
    yarn install --frozen-lockfile --production --ignore-scripts

FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
