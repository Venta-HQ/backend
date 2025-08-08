# 🚀 Deployment & Scaling Guide

## Overview

This guide outlines the deployment and scaling strategies for the Venta backend. Our architecture is designed for containerized deployment with independent scaling of services.

## 📋 Table of Contents

1. [Deployment Strategy](#deployment-strategy)
2. [Container Configuration](#container-configuration)
3. [Service Scaling](#service-scaling)
4. [Infrastructure Setup](#infrastructure-setup)
5. [Monitoring & Health Checks](#monitoring--health-checks)
6. [Deployment Process](#deployment-process)

## Deployment Strategy

### Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Gateway   │────▶│  Services   │────▶│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                    │
      │                    │                    │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Cache    │◀───▶│   Events    │◀───▶│  Storage    │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Service Organization

```
services/
├── marketplace/
│   ├── user-management/
│   ├── vendor-management/
│   └── search-discovery/
├── location-services/
│   ├── geolocation/
│   └── real-time/
├── communication/
│   └── webhooks/
└── infrastructure/
    ├── api-gateway/
    └── file-management/
```

## Container Configuration

### Base Dockerfile

```dockerfile
# Base Dockerfile for services
FROM node:18-alpine as builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Set environment
ENV NODE_ENV=production

# Start application
CMD ["node", "dist/main"]
```

### Service-Specific Dockerfile

```dockerfile
# Example: Vendor Management Service
FROM venta/base:latest

# Service-specific configuration
ENV SERVICE_NAME=vendor-management
ENV SERVICE_PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:${SERVICE_PORT}/health || exit 1

# Expose port
EXPOSE ${SERVICE_PORT}

# Start service
CMD ["node", "dist/apps/marketplace/vendor-management/main"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  # API Gateway
  api-gateway:
    build:
      context: .
      dockerfile: apps/infrastructure/api-gateway/Dockerfile
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
    depends_on:
      - user-management
      - vendor-management
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s

  # User Management Service
  user-management:
    build:
      context: .
      dockerfile: apps/marketplace/user-management/Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/venta
    depends_on:
      - db
    deploy:
      replicas: 2

  # Vendor Management Service
  vendor-management:
    build:
      context: .
      dockerfile: apps/marketplace/vendor-management/Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/venta
    depends_on:
      - db
    deploy:
      replicas: 2

  # Location Service
  location-service:
    build:
      context: .
      dockerfile: apps/location-services/geolocation/Dockerfile
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    deploy:
      replicas: 3

  # Database
  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=venta
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis
  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## Service Scaling

### Scaling Configuration

```typescript
// apps/infrastructure/api-gateway/src/config/scaling.config.ts
export const scalingConfig = {
	services: {
		'user-management': {
			minReplicas: 2,
			maxReplicas: 5,
			targetCPU: 70,
			targetMemory: 80,
		},
		'vendor-management': {
			minReplicas: 2,
			maxReplicas: 5,
			targetCPU: 70,
			targetMemory: 80,
		},
		'location-service': {
			minReplicas: 3,
			maxReplicas: 10,
			targetCPU: 60,
			targetMemory: 70,
		},
		'real-time': {
			minReplicas: 2,
			maxReplicas: 8,
			targetCPU: 50,
			targetMemory: 60,
		},
	},
};
```

### Kubernetes Configuration

```yaml
# kubernetes/base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${SERVICE_NAME}
spec:
  replicas: ${MIN_REPLICAS}
  selector:
    matchLabels:
      app: ${SERVICE_NAME}
  template:
    metadata:
      labels:
        app: ${SERVICE_NAME}
    spec:
      containers:
        - name: ${SERVICE_NAME}
          image: ${SERVICE_IMAGE}
          ports:
            - containerPort: ${SERVICE_PORT}
          env:
            - name: NODE_ENV
              value: production
          resources:
            requests:
              cpu: ${CPU_REQUEST}
              memory: ${MEMORY_REQUEST}
            limits:
              cpu: ${CPU_LIMIT}
              memory: ${MEMORY_LIMIT}
          livenessProbe:
            httpGet:
              path: /health
              port: ${SERVICE_PORT}
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: ${SERVICE_PORT}
            initialDelaySeconds: 5
            periodSeconds: 5

---
# kubernetes/base/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${SERVICE_NAME}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${SERVICE_NAME}
  minReplicas: ${MIN_REPLICAS}
  maxReplicas: ${MAX_REPLICAS}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: ${TARGET_CPU}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: ${TARGET_MEMORY}
```

## Infrastructure Setup

### Database Configuration

```typescript
// libs/nest/modules/data/prisma/prisma.config.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaConfig {
	constructor(private configService: ConfigService) {}

	getDatabaseUrl(): string {
		return this.configService.get<string>('DATABASE_URL');
	}

	getPoolConfig() {
		return {
			min: this.configService.get<number>('DB_POOL_MIN', 2),
			max: this.configService.get<number>('DB_POOL_MAX', 10),
		};
	}
}
```

### Redis Configuration

```typescript
// libs/nest/modules/data/redis/redis.config.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisConfig {
	constructor(private configService: ConfigService) {}

	getRedisConfig() {
		return {
			url: this.configService.get<string>('REDIS_URL'),
			maxRetriesPerRequest: 3,
			enableReadyCheck: true,
			maxRetryTime: 10000,
		};
	}
}
```

### Message Queue Configuration

```typescript
// libs/nest/modules/messaging/nats/nats.config.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NatsConfig {
	constructor(private configService: ConfigService) {}

	getNatsConfig() {
		return {
			servers: this.configService.get<string[]>('NATS_SERVERS'),
			queue: this.configService.get<string>('NATS_QUEUE'),
			maxReconnectAttempts: 5,
			reconnectTimeWait: 2000,
		};
	}
}
```

## Monitoring & Health Checks

### Health Check Implementation

```typescript
// libs/nest/modules/monitoring/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
	constructor(
		private health: HealthCheckService,
		private db: DatabaseHealthIndicator,
		private redis: RedisHealthIndicator,
	) {}

	@Get()
	@HealthCheck()
	check() {
		return this.health.check([() => this.db.pingCheck('database'), () => this.redis.pingCheck('redis')]);
	}
}
```

### Metrics Collection

```typescript
// libs/nest/modules/monitoring/prometheus/metrics.service.ts
import { Counter, Histogram, Registry } from 'prom-client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
	private readonly registry: Registry;
	private readonly requestCounter: Counter;
	private readonly requestDuration: Histogram;

	constructor() {
		this.registry = new Registry();

		this.requestCounter = new Counter({
			name: 'http_requests_total',
			help: 'Total HTTP requests',
			labelNames: ['method', 'path', 'status'],
		});

		this.requestDuration = new Histogram({
			name: 'http_request_duration_seconds',
			help: 'HTTP request duration',
			labelNames: ['method', 'path'],
		});

		this.registry.registerMetric(this.requestCounter);
		this.registry.registerMetric(this.requestDuration);
	}

	recordRequest(method: string, path: string, status: number) {
		this.requestCounter.inc({ method, path, status });
	}

	recordRequestDuration(method: string, path: string, duration: number) {
		this.requestDuration.observe({ method, path }, duration);
	}
}
```

## Deployment Process

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: pnpm install
      - name: Run tests
        run: pnpm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build containers
        run: docker-compose build
      - name: Push containers
        run: docker-compose push

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f kubernetes/
          kubectl rollout status deployment/api-gateway
```

### Deployment Script

```bash
#!/bin/bash
# scripts/deploy.sh

# Configuration
ENVIRONMENT=$1
VERSION=$2

# Validate input
if [ -z "$ENVIRONMENT" ] || [ -z "$VERSION" ]; then
  echo "Usage: deploy.sh <environment> <version>"
  exit 1
fi

# Load environment variables
source .env.$ENVIRONMENT

# Update Kubernetes configs
envsubst < kubernetes/base/deployment.yaml > kubernetes/deployment.yaml
envsubst < kubernetes/base/hpa.yaml > kubernetes/hpa.yaml

# Apply configurations
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secret.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/hpa.yaml

# Wait for rollout
kubectl rollout status deployment/api-gateway
kubectl rollout status deployment/user-management
kubectl rollout status deployment/vendor-management
kubectl rollout status deployment/location-service

# Verify deployment
kubectl get pods
kubectl get hpa
```

### Rollback Script

```bash
#!/bin/bash
# scripts/rollback.sh

# Configuration
ENVIRONMENT=$1
VERSION=$2

# Validate input
if [ -z "$ENVIRONMENT" ] || [ -z "$VERSION" ]; then
  echo "Usage: rollback.sh <environment> <version>"
  exit 1
fi

# Rollback deployments
kubectl rollout undo deployment/api-gateway
kubectl rollout undo deployment/user-management
kubectl rollout undo deployment/vendor-management
kubectl rollout undo deployment/location-service

# Wait for rollback
kubectl rollout status deployment/api-gateway
kubectl rollout status deployment/user-management
kubectl rollout status deployment/vendor-management
kubectl rollout status deployment/location-service

# Verify rollback
kubectl get pods
```

## Best Practices

### Deployment

1. **Container Best Practices**

   - Use multi-stage builds
   - Minimize image size
   - Use specific versions
   - Implement health checks

2. **Configuration Management**

   - Use environment variables
   - Separate configs by environment
   - Use secrets management
   - Version control configs

3. **High Availability**
   - Multiple replicas
   - Pod anti-affinity
   - Rolling updates
   - Health monitoring

### Scaling

1. **Resource Management**

   - Set resource limits
   - Configure HPA
   - Monitor resource usage
   - Optimize performance

2. **Database Scaling**

   - Connection pooling
   - Read replicas
   - Sharding strategy
   - Backup strategy

3. **Cache Strategy**
   - Distributed caching
   - Cache invalidation
   - Cache monitoring
   - Performance tuning

### Monitoring

1. **Metrics Collection**

   - Business metrics
   - System metrics
   - Custom metrics
   - Alert thresholds

2. **Logging Strategy**

   - Structured logging
   - Log aggregation
   - Log retention
   - Error tracking

3. **Performance Monitoring**
   - Response times
   - Error rates
   - Resource usage
   - Business KPIs

## Additional Resources

- [Architecture Guide](./architecture-guide.md)
- [Developer Guide](./developer-guide.md)
- [API Documentation](./api-docs.md)
- [Monitoring Guide](./monitoring-guide.md)
