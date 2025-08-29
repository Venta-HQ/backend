import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ErrorHandlingModule } from '@venta/nest/errors';
import { GrpcAuthGuard } from '@venta/nest/guards';
import {
	ClerkModule,
	ConfigModule,
	HealthCheckModule,
	HealthModule,
	LoggerModule,
	NatsQueueModule,
	PrismaModule,
	PrometheusModule,
	RedisModule,
	RequestTracingModule,
	TracingModule,
} from '@venta/nest/modules';

export interface BootstrapOptions {
	additionalModules?: any[];
	additionalProviders?: any[];
	appName: string;
	domain?: string; // Explicit DDD domain (e.g., 'user', 'vendor', 'location', 'marketplace')
	healthChecks?: () => Promise<Record<string, any>>;
	protocol?: 'http' | 'grpc' | 'websocket' | 'nats';
}

@Global()
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

		// Only export injectable classes that sub-modules may reference
		const exportedProviders = this.getExportedProviders(options);

		return {
			exports: [PrometheusModule, ...exportedProviders],
			imports: [...baseModules, ...protocolModules, ...tracingModules, ...(options.additionalModules || [])],
			module: BootstrapModule,
			providers: [...protocolProviders, ...(options.additionalProviders || [])],
		};
	}

	private static getExportedProviders(options: BootstrapOptions): Provider[] {
		switch (options.protocol) {
			case 'grpc':
				return [GrpcAuthGuard];
			case 'websocket':
				return [];
			default:
				return [];
		}
	}

	private static getBaseModules(options: BootstrapOptions): any[] {
		return [
			ConfigModule,
			ErrorHandlingModule.forProtocol(options.protocol),
			HealthModule.forRoot({
				additionalChecks: options.healthChecks,
			}),
			LoggerModule.register(),
			TracingModule.register(),
			PrometheusModule.register(),
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
			PrismaModule.register(),
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
			{
				provide: APP_GUARD,
				useClass: ThrottlerGuard,
			},
		];
	}

	private static getGrpcModules(): any[] {
		// gRPC services have minimal dependencies by default
		// Individual services can import what they need (Prisma, Clerk, etc.)
		return [];
	}

	private static getGrpcProviders(): Provider[] {
		// gRPC services have minimal global providers by default
		// Exception handling is now provided by ErrorHandlingModule.forProtocol('grpc')
		return [GrpcAuthGuard];
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
		return [PrismaModule.register(), ClerkModule.register(), RedisModule];
	}

	private static getWebSocketProviders(): Provider[] {
		// Feature modules should provide WsAuthGuard via AuthModule
		return [];
	}
}
