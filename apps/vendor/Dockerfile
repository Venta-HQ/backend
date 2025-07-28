FROM base AS development

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm i
COPY . .

RUN pnpm run prisma:generate
RUN pnpm build vendor

FROM node:bullseye-slim AS production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./
COPY prisma ./prisma

RUN npm i -g pnpm
RUN pnpm i --prod

COPY --from=development /usr/src/app/dist/apps/vendor/src ./dist
COPY --from=development /usr/src/app/dist/apps/vendor/proto ./proto

RUN pnpm run prisma:generate

EXPOSE 5005

CMD ["node","dist/main.js"]