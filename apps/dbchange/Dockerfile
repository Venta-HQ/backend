FROM node:bullseye AS development

# Install necessary packages
RUN apt-get update && apt-get install -y \
    protobuf-compiler \
    autoconf \
    automake \
    libtool \
    build-essential \
    curl \
    git \
    unzip \
    libprotobuf-dev \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Download and install protoc
RUN curl -OL https://github.com/protocolbuffers/protobuf/releases/download/v21.12/protoc-21.12-linux-x86_64.zip && \
    unzip protoc-21.12-linux-x86_64.zip -d /usr/local && \
    rm protoc-21.12-linux-x86_64.zip

ENV PATH="$PATH:/usr/local/bin"
ENV PROTOC_INCLUDE_PATH=/usr/local/include

RUN npm install -g pnpm
WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm i
COPY . .

RUN pnpm run prisma:generate
RUN pnpm build dbchange

FROM node:bullseye-slim AS production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./
COPY prisma ./prisma

RUN npm i -g pnpm
RUN pnpm i --prod
RUN npm install pm2 -g

COPY --from=development /usr/src/app/dist/apps/dbchange/src ./dist

RUN pnpm run prisma:generate
CMD ["pm2-runtime","dist/main.js"]