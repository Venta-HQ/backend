# Prisma Module

## Purpose

The Prisma Module provides standardized database access and management for all services in the Venta backend system. It encapsulates Prisma ORM configuration, database connection management, and provides a consistent interface for database operations across all microservices. This module ensures reliable database connectivity, proper connection lifecycle management, and integration with the Prisma Pulse extension for real-time database changes.

## Overview

This module provides:
- Standardized Prisma client configuration and initialization
- Database connection management with automatic lifecycle handling
- Integration with Prisma Pulse for real-time database change events
- Database query logging and performance monitoring
- Connection pooling and optimization for high-performance applications
- Health checks and database connectivity validation
- Error handling and connection recovery mechanisms

## Usage

### Module Registration

The module is automatically included via BootstrapModule in all services:

```typescript
// Automatically included in BootstrapModule.forRoot()
BootstrapModule.forRoot({
  appName: 'Your Service',
  protocol: 'grpc',
  // PrismaModule is automatically registered
})
```

### Service Injection

Inject PrismaService into your services to access database operations:

```typescript
@Injectable()
export class YourService {
  constructor(private prisma: PrismaService) {}

  async getData() {
    // Access database via prisma.db
    return await this.prisma.db.yourModel.findMany();
  }

  async getPulseData() {
    // Access Pulse client for real-time changes
    return await this.prisma.pulse.yourModel.findMany();
  }
}
```

### Database Operations

Use the standard Prisma client interface for all database operations:

```typescript
// CRUD operations
const users = await this.prisma.db.user.findMany();
const user = await this.prisma.db.user.create({ data: userData });
const updated = await this.prisma.db.user.update({ where: { id }, data: updates });
const deleted = await this.prisma.db.user.delete({ where: { id } });

// Transactions
const result = await this.prisma.db.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  const profile = await tx.profile.create({ data: { userId: user.id } });
  return { user, profile };
});
```

### Health Checks

The module provides automatic health checks for database connectivity:

```typescript
// Health check is automatically included in service health endpoints
// Returns database connection status and Pulse connectivity
```

### Environment Configuration

Configure database connection and Pulse integration:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/venta

# Prisma Pulse (optional)
PULSE_API_KEY=your-pulse-api-key
```

## Key Benefits

- **Standardized Access**: Consistent database interface across all services
- **Automatic Management**: Handles connection lifecycle automatically
- **Real-time Capabilities**: Integrates with Prisma Pulse for live data
- **Performance Optimized**: Includes query logging and connection pooling
- **Health Monitoring**: Built-in health checks and connectivity validation
- **Error Recovery**: Automatic connection recovery and error handling

## Dependencies

- **Prisma Client** for database ORM functionality
- **Prisma Pulse Extension** for real-time database changes
- **NestJS Config** for environment variable management 