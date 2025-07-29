# PrismaModule

A NestJS module that provides Prisma database client with Prisma Pulse integration for real-time database change notifications.

## Features

- **Prisma Client**: Full Prisma ORM integration with query logging
- **Prisma Pulse**: Real-time database change notifications
- **Automatic Connection Management**: Handles connection lifecycle
- **Query Logging**: Automatic logging of database queries and errors
- **Global Module**: Available throughout the application

## Usage

```typescript
// In your service
import { PrismaModule, PrismaService } from '@app/nest/modules';

@Module({
	imports: [PrismaModule.register()],
})
export class AppModule {}

@Injectable()
export class UserService {
	constructor(private readonly prisma: PrismaService) {}

	async findUser(id: string) {
		return this.prisma.db.user.findUnique({
			where: { id },
		});
	}

	async subscribeToUserChanges(userId: string) {
		return this.prisma.pulse.user.subscribe({
			where: { id: userId },
		});
	}
}
```

## Configuration

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `PULSE_API_KEY` - Prisma Pulse API key (required)

### Example Environment Setup

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
PULSE_API_KEY="your-pulse-api-key"
```

## API

### PrismaService

The main service that provides access to both the database client and Pulse client:

```typescript
class PrismaService {
	// Standard Prisma client for database operations
	get db(): PrismaClient;

	// Prisma Pulse client for real-time subscriptions
	get pulse(): ExtendedPrismaClient;

	// Lifecycle methods (automatically handled)
	onModuleInit(): Promise<void>;
	onModuleDestroy(): Promise<void>;
}
```

### Database Operations

```typescript
// Standard Prisma operations
const users = await this.prisma.db.user.findMany();
const user = await this.prisma.db.user.create({
	data: { name: 'John', email: 'john@example.com' },
});
```

### Pulse Subscriptions

```typescript
// Real-time subscriptions
const subscription = await this.prisma.pulse.user.subscribe({
	where: { id: 'user-id' },
});

for await (const event of subscription) {
	console.log('User changed:', event);
}
```

## Query Logging

The service automatically logs:

- **Queries**: SQL queries with parameters and duration
- **Errors**: Database errors with full details

Log format:

```json
{
	"duration": 15,
	"params": ["user-id"],
	"query": "SELECT * FROM \"User\" WHERE \"id\" = $1"
}
```

## Error Handling

The module will throw errors if required environment variables are missing:

- `DATABASE_URL` not provided
- `PULSE_API_KEY` not provided

## Testing

See the test files for comprehensive coverage:

- `prisma.module.test.ts` - Module configuration and factory tests
- `prisma.service.test.ts` - Service lifecycle and client tests

## Dependencies

- `@prisma/client` - Prisma ORM
- `@prisma/extension-pulse` - Prisma Pulse extension
- `@nestjs/config` - Configuration management
