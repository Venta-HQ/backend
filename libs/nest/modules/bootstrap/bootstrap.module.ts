import { ErrorHandlingModule } from '@app/nest/errors';
import { HealthCheckModule, HealthModule, LoggerModule, PrismaModule, PrometheusModule } from '@app/nest/modules';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

export interface BootstrapOptions {
	additionalModules?: any[];
	additionalProviders?: any[];
	appName: string;
	healthChecks?: () => Promise<Record<string, string>>;
	protocol: 'http' | 'grpc' | 'websocket' | 'nats';
	enableJetStream?: boolean;
}

@Module({})
export class BootstrapModule {
	static forRoot(options: BootstrapOptions): DynamicModule {
		const baseModules = [
			ConfigModule,
			ErrorHandlingModule,
			HealthModule.forRoot({
				additionalChecks: options.healthChecks,
				appName: options.appName,
			}),
			LoggerModule.register({
				appName: options.appName,
				protocol: options.protocol === 'websocket' || options.protocol === 'nats' ? 'http' : options.protocol,
			}),
			PrometheusModule.register({ appName: options.appName }),
			PrismaModule.register(),
		];

		// Automatically include HealthCheckModule for HTTP services
		const httpModules = options.protocol === 'http' ? [HealthCheckModule] : [];

		return {
			exports: baseModules,
			imports: [...baseModules, ...httpModules, ...(options.additionalModules || [])],
			module: BootstrapModule,
			providers: options.additionalProviders || [],
		};
	}
}
