# LoggerModule

A unified logging module that provides consistent logging across HTTP and gRPC protocols with Loki integration.

## Features

- **Unified Logger**: Single `Logger` service that works for both HTTP and gRPC
- **Request ID Tracking**: Automatic request ID generation and propagation
- **Loki Integration**: Structured logging to Grafana Loki
- **Development Formatting**: Pretty-printed logs in development
- **Protocol Agnostic**: Automatically detects and handles HTTP/gRPC contexts

## Usage

```typescript
// In your service
import { Logger, LoggerModule } from '@app/nest/modules';

@Module({
	imports: [
		LoggerModule.register({
			appName: 'My Service',
			protocol: 'http', // or 'grpc' or 'auto'
		}),
	],
})
export class AppModule {}

@Injectable()
export class MyService {
	constructor(private readonly logger: Logger) {}

	doSomething() {
		this.logger.log('Operation completed', 'MyService', { userId: '123' });
		this.logger.error('Something went wrong', 'MyService', { error: 'details' });
	}
}
```

## Configuration Options

### LoggerOptions

```typescript
interface LoggerOptions {
	appName: string; // Name of your application
	protocol?: 'http' | 'grpc' | 'auto'; // Protocol type (default: 'auto')
}
```

### Environment Variables

- `LOKI_URL` - Loki server URL
- `LOKI_USERNAME` - Loki authentication username
- `LOKI_PASSWORD` - Loki authentication password
- `NODE_ENV` - Environment (affects log formatting)

## Components

### Logger Service

The main logging service that implements NestJS `LoggerService` interface:

```typescript
class Logger {
	log(message: string, context: string, optionalParams: { [K: string]: any });
	error(message: string, context: string, optionalParams: { [K: string]: any });
	warn(message: string, context: string, optionalParams: { [K: string]: any });
	debug(message: string, context: string, optionalParams: { [K: string]: any });
	verbose(message: string, context: string, optionalParams: { [K: string]: any });
	fatal(message: string, context: string, optionalParams: { [K: string]: any });
}
```

### RequestContextService

Manages request context for gRPC requests:

```typescript
class RequestContextService {
	set(key: string, value: any): void;
	get(key: string): any;
	clear(): void;
}
```

### GrpcRequestIdInterceptor

Automatically generates and propagates request IDs for gRPC calls.

## Log Output

### Development (NODE_ENV !== 'production')

```
[My Service] [MyService]: Operation completed {"userId":"123","requestId":"uuid"}
```

### Production

Structured JSON logs sent to Loki with labels:

- `context`: Service/component name
- `app`: Application name
- `requestId`: Request identifier

## Testing

See the test files for comprehensive coverage:

- `logger.module.test.ts` - Module configuration tests
- `logger.service.test.ts` - Logger service tests
- `grpc-logger.interceptor.test.ts` - gRPC interceptor tests
- `request-context.service.test.ts` - Request context tests
