import { ErrorHandlingModule } from '@app/nest/errors';
import { EventsModule, HealthModule, LoggerModule, PrismaModule, PrometheusModule } from '@app/nest/modules';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

export interface BootstrapOptions {
	additionalModules?: any[];
	additionalProviders?: any[];
	appName: string;
	healthChecks?: () => Promise<Record<string, string>>;
	protocol: 'http' | 'grpc' | 'websocket';
}

@Module({})
export class BootstrapModule {
	static forRoot(options: BootstrapOptions): DynamicModule {
		const baseModules = [
			ConfigModule,
			ErrorHandlingModule,
			EventsModule,
			HealthModule.forRoot({
				additionalChecks: options.healthChecks,
				appName: options.appName,
			}),
			LoggerModule.register({
				appName: options.appName,
				protocol: options.protocol === 'websocket' ? 'http' : options.protocol,
			}),
			PrometheusModule.register({ appName: options.appName }),
			PrismaModule.register(),
		];

		return {
			exports: baseModules,
			imports: [...baseModules, ...(options.additionalModules || [])],
			module: BootstrapModule,
			providers: options.additionalProviders || [],
		};
	}
}
