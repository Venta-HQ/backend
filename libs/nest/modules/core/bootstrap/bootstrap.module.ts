import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ErrorHandlingModule } from '@venta/nest/errors';
import { AuthGuard, AuthService, WsAuthGuard } from '@venta/nest/guards';
import { GrpcAuthInterceptor } from '@venta/nest/interceptors';
import {
	ClerkModule,
	HealthCheckModule,
	HealthModule,
	LoggerModule,
	NatsQueueModule,
	PrismaModule,
	PrometheusModule,
	RedisModule,
	RequestTracingModule,
} from '@venta/nest/modules';

export interface BootstrapOptions {
	additionalModules?: any[];
	additionalProviders?: any[];
	appName: string;
	domain?: string; // Explicit DDD domain (e.g., 'user', 'vendor', 'location', 'marketplace')
	healthChecks?: () => Promise<Record<string, any>>;
	protocol?: 'http' | 'grpc' | 'websocket' | 'nats';
}

@Module({})
export class BootstrapModule {
	static forRoot(options: BootstrapOptions): DynamicModule {
		// Set environment variables for the ConfigService
		process.env.APP_NAME = options.appName;
		if (options.domain) {
			process.env.DOMAIN = options.domain;
		}

		const baseModules = this.getBaseModules(options);
		const protocolModules = this.getProtocolModules(options);
		const tracingModules = this.getTracingModules(options);
		const protocolProviders = this.getProtocolProviders(options);

		return {
			exports: baseModules,
			imports: [...baseModules, ...protocolModules, ...tracingModules, ...(options.additionalModules || [])],
			module: BootstrapModule,
			providers: [...protocolProviders, ...(options.additionalProviders || [])],
		};
	}

	private static getBaseModules(options: BootstrapOptions): any[] {
		return [
			ConfigModule,
			ErrorHandlingModule,
			HealthModule.forRoot({
				additionalChecks: options.healthChecks,
			}),
			LoggerModule.register(),
			PrometheusModule.register(),
			PrismaModule.register(),
		];
	}

	private static getProtocolModules(options: BootstrapOptions): any[] {
		switch (options.protocol) {
			case 'http':
				return this.getHttpModules();
			case 'grpc':
				return this.getGrpcModules();
			case 'nats':
				return this.getNatsModules();
			case 'websocket':
				return this.getWebSocketModules();
			default:
				return [];
		}
	}

	private static getProtocolProviders(options: BootstrapOptions): any[] {
		switch (options.protocol) {
			case 'http':
				return this.getHttpProviders();
			case 'grpc':
				return this.getGrpcProviders();
			case 'nats':
				return this.getNatsProviders();
			case 'websocket':
				return this.getWebSocketProviders();
			default:
				return [];
		}
	}

	private static getTracingModules(options: BootstrapOptions): any[] {
		return [RequestTracingModule.register({ protocol: options.protocol })];
	}

	private static getHttpModules(): any[] {
		return [
			HealthCheckModule,
			ClerkModule.register(),
			RedisModule,
			ThrottlerModule.forRoot([
				{
					limit: 100,
					ttl: 60000,
				},
			]),
		];
	}

	private static getHttpProviders(): Provider[] {
		return [
			AuthService,
			AuthGuard,
			{
				provide: APP_GUARD,
				useClass: ThrottlerGuard,
			},
		];
	}

	private static getGrpcModules(): any[] {
		// gRPC services typically need Clerk for auth and Redis for caching
		// but don't need HTTP-specific modules like ThrottlerModule
		return [ClerkModule.register(), RedisModule];
	}

	private static getGrpcProviders(): Provider[] {
		// gRPC services need AuthService for token validation
		// Note: GrpcAuthGuard no longer exists - services handle auth manually or via interceptors
		return [
			AuthService,
			{
				provide: APP_INTERCEPTOR,
				useClass: GrpcAuthInterceptor,
			},
		];
	}

	private static getNatsModules(): any[] {
		// NATS services need the queue module for messaging
		return [NatsQueueModule];
	}

	private static getNatsProviders(): Provider[] {
		// NATS services typically don't need auth guards since they're internal
		return [];
	}

	private static getWebSocketModules(): any[] {
		// WebSocket services need Redis and Clerk for auth, but not HTTP throttling
		return [ClerkModule.register(), RedisModule];
	}

	private static getWebSocketProviders(): Provider[] {
		// WebSocket services need AuthService for token validation and WsAuthGuard for connections
		return [AuthService, WsAuthGuard];
	}
}
