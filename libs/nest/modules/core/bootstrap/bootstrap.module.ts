import { ErrorHandlingModule } from '@app/nest/errors';
import {
	HealthCheckModule,
	HealthModule,
	LoggerModule,
	PrismaModule,
	PrometheusModule,
	RequestTracingModule,
} from '@app/nest/modules';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

export interface BootstrapOptions {
	additionalModules?: any[];
	additionalProviders?: any[];
	appName: string;
	healthChecks?: () => Promise<Record<string, any>>;
	protocol?: 'http' | 'grpc' | 'websocket' | 'nats';
}

@Module({})
export class BootstrapModule {
	static forRoot(options: BootstrapOptions): DynamicModule {
		// Set the APP_NAME environment variable for the ConfigService
		process.env.APP_NAME = options.appName;

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

		// Automatically include HealthCheckModule for HTTP services
		const httpModules = options.protocol === 'http' ? [HealthCheckModule] : [];

		// Automatically include RequestTracingModule for gRPC and NATS services
		const tracingModules =
			options.protocol === 'grpc' || options.protocol === 'nats'
				? [RequestTracingModule.register({ protocol: options.protocol })]
				: [];

		return {
			exports: baseModules,
			imports: [...baseModules, ...httpModules, ...tracingModules, ...(options.additionalModules || [])],
			module: BootstrapModule,
			providers: options.additionalProviders || [],
		};
	}
}
