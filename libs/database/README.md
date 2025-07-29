# Database Library

This library provides database connectivity and ORM utilities for the Venta backend services.

## Overview

The database library manages database connections, provides Prisma ORM integration, and offers database utilities for data persistence and querying. It handles connection lifecycle, migrations, and provides a clean interface for database operations.

## Features

- **Database Connection Management**: Handle database connections and lifecycle
- **Prisma ORM Integration**: Type-safe database queries and operations
- **Connection Pooling**: Efficient database connection management
- **Migration Support**: Database schema migration utilities
- **Transaction Management**: Database transaction handling

## Usage

### Database Service

Inject the database service to perform database operations with full type safety.

```typescript
import { PrismaService } from '@app/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
	constructor(private readonly prisma: PrismaService) {}

	async findUser(id: string) {
		return await this.prisma.user.findUnique({
			where: { id },
			include: { profile: true },
		});
	}

	async createUser(data: CreateUserInput) {
		return await this.prisma.user.create({
			data,
			include: { profile: true },
		});
	}
}
```

### Prisma Client

Access the Prisma client for direct database queries and operations.

```typescript
import { PrismaService } from '@app/database';

@Injectable()
export class TransactionService {
	constructor(private readonly prisma: PrismaService) {}

	async transferMoney(fromId: string, toId: string, amount: number) {
		return await this.prisma.$transaction(async (tx) => {
			const fromAccount = await tx.account.update({
				where: { id: fromId },
				data: { balance: { decrement: amount } },
			});

			const toAccount = await tx.account.update({
				where: { id: toId },
				data: { balance: { increment: amount } },
			});

			return { fromAccount, toAccount };
		});
	}
}
```

### Connection Management

The library automatically manages database connections, including connection pooling and lifecycle events.

```typescript
import { PrismaModule } from '@app/database';

@Module({
	imports: [PrismaModule],
	providers: [UserService],
})
export class UserModule {}
```

## Dependencies

- Prisma ORM for database operations
- NestJS for framework integration
