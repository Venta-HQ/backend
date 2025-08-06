import { Module } from '@nestjs/common';
import { HealthModule } from './health.module';

@Module({
	imports: [HealthModule.forRoot()],
})
export class HealthCheckModule {}
