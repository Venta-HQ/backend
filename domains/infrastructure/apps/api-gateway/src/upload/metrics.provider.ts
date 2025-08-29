import { Counter, Histogram } from 'prom-client';
import { MetricsFactory, PrometheusService } from '@venta/nest/modules';

export const UPLOAD_METRICS = 'UPLOAD_METRICS';

export interface UploadMetrics {
	upload_requests_total: Counter<string>;
	upload_bytes: Histogram<string>;
	upload_duration_seconds: Histogram<string>;
}

export function createUploadMetrics(prometheusService: PrometheusService): UploadMetrics {
	const metrics = prometheusService.registerMetrics([
		MetricsFactory.counter('upload_requests_total', 'Total upload requests', ['outcome']),
		MetricsFactory.histogram(
			'upload_bytes',
			'Histogram of uploaded image sizes in bytes',
			[16 * 1024, 64 * 1024, 256 * 1024, 1024 * 1024, 5 * 1024 * 1024],
			[],
		),
		MetricsFactory.histogram(
			'upload_duration_seconds',
			'Histogram of upload end-to-end duration in seconds',
			[0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
			['outcome'],
		),
	]);

	return {
		upload_requests_total: metrics.upload_requests_total as Counter<string>,
		upload_bytes: metrics.upload_bytes as Histogram<string>,
		upload_duration_seconds: metrics.upload_duration_seconds as Histogram<string>,
	};
}
