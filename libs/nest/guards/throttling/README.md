# WebSocket Throttling

## Overview

`WsThrottlerGuard` applies rate limits to WebSocket gateway handlers. It is configured via Nest's `ThrottlerModule` and intended to be used at the gateway level with `@UseGuards(WsThrottlerGuard)`.

- Guards run before interceptors. Because of that, the guard emits a `ws_error` event directly when a client exceeds the limit and also throws a `WsException` to stop the handler.
- HTTP throttling remains separate and continues to use Nest's built-in `ThrottlerGuard` and HTTP headers.

## Global default configuration

Define the default throttler(s) in your module with `ThrottlerModule.forRoot(...)` or `forRootAsync(...)`. For WebSocket services, a single `default` throttler is typically sufficient.

```ts
import Redis from 'ioredis';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
	imports: [
		ConfigModule,
		ThrottlerModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => {
				const redis = new Redis(config.get('REDIS_URL') ?? 'redis://localhost:6379');
				return {
					throttlers: [{ name: 'default', ttl: 60_000, limit: 2 }],
					storage: new ThrottlerStorageRedisService(redis),
				};
			},
		}),
	],
})
export class WebsocketModule {}
```

With the `default` throttler defined, any gateway using `WsThrottlerGuard` will be limited to 2 events per 60 seconds unless overridden.

## Applying to a gateway

Apply the guard at the gateway class level so all handlers are protected:

```ts
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';
import { WsThrottlerGuard } from '@venta/nest/guards';
import { WsErrorInterceptor } from '@venta/nest/interceptors';

@WebSocketGateway({ namespace: 'user' })
@UseInterceptors(WsErrorInterceptor)
@UseGuards(WsThrottlerGuard)
export class UserGateway {}
```

## Per-handler overrides

When a handler needs different limits than the global default, use the `@Throttle` decorator to override:

```ts
import { Throttle } from '@nestjs/throttler';

@Throttle({ default: { ttl: 10_000, limit: 1 } })
@SubscribeMessage('update_location')
async handleUpdate() { /* ... */ }
```

You can also define multiple named throttlers in the module and target them by name in the decorator:

```ts
// Module config
ThrottlerModule.forRoot({
  throttlers: [
    { name: 'default', ttl: 60_000, limit: 2 },
    { name: 'burst', ttl: 10_000, limit: 5 },
  ],
});

// Handler override
@Throttle({ burst: { ttl: 10_000, limit: 5 } })
```

If no decorator is present, the `default` throttler applies.

## Error behavior

- On exceed, the guard emits `ws_error` with a payload including `code: 'ERR_RATE_LIMIT_EXCEEDED'` and `retryAfterSeconds`.
- The guard then throws a `WsException` to stop the handler; interceptors do not catch this (guards run first).

## HTTP vs WebSocket throttling

- HTTP services should keep using `ThrottlerGuard` globally via `APP_GUARD`, which sets standard rate-limit headers.
- WebSocket services should prefer gateway-level `WsThrottlerGuard`, which is WS-aware and avoids HTTP header writes.
