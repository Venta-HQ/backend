import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HealthChecker, HealthChecks } from './health-check.util';

describe('HealthChecker', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('basic functionality', () => {
		it('should register and run health checks', async () => {
			const healthChecker = new HealthChecker();
			const mockCheck = vi.fn().mockResolvedValue({
				name: 'test',
				status: 'healthy' as const,
				message: 'Test check passed',
				timestamp: new Date(),
			});

			healthChecker.register('test-check', mockCheck);
			const result = await healthChecker.runCheck('test-check');

			expect(mockCheck).toHaveBeenCalledTimes(1);
			expect(result.name).toBe('test-check');
			expect(result.status).toBe('healthy');
		});

		it('should handle failed health checks', async () => {
			const healthChecker = new HealthChecker();
			const mockCheck = vi.fn().mockRejectedValue(new Error('Check failed'));

			healthChecker.register('test-check', mockCheck);
			const result = await healthChecker.runCheck('test-check');

			expect(result.status).toBe('unhealthy');
			expect(result.message).toBe('Check failed');
		});

		it('should timeout health checks', async () => {
			const healthChecker = new HealthChecker({ timeout: 100 });
			const slowCheck = vi.fn().mockImplementation(() => 
				new Promise(resolve => setTimeout(resolve, 200))
			);

			healthChecker.register('slow-check', slowCheck);
			const result = await healthChecker.runCheck('slow-check');

			expect(result.status).toBe('unhealthy');
			expect(result.message).toContain('timed out');
		});
	});

	describe('multiple checks', () => {
		it('should run all registered checks', async () => {
			const healthChecker = new HealthChecker();
			const check1 = vi.fn().mockResolvedValue({
				name: 'check1',
				status: 'healthy' as const,
				message: 'Check 1 passed',
				timestamp: new Date(),
			});
			const check2 = vi.fn().mockResolvedValue({
				name: 'check2',
				status: 'healthy' as const,
				message: 'Check 2 passed',
				timestamp: new Date(),
			});

			healthChecker.register('check1', check1);
			healthChecker.register('check2', check2);

			const results = await healthChecker.runAllChecks();

			expect(results).toHaveLength(2);
			expect(check1).toHaveBeenCalledTimes(1);
			expect(check2).toHaveBeenCalledTimes(1);
		});

		it('should handle mixed results', async () => {
			const healthChecker = new HealthChecker();
			const healthyCheck = vi.fn().mockResolvedValue({
				name: 'healthy',
				status: 'healthy' as const,
				message: 'Healthy check passed',
				timestamp: new Date(),
			});
			const unhealthyCheck = vi.fn().mockRejectedValue(new Error('Unhealthy check failed'));

			healthChecker.register('healthy', healthyCheck);
			healthChecker.register('unhealthy', unhealthyCheck);

			const results = await healthChecker.runAllChecks();

			expect(results).toHaveLength(2);
			const healthyResult = results.find(r => r.name === 'healthy');
			const unhealthyResult = results.find(r => r.name === 'unhealthy');

			expect(healthyResult?.status).toBe('healthy');
			expect(unhealthyResult?.status).toBe('unhealthy');
		});
	});

	describe('health status', () => {
		it('should return overall healthy status when all checks pass', async () => {
			const healthChecker = new HealthChecker();
			const check = vi.fn().mockResolvedValue({
				name: 'test',
				status: 'healthy' as const,
				message: 'Test passed',
				timestamp: new Date(),
			});

			healthChecker.register('test', check);
			const status = await healthChecker.getHealthStatus();

			expect(status.status).toBe('healthy');
			expect(status.summary.total).toBe(1);
			expect(status.summary.healthy).toBe(1);
			expect(status.summary.unhealthy).toBe(0);
		});

		it('should return unhealthy status when any check fails', async () => {
			const healthChecker = new HealthChecker();
			const healthyCheck = vi.fn().mockResolvedValue({
				name: 'healthy',
				status: 'healthy' as const,
				message: 'Healthy check passed',
				timestamp: new Date(),
			});
			const unhealthyCheck = vi.fn().mockRejectedValue(new Error('Failed'));

			healthChecker.register('healthy', healthyCheck);
			healthChecker.register('unhealthy', unhealthyCheck);

			const status = await healthChecker.getHealthStatus();

			expect(status.status).toBe('unhealthy');
			expect(status.summary.total).toBe(2);
			expect(status.summary.healthy).toBe(1);
			expect(status.summary.unhealthy).toBe(1);
		});

		it('should return degraded status when some checks are degraded', async () => {
			const healthChecker = new HealthChecker();
			const healthyCheck = vi.fn().mockResolvedValue({
				name: 'healthy',
				status: 'healthy' as const,
				message: 'Healthy check passed',
				timestamp: new Date(),
			});
			const degradedCheck = vi.fn().mockResolvedValue({
				name: 'degraded',
				status: 'degraded' as const,
				message: 'Degraded check',
				timestamp: new Date(),
			});

			healthChecker.register('healthy', healthyCheck);
			healthChecker.register('degraded', degradedCheck);

			const status = await healthChecker.getHealthStatus();

			expect(status.status).toBe('degraded');
			expect(status.summary.total).toBe(2);
			expect(status.summary.healthy).toBe(1);
			expect(status.summary.degraded).toBe(1);
		});
	});

	describe('options', () => {
		it('should include details when includeDetails is true', async () => {
			const healthChecker = new HealthChecker({ includeDetails: true });
			const check = vi.fn().mockResolvedValue({
				name: 'test',
				status: 'healthy' as const,
				message: 'Test passed',
				timestamp: new Date(),
				details: { someDetail: 'value' },
			});

			healthChecker.register('test', check);
			const status = await healthChecker.getHealthStatus();

			expect(status.checks[0].details).toEqual({ someDetail: 'value' });
		});

		it('should not include details when includeDetails is false', async () => {
			const healthChecker = new HealthChecker({ includeDetails: false });
			const check = vi.fn().mockResolvedValue({
				name: 'test',
				status: 'healthy' as const,
				message: 'Test passed',
				timestamp: new Date(),
				details: { someDetail: 'value' },
			});

			healthChecker.register('test', check);
			const status = await healthChecker.getHealthStatus();

			expect(status.checks[0].details).toBeUndefined();
		});
	});
});

describe('HealthChecks', () => {
	describe('memoryCheck', () => {
		it('should return healthy for normal memory usage', async () => {
			const result = await HealthChecks.memoryCheck(1000); // High threshold
			expect(result.status).toBe('healthy');
			expect(result.name).toBe('memory');
			expect(result.details).toBeDefined();
		});

		it('should return degraded for high memory usage', async () => {
			const result = await HealthChecks.memoryCheck(1); // Very low threshold
			expect(result.status).toBe('degraded');
			expect(result.name).toBe('memory');
			expect(result.details).toBeDefined();
		});
	});

	describe('databaseCheck', () => {
		it('should return healthy for successful database connection', async () => {
			const mockPrismaClient = {
				$queryRaw: vi.fn().mockResolvedValue([{ '1': 1 }]),
			};

			const result = await HealthChecks.databaseCheck(mockPrismaClient);
			expect(result.status).toBe('healthy');
			expect(result.name).toBe('database');
		});

		it('should return unhealthy for failed database connection', async () => {
			const mockPrismaClient = {
				$queryRaw: vi.fn().mockRejectedValue(new Error('Connection failed')),
			};

			const result = await HealthChecks.databaseCheck(mockPrismaClient);
			expect(result.status).toBe('unhealthy');
			expect(result.name).toBe('database');
		});
	});

	describe('redisCheck', () => {
		it('should return healthy for successful Redis connection', async () => {
			const mockRedisClient = {
				ping: vi.fn().mockResolvedValue('PONG'),
			};

			const result = await HealthChecks.redisCheck(mockRedisClient);
			expect(result.status).toBe('healthy');
			expect(result.name).toBe('redis');
		});

		it('should return unhealthy for failed Redis connection', async () => {
			const mockRedisClient = {
				ping: vi.fn().mockRejectedValue(new Error('Connection failed')),
			};

			const result = await HealthChecks.redisCheck(mockRedisClient);
			expect(result.status).toBe('unhealthy');
			expect(result.name).toBe('redis');
		});
	});

	describe('externalServiceCheck', () => {
		it('should return healthy for successful service check', async () => {
			const mockCheckFunction = vi.fn().mockResolvedValue('success');

			const result = await HealthChecks.externalServiceCheck('test-service', mockCheckFunction);
			expect(result.status).toBe('healthy');
			expect(result.name).toBe('test-service');
		});

		it('should return unhealthy for failed service check', async () => {
			const mockCheckFunction = vi.fn().mockRejectedValue(new Error('Service unavailable'));

			const result = await HealthChecks.externalServiceCheck('test-service', mockCheckFunction);
			expect(result.status).toBe('unhealthy');
			expect(result.name).toBe('test-service');
		});
	});

	describe('diskSpaceCheck', () => {
		it('should return healthy for sufficient disk space', async () => {
			const result = await HealthChecks.diskSpaceCheck();
			expect(result.status).toBe('healthy');
			expect(result.name).toBe('disk');
		});
	});
}); 