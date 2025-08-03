FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/apps/algolia-sync ./dist/apps/algolia-sync
COPY libs ./libs

EXPOSE 5006

CMD ["node", "dist/apps/algolia-sync/src/main.js"] 