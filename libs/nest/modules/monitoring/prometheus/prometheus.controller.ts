import { Controller, Get, Header } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';

@Controller('metrics')
export class PrometheusController {
	constructor(private readonly prometheusService: PrometheusService) {}

	/**
	 * Expose metrics in Prometheus format
	 * This endpoint is scraped by Prometheus
	 */
	@Get()
	@Header('Content-Type', 'text/plain')
	async getMetrics(): Promise<string> {
		return await this.prometheusService.getMetrics();
	}
}
