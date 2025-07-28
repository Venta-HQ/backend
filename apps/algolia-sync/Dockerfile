FROM base AS development

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm i
COPY . .

RUN pnpm build algolia-sync

FROM node:bullseye-slim AS production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN npm i -g pnpm
RUN pnpm i --prod

COPY --from=development /usr/src/app/dist/apps/algolia-sync/src ./dist

EXPOSE 5006

CMD ["node", "dist/main.js"] 