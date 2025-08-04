# Bootstrap Module

This module provides abstractions to reduce boilerplate code in application initialization and module configuration.

## Features

- **BootstrapModule**: Provides a standardized way to configure common modules across applications
- **BootstrapService**: Provides factory functions for common app initialization patterns

## Usage

### BootstrapModule

Use `BootstrapModule.forRoot()` to configure common modules:

```typescript
@Module({
  imports: [
    BootstrapModule.forRoot({
      appName: 'my-service',
      protocol: 'http', // or 'grpc' or 'websocket'
      additionalModules: [MyCustomModule],
      additionalProviders: [MyCustomProvider],
    }),
    // Your app-specific modules
  ],
})
export class AppModule {}

### BootstrapService

Use `BootstrapService` to simplify main.ts files:

```typescript
// For HTTP apps
async function bootstrap() {
  await BootstrapService.bootstrapHttp({
    module: AppModule,
    port: 'APP_PORT',
    enableCors: true,
  });
}

// For gRPC apps
async function bootstrap() {
  await BootstrapService.bootstrapGrpc({
    module: AppModule,
    package: 'my-package',
    protoPath: '../proto/src/definitions/my.proto',
    urlEnvVar: 'MY_SERVICE_ADDRESS',
    defaultUrl: 'localhost:5000',
  });
}
```

## Benefits

- Reduces code duplication across applications
- Standardizes common configuration patterns
- Makes it easier to maintain consistent setup across services
- Provides type-safe configuration options
- Simplified interface with unified naming conventions
- Supports HTTP, gRPC, and WebSocket protocols 