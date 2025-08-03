import { DynamicModule, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

export interface HealthModuleOptions {
	serviceName: string;
	additionalChecks?: () => Promise<Record<string, any>>;
}

@Module({})
export class HealthModule {
	static forRoot(options: HealthModuleOptions): DynamicModule {
		return {
			module: HealthModule,
			imports: [TerminusModule],
			controllers: [HealthController],
			providers: [
				{
					provide: 'HEALTH_OPTIONS',
					useValue: options,
				},
			],
			exports: [HealthController],
		};
	}
} 