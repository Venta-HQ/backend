import { Module } from '@nestjs/common';
import { HealthModule } from './health.module';

@Module({
	imports: [
		HealthModule.forRoot({
			appName: 'Health Check Service',
		}),
	],
})
export class HealthCheckModule {}
