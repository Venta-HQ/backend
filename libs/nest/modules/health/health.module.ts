import { DynamicModule, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

export interface HealthModuleOptions {
	additionalChecks?: () => Promise<Record<string, any>>;
	serviceName: string;
}

@Module({})
export class HealthModule {
	static forRoot(options: HealthModuleOptions): DynamicModule {
		return {
			controllers: [HealthController],
			exports: [HealthController],
			imports: [TerminusModule],
			module: HealthModule,
			providers: [
				{
					provide: 'HEALTH_OPTIONS',
					useValue: options,
				},
			],
		};
	}
}
