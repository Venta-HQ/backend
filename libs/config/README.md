# Config Library

This library provides centralized configuration management for the Venta backend services.

## Overview

The config library handles environment-based configuration, validation, and type-safe access to application settings. It provides a unified way to manage configuration across all services with built-in validation and type safety.

## Features

- **Environment Configuration**: Load and validate configuration from environment variables
- **Type Safety**: Strongly typed configuration objects
- **Validation**: Schema-based configuration validation
- **Centralized Management**: Single source of truth for all application settings
- **Development/Production Support**: Different configuration for different environments

## Usage

### Basic Configuration

Import the config module to access validated configuration values throughout your application.

```typescript
import { ConfigService } from '@app/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseService {
	constructor(private readonly configService: ConfigService) {}

	getDatabaseUrl(): string {
		return this.configService.get<string>('DATABASE_URL');
	}

	getPort(): number {
		return this.configService.get<number>('PORT', 3000);
	}
}
```

### Environment Variables

Set environment variables to configure the application behavior. The library validates these values and provides type-safe access.

```bash
# .env file
DATABASE_URL=postgresql://user:pass@localhost:5432/db
PORT=3000
NODE_ENV=production
```

### Configuration Schema

Define configuration schemas to ensure all required values are present and properly typed.

```typescript
import { ConfigModule } from '@app/config';

@Module({
	imports: [
		ConfigModule.forRoot({
			validationSchema: Joi.object({
				DATABASE_URL: Joi.string().required(),
				PORT: Joi.number().default(3000),
				NODE_ENV: Joi.string().valid('development', 'production').default('development'),
			}),
		}),
	],
})
export class AppModule {}
```

## Dependencies

- Joi for configuration validation
- NestJS for framework integration
