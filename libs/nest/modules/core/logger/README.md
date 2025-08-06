# Logger Module

## Purpose

The Logger Module provides structured logging capabilities across all services in the Venta backend system. It integrates with Loki for centralized log aggregation and provides consistent logging patterns with automatic request correlation and service identification.

## Overview

This module provides:
- Structured logging with automatic service name identification
- Loki integration for centralized log aggregation
- Request correlation and tracing
- Automatic log formatting and metadata injection
- Error handling and log level management
- Performance monitoring and metrics collection

## Usage

### Module Registration

Register the LoggerModule in your service:

```typescript
@Module({
  imports: [
    BootstrapModule.forRoot({
      appName: APP_NAMES.USER,
      protocol: 'grpc',
    }),
  ],
})
export class UserModule {}
```

The LoggerModule is automatically included by BootstrapModule and will use the app name from ConfigService.

### Service Injection

Inject Logger into your services:

```typescript
import { Logger } from '@app/nest/modules';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  async createUser(userData: CreateUserData) {
    this.logger.log('Creating new user', { email: userData.email });
    
    try {
      const user = await this.userRepository.create(userData);
      this.logger.log('User created successfully', { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', error);
      throw error;
    }
  }
}
```

### Logging Levels

Use different logging levels as appropriate:

```typescript
this.logger.log('Info message');
this.logger.warn('Warning message');
this.logger.error('Error message', error);
this.logger.debug('Debug message');
this.logger.verbose('Verbose message');
```

### Structured Logging

Include structured data with your log messages:

```typescript
this.logger.log('User action completed', {
  userId: user.id,
  action: 'profile_update',
  duration: 150,
  success: true,
});
```

## Configuration

The LoggerModule automatically configures itself using:
- **Service Name**: Retrieved from ConfigService (APP_NAME environment variable)
- **Loki Integration**: Configured via environment variables
- **Request Correlation**: Automatic request ID injection

### Environment Variables

```bash
# Required
LOKI_URL=http://localhost:3100
APP_NAME=User Service

# Optional
LOKI_USERNAME=loki
LOKI_PASSWORD=password
```

## Key Benefits

- **Centralized Logging**: All logs aggregated in Loki
- **Request Correlation**: Automatic request ID tracking
- **Service Identification**: Automatic service name injection
- **Structured Data**: JSON-formatted logs with metadata
- **Performance**: Efficient logging with minimal overhead
- **Consistency**: Standardized logging patterns across services

## Dependencies

- **NestJS Core** for dependency injection and module system
- **ConfigModule** for service name and configuration
- **RequestContextModule** for request correlation
- **Loki** for log aggregation and storage
