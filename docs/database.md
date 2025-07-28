# Database Schema Documentation

## Overview

The Venta Backend uses PostgreSQL as the primary database with Prisma as the ORM. The database schema is split into multiple Prisma files for better organization and maintainability.

## Schema Organization

### Split Schema Files

The database schema is organized into multiple schema files for better organization and maintainability:

```
database/
├── schema/
│   ├── main.schema          # Main schema with database connection
│   ├── user.schema          # User-related models
│   ├── vendor.schema        # Vendor-related models
│   └── integration.schema   # Integration and external service models
└── migrations/              # Database migrations
```

### Main Schema (`main.schema`)

```prisma
// Database connection and shared configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Import other schema files
import "schema/user"
import "schema/vendor"
import "schema/integration"
```

## User Models (`user.schema`)

### User

```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  firstName String?
  lastName  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  vendors Vendor[]
  subscriptions Subscription[]

  @@map("users")
}
```

### Subscription

```prisma
model Subscription {
  id          String   @id @default(cuid())
  userId      String
  provider    String   // "revenuecat", "stripe", etc.
  productId   String
  status      String   // "active", "cancelled", "expired"
  startDate   DateTime
  endDate     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("subscriptions")
}
```

## Vendor Models (`vendor.schema`)

### Vendor

```prisma
model Vendor {
  id           String   @id @default(cuid())
  name         String
  description  String?
  phone        String?
  email        String?
  website      String?
  open         Boolean  @default(true)
  primaryImage String?
  lat          Float?
  long         Float?
  userId       String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  locations Location[]

  @@map("vendors")
}
```

### Location

```prisma
model Location {
  id        String   @id @default(cuid())
  vendorId  String
  lat       Float
  long      Float
  timestamp DateTime @default(now())

  // Relations
  vendor Vendor @relation(fields: [vendorId], references: [id], onDelete: Cascade)

  @@map("locations")
}
```

## Integration Models (`integration.schema`)

### External Service Integrations

```prisma
model Integration {
  id          String   @id @default(cuid())
  service     String   // "algolia", "cloudinary", "clerk"
  externalId  String   // ID from external service
  internalId  String   // ID from our system
  metadata    Json?    // Additional data
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([service, externalId])
  @@map("integrations")
}
```

## Database Relationships

### One-to-Many Relationships

- **User → Vendors**: A user can have multiple vendors
- **User → Subscriptions**: A user can have multiple subscriptions
- **Vendor → Locations**: A vendor can have multiple location records

### Cascade Deletes

- When a user is deleted, all their vendors and subscriptions are deleted
- When a vendor is deleted, all their location records are deleted

## Indexes and Performance

### Primary Indexes

```sql
-- Primary keys (automatically created by Prisma)
PRIMARY KEY (id) ON users
PRIMARY KEY (id) ON vendors
PRIMARY KEY (id) ON locations
PRIMARY KEY (id) ON subscriptions
PRIMARY KEY (id) ON integrations
```

### Secondary Indexes

```sql
-- User lookups
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);

-- Vendor queries
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_location ON vendors(lat, long);
CREATE INDEX idx_vendors_created_at ON vendors(created_at);

-- Location queries
CREATE INDEX idx_locations_vendor_id ON locations(vendor_id);
CREATE INDEX idx_locations_timestamp ON locations(timestamp);

-- Subscription queries
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);

-- Integration queries
CREATE INDEX idx_integrations_service ON integrations(service);
CREATE INDEX idx_integrations_external_id ON integrations(external_id);
```

## Migrations

### Creating Migrations

```bash
# Generate migration from schema changes
npx prisma migrate dev --name add_user_subscriptions

# Apply migrations to database
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Migration Best Practices

1. **Always review generated migrations** before applying
2. **Test migrations** on staging before production
3. **Use descriptive migration names**
4. **Include rollback scripts** for critical changes
5. **Backup database** before applying migrations

### Example Migration

```sql
-- Migration: add_user_subscriptions
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

## Seeding

### Development Data

```typescript
// database/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const user = await prisma.user.create({
    data: {
      clerkId: 'clerk_test_user',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    },
  });

  // Create test vendor
  const vendor = await prisma.vendor.create({
    data: {
      name: 'Test Vendor',
      description: 'A test vendor for development',
      userId: user.id,
      lat: 40.7128,
      long: -74.0060,
    },
  });

  console.log('Seeded:', { user, vendor });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Running Seeds

```bash
# Run seed script
npx prisma db seed

# Or run manually
npx ts-node database/seed.ts
```

## Connection Pooling

### Prisma Configuration

```typescript
// shared/framework/modules/database/database.service.ts
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Connection pooling
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### Environment Configuration

```bash
# Database URL with connection pooling
DATABASE_URL="postgresql://user:password@localhost:5432/venta_db?connection_limit=20&pool_timeout=20"
```

## Backup and Recovery

### Automated Backups

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="venta_db"

# Create backup
pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/backup_$DATE.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

### Recovery

```bash
# Restore from backup
gunzip -c backup_20240115_143000.sql.gz | psql $DATABASE_URL
```

## Monitoring and Maintenance

### Database Health Checks

```typescript
@Injectable()
export class DatabaseHealthService {
  constructor(private prisma: PrismaService) {}

  async checkHealth() {
    try {
      // Test connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Check table sizes
      const tableSizes = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats
        WHERE schemaname = 'public'
        ORDER BY tablename, attname;
      `;

      return {
        status: 'healthy',
        tables: tableSizes,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
```

### Performance Monitoring

```sql
-- Check slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Best Practices

### Query Optimization

1. **Use Prisma's select** to limit returned fields
2. **Implement pagination** for large result sets
3. **Use database indexes** for frequently queried fields
4. **Avoid N+1 queries** with proper includes
5. **Use transactions** for related operations

### Data Integrity

1. **Use foreign key constraints** for referential integrity
2. **Implement soft deletes** for important data
3. **Validate data** at the application level
4. **Use database constraints** for business rules
5. **Regular backups** and recovery testing

### Security

1. **Use parameterized queries** (Prisma handles this)
2. **Limit database user permissions**
3. **Encrypt sensitive data** at rest
4. **Audit database access** and changes
5. **Regular security updates** for PostgreSQL 