import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

export interface HealthModuleOptions {
	additionalChecks?: () => Promise<Record<string, any>>;
}

@Module({})
export class HealthModule {
	static forRoot(options: HealthModuleOptions = {}): DynamicModule {
		return {
			controllers: [HealthController],
			exports: [HealthController],
			imports: [ConfigModule, TerminusModule],
			module: HealthModule,
			providers: [
				HealthController,
				{
					provide: 'HEALTH_OPTIONS',
					useFactory: (configService: ConfigService) => ({
						additionalChecks: options.additionalChecks,
						appName: configService.get('APP_NAME') || 'unknown-service',
					}),
					inject: [ConfigService],
				},
				ConfigService, // Make ConfigService available to Health services
			],
		};
	}
}
