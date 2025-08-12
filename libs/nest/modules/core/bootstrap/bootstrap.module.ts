import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ErrorHandlingModule } from '@venta/nest/errors';
import { AuthGuard, AuthService } from '@venta/nest/guards';
import {
	ClerkModule,
	HealthCheckModule,
	HealthModule,
	LoggerModule,
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

		const baseModules = [
			ConfigModule,
			ErrorHandlingModule,
			HealthModule.forRoot({
				additionalChecks: options.healthChecks,
			}),
			LoggerModule.register(),
			PrometheusModule.register(),
			PrismaModule.register(),
		];

		// Automatically include modules for HTTP services
		const httpModules =
			options.protocol === 'http'
				? [
						HealthCheckModule,
						ClerkModule.register(),
						RedisModule,
						ThrottlerModule.forRoot([
							{
								limit: 100,
								ttl: 60000,
							},
						]),
					]
				: [];

		// Automatically include RequestTracingModule for all services
		const tracingModules = [RequestTracingModule.register({ protocol: options.protocol })];

		// Automatically include providers for HTTP services
		const httpProviders =
			options.protocol === 'http'
				? [
						AuthService,
						AuthGuard,
						{
							provide: APP_GUARD,
							useClass: ThrottlerGuard,
						},
					]
				: [];

		return {
			exports: baseModules,
			imports: [...baseModules, ...httpModules, ...tracingModules, ...(options.additionalModules || [])],
			module: BootstrapModule,
			providers: [...httpProviders, ...(options.additionalProviders || [])],
		};
	}
}
