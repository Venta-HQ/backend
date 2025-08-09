import { Injectable, Logger } from '@nestjs/common';
import { MetricsService } from '@venta/nest/modules';

export interface ContractMetricsConfig {
	domain: string;
	method: string;
	type?: 'stream' | 'request';
	additionalLabels?: Record<string, string | number>;
}

/**
 * Utility class for handling contract-level metrics and monitoring
 */
@Injectable()
export class ContractMetricsUtil {
	private readonly logger = new Logger(ContractMetricsUtil.name);

	constructor(private readonly metricsService: MetricsService) {}

	/**
	 * Records a successful contract call
	 */
	recordSuccess(config: ContractMetricsConfig, duration?: number) {
		try {
			this.metricsService.recordContractCall(`${config.domain}.${config.method}`, {
				success: true,
				type: config.type || 'request',
				duration,
				...config.additionalLabels,
			});
		} catch (error) {
			this.logger.error(`Failed to record contract success metrics: ${error.message}`, error.stack);
		}
	}

	/**
	 * Records a failed contract call
	 */
	recordError(config: ContractMetricsConfig, error: Error, duration?: number) {
		try {
			this.metricsService.recordContractCall(`${config.domain}.${config.method}`, {
				success: false,
				type: config.type || 'request',
				error: error.message,
				errorCode: (error as any).code,
				duration,
				...config.additionalLabels,
			});
		} catch (metricError) {
			this.logger.error(`Failed to record contract error metrics: ${metricError.message}`, metricError.stack);
		}
	}

	/**
	 * Creates a metrics wrapper for contract methods
	 */
	async withMetrics<T>(config: ContractMetricsConfig, operation: () => Promise<T>): Promise<T> {
		const startTime = Date.now();
		try {
			const result = await operation();
			this.recordSuccess(config, Date.now() - startTime);
			return result;
		} catch (error) {
			this.recordError(config, error, Date.now() - startTime);
			throw error;
		}
	}

	/**
	 * Creates a metrics wrapper for contract streams
	 */
	createStreamMetricsOperator(config: ContractMetricsConfig) {
		return {
			next: () => {
				this.recordSuccess({ ...config, type: 'stream' });
			},
			error: (error: Error) => {
				this.recordError({ ...config, type: 'stream' }, error);
			},
		};
	}
}
