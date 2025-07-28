# Troubleshooting Guide

## Common Issues and Solutions

This guide covers common problems you might encounter when working with the Venta Backend and how to resolve them.

## Service Startup Issues

### Services Won't Start

#### Problem

Services fail to start with connection errors or missing dependencies.

#### Symptoms

```bash
# Error messages like:
Error: connect ECONNREFUSED 127.0.0.1:5432
Error: connect ECONNREFUSED 127.0.0.1:4222
Error: connect ECONNREFUSED 127.0.0.1:6379
```

#### Solutions

1. **Check Infrastructure Services**

   ```bash
   # Verify Docker containers are running
   docker-compose ps

   # Start infrastructure if needed
   docker-compose up -d cache nats

   # Check service logs
   docker-compose logs nats
   docker-compose logs cache
   ```

2. **Verify Environment Variables**

   ```bash
   # Check if .env file exists
   ls -la .env

   # Verify required variables are set
   grep -E "DATABASE_URL|NATS_URL|REDIS_URL" .env
   ```

3. **Check Port Availability**
   ```bash
   # Check if ports are in use
   netstat -tulpn | grep :500
   lsof -i :5000
   lsof -i :5001
   lsof -i :5002
   ```

### Database Connection Issues

#### Problem

Cannot connect to PostgreSQL database.

#### Solutions

1. **Check Database Status**

   ```bash
   # Test database connection
   psql $DATABASE_URL -c "SELECT 1;"

   # Check if database exists
   psql $DATABASE_URL -c "\l"
   ```

2. **Run Migrations**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations
   npx prisma migrate deploy

   # Reset database (development only)
   npx prisma migrate reset
   ```

3. **Check Database Logs**

   ```bash
   # View PostgreSQL logs
   docker-compose logs postgres

   # Check connection limits
   psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
   ```

## Event System Issues

### Events Not Processing

#### Problem

Events are published but not consumed by services.

#### Symptoms

- Algolia search index not updating
- No event processing logs
- High failed event count

#### Solutions

1. **Check NATS Connection**

   ```bash
   # Test NATS connection
   curl http://localhost:8222/healthz

   # Check NATS server info
   curl http://localhost:8222/varz

   # Monitor NATS traffic
   nats sub "events.*"
   ```

2. **Verify Event Consumers**

   ```bash
   # Check algolia-sync service
   curl http://localhost:5006/health
   curl http://localhost:5006/health/events

   # Check service logs
   pnpm run start:algolia-sync 2>&1 | tee logs/algolia-sync.log
   ```

3. **Test Event Publishing**

   ```bash
   # Publish test event
   nats pub "events.test" '{"message": "test"}'

   # Check if event was received
   nats sub "events.test"
   ```

### High Failed Event Count

#### Problem

Many events are failing to process.

#### Solutions

1. **Check External Service Health**

   ```bash
   # Test Algolia connection
   curl -H "X-Algolia-API-Key: $ALGOLIA_API_KEY" \
        -H "X-Algolia-Application-Id: $ALGOLIA_APPLICATION_ID" \
        "https://$ALGOLIA_APPLICATION_ID.algolia.net/1/indexes"
   ```

2. **Review Error Logs**

   ```bash
   # Check service logs for errors
   tail -f logs/algolia-sync.log | grep ERROR

   # Check failed events storage
   nats kv get failed_events
   ```

3. **Retry Failed Events**
   ```bash
   # Restart algolia-sync service to retry failed events
   pkill -f "algolia-sync"
   pnpm run start:algolia-sync
   ```

## Authentication Issues

### JWT Token Problems

#### Problem

Authentication failing with invalid token errors.

#### Solutions

1. **Verify Clerk Configuration**

   ```bash
   # Check Clerk environment variables
   echo $CLERK_SECRET_KEY
   echo $CLERK_PUBLISHABLE_KEY

   # Test Clerk API
   curl -H "Authorization: Bearer $CLERK_SECRET_KEY" \
        "https://api.clerk.dev/v1/users"
   ```

2. **Check Token Format**

   ```bash
   # Decode JWT token (without verification)
   echo "your.jwt.token" | cut -d. -f2 | base64 -d | jq .
   ```

3. **Verify AuthGuard Configuration**
   ```typescript
   // Check if AuthGuard is properly configured
   @UseGuards(AuthGuard)
   @Get('protected')
   async protectedEndpoint() {
     // ...
   }
   ```

### Webhook Signature Verification

#### Problem

Clerk webhooks failing signature verification.

#### Solutions

1. **Check Webhook Secret**

   ```bash
   # Verify webhook secret is set
   echo $CLERK_WEBHOOK_SECRET
   ```

2. **Test Webhook Endpoint**

   ```bash
   # Test webhook with ngrok
   ngrok http 5002

   # Update Clerk webhook URL
   # https://your-ngrok-url.ngrok.io/webhook/clerk/user-created
   ```

3. **Verify Svix Integration**
   ```typescript
   // Check SignedWebhookGuard configuration
   @UseGuards(SignedWebhookGuard(process.env.CLERK_WEBHOOK_SECRET || ''))
   @Post('webhook/clerk/user-created')
   async handleUserCreated(@Body() data: any) {
     // ...
   }
   ```

## Performance Issues

### Slow Response Times

#### Problem

API endpoints responding slowly.

#### Solutions

1. **Check Database Performance**

   ```sql
   -- Check slow queries
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;

   -- Check table sizes
   SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename))
   FROM pg_tables
   WHERE schemaname = 'public';
   ```

2. **Monitor Resource Usage**

   ```bash
   # Check CPU and memory usage
   top
   htop

   # Check Node.js process
   ps aux | grep node

   # Monitor Docker resources
   docker stats
   ```

3. **Check Network Latency**

   ```bash
   # Test service-to-service communication
   curl -w "@curl-format.txt" http://localhost:5002/health

   # Check gRPC connections
   netstat -an | grep :500
   ```

### Memory Leaks

#### Problem

Services consuming increasing amounts of memory.

#### Solutions

1. **Check for Memory Leaks**

   ```bash
   # Monitor memory usage over time
   watch -n 1 'ps aux | grep node | grep -v grep'

   # Check for memory leaks in Node.js
   node --inspect services/gateway/src/main.ts
   ```

2. **Review Connection Pooling**

   ```typescript
   // Check Prisma connection pooling
   const prisma = new PrismaClient({
   	datasources: {
   		db: {
   			url: process.env.DATABASE_URL + '?connection_limit=20&pool_timeout=20',
   		},
   	},
   });
   ```

3. **Monitor Event Processing**

   ```bash
   # Check for event processing bottlenecks
   curl http://localhost:5006/health/events

   # Monitor NATS memory usage
   curl http://localhost:8222/varz | jq '.mem'
   ```

## Build and Deployment Issues

### TypeScript Compilation Errors

#### Problem

TypeScript compilation failing during build.

#### Solutions

1. **Check Type Definitions**

   ```bash
   # Regenerate Prisma client
   npx prisma generate

   # Check for missing types
   npx tsc --noEmit
   ```

2. **Update Dependencies**

   ```bash
   # Update packages
   pnpm update

   # Clear node_modules and reinstall
   rm -rf node_modules
   pnpm install
   ```

3. **Check Import Paths**
   ```typescript
   // Verify import paths are correct
   import { VendorService } from '@services/vendor/vendor.service';
   import { AppError } from '@shared/errors';
   ```

### Docker Build Failures

#### Problem

Docker images failing to build.

#### Solutions

1. **Check Dockerfile Syntax**
   ```bash
   # Validate Dockerfile
   docker build --no-cache -f services/gateway/Dockerfile .
   ```

# Check for syntax errors

docker build --target development -f services/gateway/Dockerfile .

````

2. **Verify Build Context**
```bash
# Check if all required files exist
ls -la services/gateway/
ls -la shared/

# Ensure .dockerignore is not excluding needed files
cat .dockerignore
````

3. **Check Base Image**

   ```bash
   # Build base image first
   docker build -f Dockerfile.base -t base-image .

   # Verify base image exists
   docker images | grep base-image
   ```

## Monitoring and Debugging

### Health Check Failures

#### Problem

Health check endpoints returning unhealthy status.

#### Solutions

1. **Check Individual Services**

   ```bash
   # Test each service health endpoint
   for port in 5000 5001 5002 5004 5005 5006; do
     echo "Service on port $port:"
     curl -s http://localhost:$port/health || echo "Service not responding"
   done
   ```

2. **Check Dependencies**

   ```bash
   # Test database connection
   curl http://localhost:5002/health/detailed

   # Test NATS connection
   curl http://localhost:5006/health/events
   ```

3. **Review Service Logs**

   ```bash
   # Check service logs for errors
   tail -f logs/*.log | grep -i error

   # Check Docker logs
   docker-compose logs -f
   ```

### Log Analysis

#### Problem

Need to analyze logs for debugging.

#### Solutions

1. **Structured Log Search**

   ```bash
   # Search for specific error types
   grep -r "AppError" logs/

   # Search for specific user actions
   grep -r "userId.*123" logs/

   # Search for performance issues
   grep -r "duration.*[0-9]{4,}" logs/
   ```

2. **Real-time Log Monitoring**

   ```bash
   # Monitor all service logs
   tail -f logs/*.log

   # Monitor specific service
   tail -f logs/gateway.log | grep -E "(ERROR|WARN)"
   ```

3. **Log Aggregation**

   ```bash
   # Use Loki for log aggregation
   curl -G -s "http://localhost:3100/loki/api/v1/label/__filename__/values"

   # Query logs with LogQL
   curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
        --data-urlencode 'query={service="gateway"}' \
        --data-urlencode 'start=1642234567' \
        --data-urlencode 'end=1642238167'
   ```

## Environment-Specific Issues

### Development Environment

#### Common Development Issues

1. **Hot Reload Not Working**

   ```bash
   # Check if file watching is working
   pnpm run start:gateway:dev

   # Verify file permissions
   ls -la services/gateway/src/
   ```

2. **Port Conflicts**

   ```bash
   # Find processes using ports
   lsof -i :5002

   # Kill conflicting processes
   pkill -f "node.*gateway"
   ```

3. **Environment Variable Issues**

   ```bash
   # Check environment variables
   env | grep -E "(DATABASE|NATS|REDIS|CLERK)"

   # Verify .env file loading
   node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
   ```

### Production Environment

#### Common Production Issues

1. **SSL Certificate Problems**

   ```bash
   # Check SSL certificate validity
   openssl s_client -connect your-domain.com:443 -servername your-domain.com

   # Verify certificate chain
   openssl x509 -in certificate.crt -text -noout
   ```

2. **Load Balancer Issues**

   ```bash
   # Check load balancer health
   curl -H "Host: your-domain.com" http://localhost/health

   # Test sticky sessions
   curl -H "Host: your-domain.com" -c cookies.txt http://localhost/
   ```

3. **Database Performance**

   ```sql
   -- Check database performance
   SELECT * FROM pg_stat_activity WHERE state = 'active';

   -- Check for long-running queries
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query
   FROM pg_stat_activity
   WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
   ```

## Getting Help

### Debugging Checklist

Before asking for help, ensure you've checked:

- [ ] Environment variables are properly set
- [ ] All required services are running
- [ ] Database migrations are applied
- [ ] NATS server is healthy
- [ ] Service logs don't show obvious errors
- [ ] Network connectivity is working
- [ ] Ports are not conflicting

### Useful Commands

```bash
# Quick health check
curl http://localhost:5002/health && \
curl http://localhost:5006/health && \
curl http://localhost:8222/healthz

# Check all services
docker-compose ps

# View all logs
docker-compose logs -f

# Restart all services
docker-compose restart

# Clean restart
docker-compose down && docker-compose up -d
```

### Log Locations

- **Service Logs**: `logs/*.log`
- **Docker Logs**: `docker-compose logs <service>`
- **Database Logs**: `docker-compose logs postgres`
- **NATS Logs**: `docker-compose logs nats`
- **Redis Logs**: `docker-compose logs cache`
