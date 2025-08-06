# 🚀 Running All NestJS Apps

This guide shows you the **one good way** to run all NestJS applications in the Venta backend monorepo simultaneously.

## 🎯 The One Good Way

### NestJS CLI with Hot Reload ⚡

```bash
# Start infrastructure first
pnpm run docker:up

# Start all NestJS applications with hot reload
pnpm run start:dev
```

**What this starts:**
- ✅ Gateway (port 3000)
- ✅ User service (port 3001)
- ✅ Vendor service (port 3002)
- ✅ Location service (port 3003)
- ✅ WebSocket Gateway (port 3004)
- ✅ Algolia Sync service (background)
- ✅ **Hot reload** - file changes trigger automatic restarts

## 🗺️ Service Ports

| Service           | Port | Description             | Health Check                   |
| ----------------- | ---- | ----------------------- | ------------------------------ |
| Gateway           | 3000 | API Gateway             | `http://localhost:3000/health` |
| User              | 3001 | User Management         | `http://localhost:3001/health` |
| Vendor            | 3002 | Vendor Management       | `http://localhost:3002/health` |
| Location          | 3003 | Location Services       | `http://localhost:3003/health` |
| WebSocket Gateway | 3004 | Real-time Communication | `http://localhost:3004/health` |
| Algolia Sync      | -    | Background Processing   | -                              |

## 🔧 Infrastructure Services

You'll need these services running:

```bash
# Start infrastructure only
pnpm run docker:up

# Or run them individually:
# PostgreSQL: localhost:5432
# Redis: localhost:6379
# NATS: localhost:4222
# Prometheus: localhost:9090
# Grafana: localhost:3005
# Loki: localhost:3100
```

## 🎯 Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env

# 3. Generate Prisma client
pnpm run prisma:generate

# 4. Build protocol buffers
pnpm run build-proto

# 5. Start infrastructure
pnpm run docker:up

# 6. Start all apps with hot reload
pnpm run start:dev
```

## 🔄 Development Workflow

1. **Start infrastructure**: `pnpm run docker:up`
2. **Start all apps**: `pnpm run start:dev`
3. **Make changes** - hot reload will restart affected services
4. **Run tests**: `pnpm run test:run`
5. **Stop services**: `Ctrl+C`

## 🐛 Troubleshooting

### Port Conflicts
```bash
# Check what's using a port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Service Won't Start
```bash
# Check if infrastructure is running
docker ps

# Restart infrastructure
pnpm run docker:down && pnpm run docker:up
```

### Build Errors
```bash
# Clean and rebuild
rm -rf dist/
pnpm install
pnpm run build
```

## 📊 Monitoring

Once all services are running, you can monitor them at:

- **Grafana Dashboards**: http://localhost:3005
- **Prometheus Metrics**: http://localhost:9090
- **NATS Monitoring**: http://localhost:8222

## 🏭 Production Mode

For production testing:

```bash
# Build all services
pnpm run build

# Start all services in production mode
pnpm run start:prod
```

## 🎯 Individual Services

If you need to run just one service for debugging:

```bash
# Start specific service
nest start gateway --watch
nest start user --watch
nest start vendor --watch
nest start location --watch
nest start websocket-gateway --watch
nest start algolia-sync --watch
```

---

**💡 That's it!** One command to run everything: `pnpm run start:dev`
