import { Module } from '@nestjs/common';
import { PrometheusController } from './prometheus.controller';
import { PrometheusService } from './prometheus.service';

@Module({
	controllers: [PrometheusController],
	exports: [PrometheusService],
	providers: [PrometheusService],
})
export class PrometheusModule {}
