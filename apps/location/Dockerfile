FROM node:alpine AS development

RUN apk add --no-cache protoc


RUN npm install -g pnpm
WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm i
COPY . .
RUN pnpm build location

FROM node:alpine AS production
ARG NODE_ENV=production

ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/src/app


COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm i --prod
COPY --from=development /usr/src/app/dist/apps/location/src ./dist
CMD ["node","dist/main"]