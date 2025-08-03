import { DynamicModule, Module, Provider } from '@nestjs/common';
import { HealthController } from './health.controller';

export interface HealthModuleOptions {
	serviceName: string;
	additionalChecks?: () => Promise<Record<string, any>>;
}

@Module({})
export class HealthModule {
	static forRoot(options: HealthModuleOptions): DynamicModule {
		const healthControllerProvider: Provider = {
			provide: HealthController,
			useFactory: () => new HealthController(options),
		};

		return {
			module: HealthModule,
			controllers: [HealthController],
			providers: [healthControllerProvider],
			exports: [HealthController],
		};
	}
}
