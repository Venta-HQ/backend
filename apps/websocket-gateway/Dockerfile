FROM node:alpine AS development

RUN npm install -g pnpm
WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm i
COPY . .
RUN pnpm build websocket-gateway

FROM node:alpine AS production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN npm i -g pnpm
RUN pnpm i --prod
COPY --from=development /usr/src/app/dist/apps/websocket-gateway/src ./dist
COPY --from=development /usr/src/app/libs/proto/src/definitions/location.proto ./proto/src/definitions/location.proto

CMD ["node","dist/main"]