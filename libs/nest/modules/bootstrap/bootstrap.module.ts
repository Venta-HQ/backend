import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ErrorHandlingModule } from '@app/nest/errors';
import { EventsModule } from '@app/nest/modules';
import { HealthModule } from '@app/nest/modules';
import { LoggerModule } from '@app/nest/modules';
import { PrometheusModule } from '@app/nest/modules';
import { PrismaModule } from '@app/nest/modules';

export interface BootstrapOptions {
	appName: string;
	protocol: 'http' | 'grpc' | 'websocket';
	additionalModules?: any[];
	additionalProviders?: any[];
	healthChecks?: () => Promise<Record<string, string>>;
}

@Module({})
export class BootstrapModule {
	static forRoot(options: BootstrapOptions): DynamicModule {
		const baseModules = [
			ConfigModule,
			ErrorHandlingModule,
			EventsModule,
					HealthModule.forRoot({
			appName: options.appName,
			additionalChecks: options.healthChecks,
		}),
					LoggerModule.register({ 
			appName: options.appName, 
			protocol: options.protocol === 'websocket' ? 'http' : options.protocol 
		}),
			PrometheusModule.register({ appName: options.appName }),
			PrismaModule.register(),
		];

		return {
			module: BootstrapModule,
			imports: [
				...baseModules,
				...(options.additionalModules || []),
			],
			providers: options.additionalProviders || [],
			exports: baseModules,
		};
	}
} 