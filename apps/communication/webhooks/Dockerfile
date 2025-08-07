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

# Build stage
FROM node:bullseye AS build

RUN npm install -g pnpm
WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm i

COPY . .
RUN pnpm run prisma:generate
RUN pnpm run build:webhooks

# Production stage
FROM node:bullseye AS production

RUN npm install -g pnpm
WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm i --prod

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3006

CMD ["node", "dist/apps/communication/webhooks/src/main.js"] 