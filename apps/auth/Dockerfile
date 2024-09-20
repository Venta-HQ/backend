FROM node:alpine AS development

RUN apk add --no-cache protoc

RUN npm install -g pnpm
WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm i
COPY . .
RUN pnpm build auth

FROM node:alpine AS production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN npm i -g pnpm
RUN pnpm i --prod
COPY --from=development /usr/src/app/dist/apps/auth/src ./dist
COPY --from=development /usr/src/app/libs/proto/src/definitions/auth.proto ./proto/src/definitions/auth.proto
CMD ["node","dist/main"]