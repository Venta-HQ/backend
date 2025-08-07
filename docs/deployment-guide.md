# 🚀 Deployment Guide

## 📋 Table of Contents

- [Overview](#overview)
- [DDD Deployment Architecture](#ddd-deployment-architecture)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Domain-Specific Deployment](#domain-specific-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring and Observability](#monitoring-and-observability)
- [Deployment Checklist](#deployment-checklist)
- [Rollback Procedures](#rollback-procedures)

## 🎯 Overview

This guide covers the **deployment process** for the Venta Backend project across different environments. The system is designed with Domain-Driven Design (DDD) principles and can be deployed using containerization with domain-specific scaling strategies.

## 🏗️ DDD Deployment Architecture

### **Domain-Based Container Strategy**

The Venta Backend uses **Docker containers** organized by business domains for consistent deployment:

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Load Balancer]
    end

    subgraph "Infrastructure Domain"
        AG1[API Gateway<br/>Port 5002]
        AG2[API Gateway<br/>Port 5002]
        AG3[API Gateway<br/>Port 5002]
        FM[File Management<br/>Port 5003]
    end

    subgraph "Marketplace Domain"
        UM1[User Management<br/>Port 5000]
        UM2[User Management<br/>Port 5000]
        VM1[Vendor Management<br/>Port 5005]
        VM2[Vendor Management<br/>Port 5005]
        SD[Search Discovery<br/>Port 5006]
    end

    subgraph "Location Services Domain"
        GL1[Geolocation<br/>Port 5001]
        GL2[Geolocation<br/>Port 5001]
        RT1[Real-time<br/>Port 5004]
        RT2[Real-time<br/>Port 5004]
        RT3[Real-time<br/>Port 5004]
    end

    subgraph "Communication Domain"
        WH[Webhooks<br/>Port 5007]
    end

    subgraph "Infrastructure"
        PG[PostgreSQL]
        R[Redis]
        N[NATS]
    end

    LB --> AG1
    LB --> AG2
    LB --> AG3

    AG1 --> UM1
    AG1 --> VM1
    AG1 --> GL1
    AG2 --> UM2
    AG2 --> VM2
    AG2 --> GL2
    AG3 --> RT1
    AG3 --> RT2
    AG3 --> RT3

    RT1 --> UM1
    RT2 --> VM1
    RT3 --> GL1

    UM1 --> PG
    VM1 --> PG
    GL1 --> PG

    GL1 --> R
    GL2 --> R
    RT1 --> R
    RT2 --> R
    RT3 --> R

    SD --> N
    WH --> N
```

### **Domain-Specific Scaling**

Each domain has different scaling requirements based on business needs:

#### **🏪 Marketplace Domain**
- **User Management**: Scale based on user activity
- **Vendor Management**: Scale based on vendor operations
- **Search Discovery**: Scale based on search volume

#### **📍 Location Services Domain**
- **Geolocation**: Scale based on location update frequency
- **Real-time**: Scale based on WebSocket connections

#### **💬 Communication Domain**
- **Webhooks**: Scale based on external integration volume

#### **🔧 Infrastructure Domain**
- **API Gateway**: Scale based on overall traffic
- **File Management**: Scale based on file upload volume

## ⚙️ Environment Configuration

### **Environment Variables**

Create environment-specific configuration files with domain context:

```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:password@prod-db:5432/venta_prod
REDIS_URL=redis://prod-redis:6379
NATS_URL=nats://prod-nats:4222

# Domain Configuration
DOMAIN=marketplace  # Set per service

# Service Ports
GATEWAY_SERVICE_PORT=5002
USER_MANAGEMENT_SERVICE_ADDRESS=user-management:5000
VENDOR_MANAGEMENT_SERVICE_ADDRESS=vendor-management:5005
GEOLOCATION_SERVICE_ADDRESS=geolocation:5001
REAL_TIME_SERVICE_ADDRESS=real-time:5004
SEARCH_DISCOVERY_SERVICE_ADDRESS=search-discovery:5006
WEBHOOKS_SERVICE_ADDRESS=webhooks:5007
FILE_MANAGEMENT_SERVICE_ADDRESS=file-management:5003
```

### **Domain-Specific Configuration**

Each domain can have its own configuration:

```bash
# Marketplace Domain
MARKETPLACE_DOMAIN_CONFIG=production
USER_ACTIVITY_THRESHOLD=1000
VENDOR_OPERATIONS_LIMIT=500

# Location Services Domain
LOCATION_SERVICES_DOMAIN_CONFIG=production
LOCATION_UPDATE_FREQUENCY=30
GEOSPATIAL_QUERY_LIMIT=1000

# Communication Domain
COMMUNICATION_DOMAIN_CONFIG=production
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_TIMEOUT=5000

# Infrastructure Domain
INFRASTRUCTURE_DOMAIN_CONFIG=production
GATEWAY_RATE_LIMIT=1000
FILE_UPLOAD_MAX_SIZE=10MB
```

## 🐳 Docker Deployment

### **Domain-Based Docker Compose**

```yaml
version: '3.8'

services:
  # Infrastructure Domain
  api-gateway:
    build: ./apps/infrastructure/api-gateway
    environment:
      - DOMAIN=infrastructure
      - NODE_ENV=production
    ports:
      - "5002:5002"
    depends_on:
      - postgres
      - redis
      - nats

  file-management:
    build: ./apps/infrastructure/file-management
    environment:
      - DOMAIN=infrastructure
      - NODE_ENV=production
    ports:
      - "5003:5003"
    depends_on:
      - postgres

  # Marketplace Domain
  user-management:
    build: ./apps/marketplace/user-management
    environment:
      - DOMAIN=marketplace
      - NODE_ENV=production
    ports:
      - "5000:5000"
    depends_on:
      - postgres
      - nats

  vendor-management:
    build: ./apps/marketplace/vendor-management
    environment:
      - DOMAIN=marketplace
      - NODE_ENV=production
    ports:
      - "5005:5005"
    depends_on:
      - postgres
      - nats

  search-discovery:
    build: ./apps/marketplace/search-discovery
    environment:
      - DOMAIN=marketplace
      - NODE_ENV=production
    ports:
      - "5006:5006"
    depends_on:
      - nats

  # Location Services Domain
  geolocation:
    build: ./apps/location-services/geolocation
    environment:
      - DOMAIN=location-services
      - NODE_ENV=production
    ports:
      - "5001:5001"
    depends_on:
      - postgres
      - redis
      - nats

  real-time:
    build: ./apps/location-services/real-time
    environment:
      - DOMAIN=location-services
      - NODE_ENV=production
    ports:
      - "5004:5004"
    depends_on:
      - redis
      - nats

  # Communication Domain
  webhooks:
    build: ./apps/communication/webhooks
    environment:
      - DOMAIN=communication
      - NODE_ENV=production
    ports:
      - "5007:5007"
    depends_on:
      - nats

  # Infrastructure Services
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: venta_prod
      POSTGRES_USER: venta_user
      POSTGRES_PASSWORD: venta_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  nats:
    image: nats:2-alpine
    ports:
      - "4222:4222"

volumes:
  postgres_data:
  redis_data:
```

### **Domain-Specific Dockerfiles**

Each service has a domain-aware Dockerfile:

```dockerfile
# apps/marketplace/user-management/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Set domain context
ENV DOMAIN=marketplace

EXPOSE 5000

CMD ["npm", "run", "start:prod"]
```

## ☸️ Kubernetes Deployment

### **Domain-Based Kubernetes Configuration**

```yaml
# k8s/marketplace/user-management.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-management
  namespace: marketplace
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-management
      domain: marketplace
  template:
    metadata:
      labels:
        app: user-management
        domain: marketplace
    spec:
      containers:
      - name: user-management
        image: venta/user-management:latest
        env:
        - name: DOMAIN
          value: "marketplace"
        - name: NODE_ENV
          value: "production"
        ports:
        - containerPort: 5000
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 1000m
            memory: 2Gi
```

### **Domain-Specific Resource Allocation**

```yaml
# k8s/location-services/geolocation.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: geolocation
  namespace: location-services
spec:
  replicas: 3
  selector:
    matchLabels:
      app: geolocation
      domain: location-services
  template:
    metadata:
      labels:
        app: geolocation
        domain: location-services
    spec:
      containers:
      - name: geolocation
        image: venta/geolocation:latest
        env:
        - name: DOMAIN
          value: "location-services"
        - name: NODE_ENV
          value: "production"
        ports:
        - containerPort: 5001
        resources:
          requests:
            cpu: 1000m
            memory: 2Gi
          limits:
            cpu: 2000m
            memory: 4Gi
```

## 🏛️ Domain-Specific Deployment

### **Marketplace Domain Deployment**

```bash
# Deploy marketplace services
kubectl apply -f k8s/marketplace/

# Scale based on business demand
kubectl scale deployment user-management --replicas=5 -n marketplace
kubectl scale deployment vendor-management --replicas=3 -n marketplace
kubectl scale deployment search-discovery --replicas=2 -n marketplace
```

### **Location Services Domain Deployment**

```bash
# Deploy location services
kubectl apply -f k8s/location-services/

# Scale based on location activity
kubectl scale deployment geolocation --replicas=5 -n location-services
kubectl scale deployment real-time --replicas=7 -n location-services
```

### **Communication Domain Deployment**

```bash
# Deploy communication services
kubectl apply -f k8s/communication/

# Scale based on webhook volume
kubectl scale deployment webhooks --replicas=3 -n communication
```

### **Infrastructure Domain Deployment**

```bash
# Deploy infrastructure services
kubectl apply -f k8s/infrastructure/

# Scale based on overall traffic
kubectl scale deployment api-gateway --replicas=5 -n infrastructure
kubectl scale deployment file-management --replicas=2 -n infrastructure
```

## 🔄 CI/CD Pipeline

### **Domain-Aware Pipeline**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-marketplace:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Marketplace Services
      run: |
        docker build -t venta/user-management:latest ./apps/marketplace/user-management
        docker build -t venta/vendor-management:latest ./apps/marketplace/vendor-management
        docker build -t venta/search-discovery:latest ./apps/marketplace/search-discovery
    
    - name: Deploy to Marketplace Namespace
      run: |
        kubectl apply -f k8s/marketplace/
        kubectl rollout restart deployment/user-management -n marketplace
        kubectl rollout restart deployment/vendor-management -n marketplace
        kubectl rollout restart deployment/search-discovery -n marketplace

  deploy-location-services:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Location Services
      run: |
        docker build -t venta/geolocation:latest ./apps/location-services/geolocation
        docker build -t venta/real-time:latest ./apps/location-services/real-time
    
    - name: Deploy to Location Services Namespace
      run: |
        kubectl apply -f k8s/location-services/
        kubectl rollout restart deployment/geolocation -n location-services
        kubectl rollout restart deployment/real-time -n location-services
```

## 📊 Monitoring and Observability

### **Domain-Specific Monitoring**

```yaml
# monitoring/grafana/dashboards/marketplace-dashboard.json
{
  "dashboard": {
    "title": "Marketplace Domain Metrics",
    "panels": [
      {
        "title": "User Management - Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{domain=\"marketplace\",service=\"user-management\"}[5m])"
          }
        ]
      },
      {
        "title": "Vendor Management - Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{domain=\"marketplace\",service=\"vendor-management\",status=~\"5..\"}[5m])"
          }
        ]
      }
    ]
  }
}
```

### **Domain-Based Alerting**

```yaml
# monitoring/alertmanager/rules/marketplace-alerts.yml
groups:
- name: marketplace-alerts
  rules:
  - alert: UserManagementHighErrorRate
    expr: rate(http_requests_total{domain="marketplace",service="user-management",status=~"5.."}[5m]) > 0.1
    for: 2m
    labels:
      domain: marketplace
      severity: critical
    annotations:
      summary: "High error rate in User Management service"
      description: "User Management service is experiencing {{ $value }} errors per second"

  - alert: LocationServicesHighLatency
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{domain="location-services"}[5m])) > 1
    for: 2m
    labels:
      domain: location-services
      severity: warning
    annotations:
      summary: "High latency in Location Services"
      description: "95th percentile latency is {{ $value }} seconds"
```

## ✅ Deployment Checklist

### **Pre-Deployment**

- [ ] **Domain Configuration**: Verify domain settings for each service
- [ ] **Environment Variables**: Set all required environment variables
- [ ] **Database Migrations**: Run Prisma migrations
- [ ] **Health Checks**: Verify all services have proper health endpoints
- [ ] **Resource Limits**: Set appropriate CPU/memory limits per domain
- [ ] **Monitoring**: Configure domain-specific monitoring and alerting

### **Deployment**

- [ ] **Infrastructure First**: Deploy infrastructure services (API Gateway, File Management)
- [ ] **Communication Services**: Deploy webhooks and messaging services
- [ ] **Location Services**: Deploy geolocation and real-time services
- [ ] **Marketplace Services**: Deploy user management, vendor management, search
- [ ] **Health Verification**: Verify all services are healthy
- [ ] **Traffic Routing**: Update load balancer configuration

### **Post-Deployment**

- [ ] **Monitoring**: Verify metrics and logs are flowing
- [ ] **Error Tracking**: Check for any domain-specific errors
- [ ] **Performance**: Monitor domain-specific performance metrics
- [ ] **User Testing**: Verify end-to-end functionality
- [ ] **Rollback Plan**: Ensure rollback procedures are ready

## 🔄 Rollback Procedures

### **Domain-Specific Rollback**

```bash
# Rollback specific domain
kubectl rollout undo deployment/user-management -n marketplace
kubectl rollout undo deployment/vendor-management -n marketplace

# Rollback location services
kubectl rollout undo deployment/geolocation -n location-services
kubectl rollout undo deployment/real-time -n location-services

# Rollback infrastructure
kubectl rollout undo deployment/api-gateway -n infrastructure
```

### **Full System Rollback**

```bash
# Rollback all services to previous version
kubectl rollout undo deployment --all -n marketplace
kubectl rollout undo deployment --all -n location-services
kubectl rollout undo deployment --all -n communication
kubectl rollout undo deployment --all -n infrastructure
```

### **Database Rollback**

```bash
# Rollback database migrations if needed
npx prisma migrate reset --force
npx prisma migrate deploy
```

---

**This deployment guide ensures consistent, scalable, and maintainable deployment of the DDD-aligned Venta backend architecture.**
