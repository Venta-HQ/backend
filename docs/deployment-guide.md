# 🚀 Deployment Guide

## 📋 Table of Contents

- [Overview](#overview)
- [Deployment Architecture](#deployment-architecture)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring and Observability](#monitoring-and-observability)
- [Deployment Checklist](#deployment-checklist)
- [Rollback Procedures](#rollback-procedures)

## 🎯 Overview

This guide covers the **deployment process** for the Venta Backend project across different environments. The system is designed to be deployed using containerization and can be scaled horizontally.

## 🏗️ Deployment Architecture

### **Container Strategy**

The Venta Backend uses **Docker containers** for consistent deployment across environments:

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Load Balancer]
    end

    subgraph "API Gateway Layer"
        AG1[API Gateway<br/>Port 5002]
        AG2[API Gateway<br/>Port 5002]
        AG3[API Gateway<br/>Port 5002]
    end

    subgraph "Core Services"
        US[User Service<br/>Port 5000]
        VS[Vendor Service<br/>Port 5005]
        LS[Location Service<br/>Port 5001]
    end

    subgraph "Real-time Services"
        WG[WebSocket Gateway<br/>Port 5004]
        AS[Algolia Sync<br/>Port 5006]
    end

    subgraph "Infrastructure"
        PG[PostgreSQL]
        R[Redis]
        N[NATS]
    end

    LB --> AG1
    LB --> AG2
    LB --> AG3

    AG1 --> US
    AG1 --> VS
    AG1 --> LS
    AG2 --> US
    AG2 --> VS
    AG2 --> LS
    AG3 --> US
    AG3 --> VS
    AG3 --> LS

    WG --> US
    WG --> VS
    WG --> LS

    US --> PG
    VS --> PG
    LS --> PG

    US --> R
    VS --> R
    LS --> R

    AS --> N
```

## ⚙️ Environment Configuration

### **Environment Variables**

Create environment-specific configuration files:

```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:password@prod-db:5432/venta_prod
REDIS_URL=redis://prod-redis:6379
NATS_URL=nats://prod-nats:4222

# Service Ports
GATEWAY_SERVICE_PORT=5002
USER_SERVICE_ADDRESS=user-service:5000
VENDOR_SERVICE_ADDRESS=vendor-service:5005
LOCATION_SERVICE_ADDRESS=location-service:5001
WEBSOCKET_GATEWAY_SERVICE_PORT=5004
ALGOLIA_SYNC_SERVICE_PORT=5006

# External Services
CLERK_SECRET_KEY=sk_prod_...
ALGOLIA_APP_ID=prod_app_id
ALGOLIA_API_KEY=prod_api_key
CLOUDINARY_CLOUD_NAME=prod_cloud_name
CLOUDINARY_API_KEY=prod_api_key
CLOUDINARY_API_SECRET=prod_api_secret

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
```

### **Configuration Management**

```typescript
// libs/nest/modules/config/config.schema.ts
import { z } from 'zod';

export const configSchema = z.object({
	nodeEnv: z.enum(['development', 'test', 'production']),
	port: z.number().default(3000),
	database: z.object({
		url: z.string().url(),
	}),
	redis: z.object({
		url: z.string().url(),
	}),
	nats: z.object({
		url: z.string().url(),
	}),
	clerk: z.object({
		secretKey: z.string(),
	}),
	algolia: z.object({
		appId: z.string(),
		apiKey: z.string(),
	}),
	cloudinary: z.object({
		cloudName: z.string(),
		apiKey: z.string(),
		apiSecret: z.string(),
	}),
});

export type Config = z.infer<typeof configSchema>;
```

## 🐳 Docker Deployment

### **1. Docker Compose (Development/Staging)**

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Database
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: venta
      POSTGRES_USER: venta_user
      POSTGRES_PASSWORD: venta_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U venta_user -d venta']
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass redis_password
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', '--raw', 'incr', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  # NATS
  nats:
    image: nats:2.9-alpine
    ports:
      - '4222:4222'
      - '8222:8222'
    command: -js -m 8222
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8222/healthz']
      interval: 10s
      timeout: 5s
      retries: 5

  # API Gateway
  gateway:
    build:
      context: .
      dockerfile: apps/gateway/Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://venta_user:venta_password@postgres:5432/venta
      - REDIS_URL=redis://:redis_password@redis:6379
      - NATS_URL=nats://nats:4222
      - USER_SERVICE_ADDRESS=user-service:5000
      - VENDOR_SERVICE_ADDRESS=vendor-service:5005
      - LOCATION_SERVICE_ADDRESS=location-service:5001
    ports:
      - '5002:5002'
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      user-service:
        condition: service_healthy
      vendor-service:
        condition: service_healthy
      location-service:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:5002/health']
      interval: 30s
      timeout: 10s
      retries: 3

  # User Service
  user-service:
    build:
      context: .
      dockerfile: apps/user/Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://venta_user:venta_password@postgres:5432/venta
      - REDIS_URL=redis://:redis_password@redis:6379
    ports:
      - '5000:5000'
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # Vendor Service
  vendor-service:
    build:
      context: .
      dockerfile: apps/vendor/Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://venta_user:venta_password@postgres:5432/venta
      - REDIS_URL=redis://:redis_password@redis:6379
    ports:
      - '5005:5005'
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # Location Service
  location-service:
    build:
      context: .
      dockerfile: apps/location/Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://venta_user:venta_password@postgres:5432/venta
      - REDIS_URL=redis://:redis_password@redis:6379
    ports:
      - '5001:5001'
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # WebSocket Gateway
  websocket-gateway:
    build:
      context: .
      dockerfile: apps/websocket-gateway/Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://venta_user:venta_password@postgres:5432/venta
      - REDIS_URL=redis://:redis_password@redis:6379
      - USER_SERVICE_ADDRESS=user-service:5000
      - VENDOR_SERVICE_ADDRESS=vendor-service:5005
      - LOCATION_SERVICE_ADDRESS=location-service:5001
    ports:
      - '5004:5004'
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      user-service:
        condition: service_healthy
      vendor-service:
        condition: service_healthy
      location-service:
        condition: service_healthy

  # Algolia Sync
  algolia-sync:
    build:
      context: .
      dockerfile: apps/algolia-sync/Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://venta_user:venta_password@postgres:5432/venta
      - REDIS_URL=redis://:redis_password@redis:6379
    ports:
      - '5006:5006'
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - '9090:9090'
    volumes:
      - ./docker/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    ports:
      - '3000:3000'
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./docker/grafana-dashboards:/etc/grafana/provisioning/dashboards

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
```

### **2. Dockerfile Optimization**

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/*/package.json ./apps/
COPY libs/*/package.json ./libs/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/*/package.json ./apps/
COPY libs/*/package.json ./libs/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership
RUN chown -R nestjs:nodejs /app
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Expose port
EXPOSE ${PORT:-3000}

# Start the application
CMD ["node", "dist/apps/gateway/src/main.js"]
```

## ☸️ Kubernetes Deployment

### **1. Namespace and ConfigMaps**

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: venta-backend
  labels:
    name: venta-backend

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: venta-config
  namespace: venta-backend
data:
  NODE_ENV: 'production'
  GATEWAY_SERVICE_PORT: '5002'
  USER_SERVICE_ADDRESS: 'user-service:5000'
  VENDOR_SERVICE_ADDRESS: 'vendor-service:5005'
  LOCATION_SERVICE_ADDRESS: 'location-service:5001'
  WEBSOCKET_GATEWAY_SERVICE_PORT: '5004'
  ALGOLIA_SYNC_SERVICE_PORT: '5006'
```

### **2. Secrets**

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: venta-secrets
  namespace: venta-backend
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  REDIS_URL: <base64-encoded-redis-url>
  NATS_URL: <base64-encoded-nats-url>
  CLERK_SECRET_KEY: <base64-encoded-clerk-secret>
  ALGOLIA_APP_ID: <base64-encoded-algolia-app-id>
  ALGOLIA_API_KEY: <base64-encoded-algolia-api-key>
  CLOUDINARY_CLOUD_NAME: <base64-encoded-cloudinary-name>
  CLOUDINARY_API_KEY: <base64-encoded-cloudinary-key>
  CLOUDINARY_API_SECRET: <base64-encoded-cloudinary-secret>
```

### **3. Service Deployments**

```yaml
# k8s/gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gateway
  namespace: venta-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gateway
  template:
    metadata:
      labels:
        app: gateway
    spec:
      containers:
        - name: gateway
          image: venta/gateway:latest
          ports:
            - containerPort: 5002
          envFrom:
            - configMapRef:
                name: venta-config
            - secretRef:
                name: venta-secrets
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 5002
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 5002
            initialDelaySeconds: 5
            periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: gateway-service
  namespace: venta-backend
spec:
  selector:
    app: gateway
  ports:
    - protocol: TCP
      port: 80
      targetPort: 5002
  type: LoadBalancer
```

### **4. Ingress Configuration**

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: venta-ingress
  namespace: venta-backend
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
    cert-manager.io/cluster-issuer: 'letsencrypt-prod'
spec:
  tls:
    - hosts:
        - api.venta.com
      secretName: venta-tls
  rules:
    - host: api.venta.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: gateway-service
                port:
                  number: 80
```

## 🔄 CI/CD Pipeline

### **1. GitHub Actions Workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm run test:run

      - name: Build application
        run: pnpm run build

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker images
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            venta/gateway:latest
            venta/gateway:${{ github.sha }}
            venta/user-service:latest
            venta/user-service:${{ github.sha }}
            venta/vendor-service:latest
            venta/vendor-service:${{ github.sha }}
            venta/location-service:latest
            venta/location-service:${{ github.sha }}
            venta/websocket-gateway:latest
            venta/websocket-gateway:${{ github.sha }}
            venta/algolia-sync:latest
            venta/algolia-sync:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: 'latest'

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > kubeconfig.yaml
          export KUBECONFIG=kubeconfig.yaml

      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f k8s/
          kubectl set image deployment/gateway gateway=venta/gateway:${{ github.sha }} -n venta-backend
          kubectl set image deployment/user-service user-service=venta/user-service:${{ github.sha }} -n venta-backend
          kubectl set image deployment/vendor-service vendor-service=venta/vendor-service:${{ github.sha }} -n venta-backend
          kubectl set image deployment/location-service location-service=venta/location-service:${{ github.sha }} -n venta-backend
          kubectl set image deployment/websocket-gateway websocket-gateway=venta/websocket-gateway:${{ github.sha }} -n venta-backend
          kubectl set image deployment/algolia-sync algolia-sync=venta/algolia-sync:${{ github.sha }} -n venta-backend
```

## 📊 Monitoring and Observability

### **1. Health Checks**

```typescript
// Health check endpoint
@Controller('health')
export class HealthController {
	constructor(
		private readonly health: HealthCheckService,
		private readonly db: TypeOrmHealthIndicator,
		private readonly redis: RedisHealthIndicator,
	) {}

	@Get()
	@HealthCheck()
	check() {
		return this.health.check([() => this.db.pingCheck('database'), () => this.redis.pingCheck('redis')]);
	}
}
```

### **2. Metrics Collection**

```typescript
// Prometheus metrics
@Injectable()
export class MetricsService {
	private readonly httpRequestDuration = new Histogram({
		name: 'http_request_duration_seconds',
		help: 'Duration of HTTP requests in seconds',
		labelNames: ['method', 'route', 'status_code'],
	});

	private readonly activeConnections = new Gauge({
		name: 'websocket_active_connections',
		help: 'Number of active WebSocket connections',
	});

	recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
		this.httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration);
	}

	setActiveConnections(count: number) {
		this.activeConnections.set(count);
	}
}
```

## ✅ Deployment Checklist

### **Pre-Deployment**

- [ ] All tests passing
- [ ] Code review completed
- [ ] Security scan passed
- [ ] Performance benchmarks met
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] Secrets updated
- [ ] Monitoring alerts configured

### **Deployment**

- [ ] Backup production database
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Verify health checks
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Update DNS if needed

### **Post-Deployment**

- [ ] Monitor application logs
- [ ] Check error rates
- [ ] Verify all services are healthy
- [ ] Test critical user flows
- [ ] Update documentation
- [ ] Notify stakeholders

## 🔄 Rollback Procedures

### **1. Docker Compose Rollback**

```bash
# Rollback to previous version
docker-compose down
docker-compose pull
docker-compose up -d

# Or rollback to specific tag
docker-compose down
docker-compose up -d --force-recreate
```

### **2. Kubernetes Rollback**

```bash
# Rollback deployment
kubectl rollout undo deployment/gateway -n venta-backend

# Rollback to specific revision
kubectl rollout undo deployment/gateway --to-revision=2 -n venta-backend

# Check rollout status
kubectl rollout status deployment/gateway -n venta-backend
```

### **3. Database Rollback**

```bash
# Rollback database migration
pnpm run prisma:migrate:reset
pnpm run prisma:migrate:deploy

# Or restore from backup
pg_restore -d venta_prod backup.sql
```

## 📈 Performance Optimization

### **Resource Allocation**

| Service               | CPU Request | CPU Limit | Memory Request | Memory Limit |
| --------------------- | ----------- | --------- | -------------- | ------------ |
| **Gateway**           | 250m        | 500m      | 256Mi          | 512Mi        |
| **User Service**      | 200m        | 400m      | 256Mi          | 512Mi        |
| **Vendor Service**    | 200m        | 400m      | 256Mi          | 512Mi        |
| **Location Service**  | 200m        | 400m      | 256Mi          | 512Mi        |
| **WebSocket Gateway** | 300m        | 600m      | 512Mi          | 1Gi          |
| **Algolia Sync**      | 100m        | 200m      | 128Mi          | 256Mi        |

### **Scaling Policies**

```yaml
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gateway-hpa
  namespace: venta-backend
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: gateway
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

## 🔒 Security Considerations

### **Network Policies**

```yaml
# k8s/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: venta-network-policy
  namespace: venta-backend
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 5002
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: venta-backend
      ports:
        - protocol: TCP
          port: 5000
        - protocol: TCP
          port: 5001
        - protocol: TCP
          port: 5005
```

### **Pod Security Standards**

```yaml
# k8s/pod-security.yaml
apiVersion: v1
kind: Pod
metadata:
  name: gateway-pod
  namespace: venta-backend
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    runAsGroup: 1001
    fsGroup: 1001
  containers:
    - name: gateway
      image: venta/gateway:latest
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
```

## 📊 Monitoring Dashboards

### **Grafana Dashboard Configuration**

```json
{
	"dashboard": {
		"title": "Venta Backend Overview",
		"panels": [
			{
				"title": "Service Health",
				"type": "stat",
				"targets": [
					{
						"expr": "up{job=\"venta-backend\"}",
						"legendFormat": "{{service}}"
					}
				]
			},
			{
				"title": "Request Rate",
				"type": "graph",
				"targets": [
					{
						"expr": "rate(http_requests_total[5m])",
						"legendFormat": "{{service}}"
					}
				]
			},
			{
				"title": "Response Time",
				"type": "graph",
				"targets": [
					{
						"expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
						"legendFormat": "95th percentile"
					}
				]
			}
		]
	}
}
```

---

**This deployment guide provides comprehensive coverage for deploying the Venta Backend across different environments with proper monitoring and rollback procedures.**
