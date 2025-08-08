import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from '@venta/nest/modules';
import { ContractMetricsUtil } from './contract-metrics.util';

describe('ContractMetricsUtil', () => {
	let service: ContractMetricsUtil;
	let metricsService: jest.Mocked<MetricsService>;
	let logger: jest.Mocked<Logger>;

	const mockConfig = {
		domain: 'location',
		method: 'updateVendorLocation',
		additionalLabels: {
			vendorId: 'vendor-123',
		},
	};

	beforeEach(async () => {
		metricsService = {
			recordContractCall: jest.fn(),
		} as any;

		logger = {
			error: jest.fn(),
		} as any;

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ContractMetricsUtil,
				{
					provide: MetricsService,
					useValue: metricsService,
				},
			],
		}).compile();

		service = module.get<ContractMetricsUtil>(ContractMetricsUtil);
		(service as any).logger = logger;
	});

	describe('recordSuccess', () => {
		it('should record success metrics', () => {
			const duration = 100;

			service.recordSuccess(mockConfig, duration);

			expect(metricsService.recordContractCall).toHaveBeenCalledWith('location.updateVendorLocation', {
				success: true,
				type: 'request',
				duration,
				vendorId: 'vendor-123',
			});
		});

		it('should handle errors gracefully', () => {
			const error = new Error('Metrics error');
			metricsService.recordContractCall.mockImplementation(() => {
				throw error;
			});

			service.recordSuccess(mockConfig);

			expect(logger.error).toHaveBeenCalledWith(
				'Failed to record contract success metrics: Metrics error',
				error.stack,
			);
		});
	});

	describe('recordError', () => {
		it('should record error metrics', () => {
			const duration = 100;
			const error = new Error('Operation failed');
			(error as any).code = 'ECONNRESET';

			service.recordError(mockConfig, error, duration);

			expect(metricsService.recordContractCall).toHaveBeenCalledWith('location.updateVendorLocation', {
				success: false,
				type: 'request',
				error: error.message,
				errorCode: 'ECONNRESET',
				duration,
				vendorId: 'vendor-123',
			});
		});

		it('should handle metrics errors gracefully', () => {
			const error = new Error('Operation failed');
			const metricsError = new Error('Metrics error');
			metricsService.recordContractCall.mockImplementation(() => {
				throw metricsError;
			});

			service.recordError(mockConfig, error);

			expect(logger.error).toHaveBeenCalledWith(
				'Failed to record contract error metrics: Metrics error',
				metricsError.stack,
			);
		});
	});

	describe('withMetrics', () => {
		it('should wrap successful operations with metrics', async () => {
			const result = 'success';
			const operation = jest.fn().mockResolvedValue(result);

			const actualResult = await service.withMetrics(mockConfig, operation);

			expect(actualResult).toBe(result);
			expect(metricsService.recordContractCall).toHaveBeenCalledWith(
				'location.updateVendorLocation',
				expect.objectContaining({
					success: true,
					type: 'request',
					duration: expect.any(Number),
					vendorId: 'vendor-123',
				}),
			);
		});

		it('should handle and record operation errors', async () => {
			const error = new Error('Operation failed');
			const operation = jest.fn().mockRejectedValue(error);

			await expect(service.withMetrics(mockConfig, operation)).rejects.toThrow(error);

			expect(metricsService.recordContractCall).toHaveBeenCalledWith(
				'location.updateVendorLocation',
				expect.objectContaining({
					success: false,
					type: 'request',
					error: error.message,
					duration: expect.any(Number),
					vendorId: 'vendor-123',
				}),
			);
		});
	});

	describe('createStreamMetricsOperator', () => {
		it('should create stream metrics handlers', () => {
			const handlers = service.createStreamMetricsOperator(mockConfig);

			handlers.next();

			expect(metricsService.recordContractCall).toHaveBeenCalledWith(
				'location.updateVendorLocation',
				expect.objectContaining({
					success: true,
					type: 'stream',
					vendorId: 'vendor-123',
				}),
			);

			const error = new Error('Stream error');
			handlers.error(error);

			expect(metricsService.recordContractCall).toHaveBeenCalledWith(
				'location.updateVendorLocation',
				expect.objectContaining({
					success: false,
					type: 'stream',
					error: error.message,
					vendorId: 'vendor-123',
				}),
			);
		});
	});
});
