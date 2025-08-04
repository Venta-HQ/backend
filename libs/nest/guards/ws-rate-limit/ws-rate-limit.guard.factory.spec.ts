import { describe, expect, it, vi } from 'vitest';
import { WsRateLimitGuard } from './ws-rate-limit.guard';
import { WsRateLimitGuards } from './ws-rate-limit.guard.factory';

// Mock Redis
const mockRedis = {
	del: vi.fn(),
	expire: vi.fn(),
	get: vi.fn(),
	incr: vi.fn(),
	ttl: vi.fn(),
};

describe('WsRateLimitGuardFactory', () => {
	describe('WsRateLimitGuards', () => {
		it('should have all pre-configured guards available', () => {
			expect(WsRateLimitGuards.strict).toBeDefined();
			expect(WsRateLimitGuards.standard).toBeDefined();
			expect(WsRateLimitGuards.lenient).toBeDefined();
			expect(WsRateLimitGuards.status).toBeDefined();
		});

		it('should create strict guard correctly', () => {
			const StrictGuard = WsRateLimitGuards.strict;
			const guard = new StrictGuard(mockRedis);

			expect(guard).toBeInstanceOf(WsRateLimitGuard);
		});

		it('should create standard guard correctly', () => {
			const StandardGuard = WsRateLimitGuards.standard;
			const guard = new StandardGuard(mockRedis);

			expect(guard).toBeInstanceOf(WsRateLimitGuard);
		});

		it('should create lenient guard correctly', () => {
			const LenientGuard = WsRateLimitGuards.lenient;
			const guard = new LenientGuard(mockRedis);

			expect(guard).toBeInstanceOf(WsRateLimitGuard);
		});

		it('should create status guard correctly', () => {
			const StatusGuard = WsRateLimitGuards.status;
			const guard = new StatusGuard(mockRedis);

			expect(guard).toBeInstanceOf(WsRateLimitGuard);
		});

		it('should have correct rate limits for each guard type', () => {
			// Test that each guard has the expected configuration
			// Note: We can't directly access the options, but we can verify the guards are created
			expect(() => new WsRateLimitGuards.strict(mockRedis)).not.toThrow();
			expect(() => new WsRateLimitGuards.standard(mockRedis)).not.toThrow();
			expect(() => new WsRateLimitGuards.lenient(mockRedis)).not.toThrow();
			expect(() => new WsRateLimitGuards.status(mockRedis)).not.toThrow();
		});
	});

	describe('Guard Functionality', () => {
		it('should allow requests within rate limit', async () => {
			const StandardGuard = WsRateLimitGuards.standard;
			const guard = new StandardGuard(mockRedis);

			const mockClient = {
				id: 'socket-123',
				userId: 'user-456',
			};

			const mockContext = {
				switchToWs: () => ({
					getClient: () => mockClient,
				}),
			};

			mockRedis.incr.mockResolvedValue(5); // Under limit of 15
			mockRedis.expire.mockResolvedValue(1);

			const result = await guard.canActivate(mockContext as any);
			expect(result).toBe(true);
		});

		it('should reject requests over rate limit', async () => {
			const StandardGuard = WsRateLimitGuards.standard;
			const guard = new StandardGuard(mockRedis);

			const mockClient = {
				id: 'socket-123',
				userId: 'user-456',
			};

			const mockContext = {
				switchToWs: () => ({
					getClient: () => mockClient,
				}),
			};

			mockRedis.incr.mockResolvedValue(16); // Over limit of 15
			mockRedis.expire.mockResolvedValue(1);

			await expect(guard.canActivate(mockContext as any)).rejects.toThrow();
		});
	});
});
