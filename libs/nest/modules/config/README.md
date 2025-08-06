# Config Module

## Purpose

The Config Module provides centralized configuration management for all services in the Venta backend system. It handles environment variable loading, validation, and provides type-safe configuration access throughout the application. This module ensures consistent configuration patterns, proper validation, and secure handling of sensitive configuration data.

## Overview

This module provides:

- Environment variable loading and validation with Zod schemas
- Type-safe configuration access with TypeScript interfaces
- Configuration validation and error handling
- Default value management and fallback strategies
- Environment-specific configuration support
- Secure handling of sensitive configuration data
- Configuration documentation and schema validation

## Usage

### Module Registration

The module is automatically included via BootstrapModule in all services:

```typescript
// Automatically included in BootstrapModule.forRoot()
BootstrapModule.forRoot({
	appName: 'Your Service',
	protocol: 'grpc',
	// ConfigModule is automatically registered
});
```

### Service Injection

Inject ConfigService into your services to access configuration:

```typescript
@Injectable()
export class YourService {
	constructor(private configService: ConfigService) {}

	async connectToDatabase() {
		const dbUrl = this.configService.get<string>('DATABASE_URL');
		const dbPort = this.configService.get<number>('DATABASE_PORT', 5432);

		// Use configuration values
		return await this.connect(dbUrl, dbPort);
	}

	async setupExternalService() {
		const apiKey = this.configService.get<string>('EXTERNAL_API_KEY');
		const baseUrl = this.configService.get<string>('EXTERNAL_BASE_URL');

		if (!apiKey) {
			throw new Error('External API key is required');
		}

		return await this.initializeService(baseUrl, apiKey);
	}
}
```

### Configuration Access

Access configuration values with type safety and defaults:

```typescript
// Required configuration (will throw if missing)
const requiredValue = this.configService.get<string>('REQUIRED_CONFIG');

// Optional configuration with default value
const optionalValue = this.configService.get<number>('OPTIONAL_CONFIG', 100);

// Boolean configuration
const isEnabled = this.configService.get<boolean>('FEATURE_ENABLED', false);

// Nested configuration
const dbConfig = {
	host: this.configService.get<string>('DB_HOST'),
	port: this.configService.get<number>('DB_PORT', 5432),
	name: this.configService.get<string>('DB_NAME'),
};
```

### Environment Configuration

Configure your service with environment variables:

```env
# Service Configuration
SERVICE_NAME=user-service
SERVICE_PORT=5000
SERVICE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/venta
DATABASE_PORT=5432

# External Services
EXTERNAL_API_KEY=your-api-key
EXTERNAL_BASE_URL=https://api.example.com

# Feature Flags
FEATURE_ENABLED=true
DEBUG_MODE=false
```

### Configuration Validation

The module validates configuration on startup:

```typescript
// Configuration validation happens automatically
// Invalid or missing required configuration will cause startup failure
// with clear error messages indicating what's missing or invalid
```

## Key Benefits

- **Type Safety**: TypeScript interfaces for all configuration values
- **Validation**: Automatic validation of configuration on startup
- **Centralized Management**: Single source of truth for all configuration
- **Environment Support**: Easy configuration for different environments
- **Error Handling**: Clear error messages for missing or invalid configuration
- **Security**: Secure handling of sensitive configuration data

## Dependencies

- **NestJS Config** for configuration management
- **Zod** for configuration validation and schema definition
