import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { WsRateLimitGuard } from './ws-rate-limit.guard';
import { WsRateLimitGuards, createWsRateLimitGuard } from './ws-rate-limit.guard.factory';
import { WsError } from '@app/nest/errors';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock Redis
const mockRedis = {
	incr: vi.fn(),
	expire: vi.fn(),
	get: vi.fn(),
	ttl: vi.fn(),
	del: vi.fn(),
};

describe('WsRateLimitGuard', () => {
	let guard: WsRateLimitGuard;
	let module: TestingModule;

	const defaultOptions = {
		limit: 10,
		windowMs: 60000, // 1 minute
	};

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: 'default_IORedisModuleConnectionToken',
					useValue: mockRedis,
				},
				{
					provide: WsRateLimitGuard,
					useFactory: () => new WsRateLimitGuard(mockRedis, defaultOptions),
				},
			],
		}).compile();

		guard = module.get<WsRateLimitGuard>(WsRateLimitGuard);
		
		// Ensure the guard has access to the mocked Redis
		(guard as any).redis = mockRedis;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('canActivate', () => {
		it('should allow request when under rate limit', async () => {
			const mockClient = {
				id: 'socket-123',
				userId: 'user-456',
			};

			const mockContext = {
				switchToWs: () => ({
					getClient: () => mockClient,
				}),
			} as ExecutionContext;

			mockRedis.incr.mockResolvedValue(1); // First request, should trigger expire
			mockRedis.expire.mockResolvedValue(1);

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(true);
			expect(mockRedis.incr).toHaveBeenCalledWith('ws_rate_limit:user-456:default:socket-123');
			expect(mockRedis.expire).toHaveBeenCalledWith('ws_rate_limit:user-456:default:socket-123', 60);
		});

		it('should set expiry only on first request', async () => {
			const mockClient = {
				id: 'socket-123',
				userId: 'user-456',
			};

			const mockContext = {
				switchToWs: () => ({
					getClient: () => mockClient,
				}),
			} as ExecutionContext;

			mockRedis.incr.mockResolvedValue(2); // Not first request

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(true);
			expect(mockRedis.incr).toHaveBeenCalled();
			expect(mockRedis.expire).not.toHaveBeenCalled();
		});

		it('should throw WsError when rate limit exceeded', async () => {
			const mockClient = {
				id: 'socket-123',
				userId: 'user-456',
			};

			const mockContext = {
				switchToWs: () => ({
					getClient: () => mockClient,
				}),
			} as ExecutionContext;

			mockRedis.incr.mockResolvedValue(11); // Exceeds limit of 10
			mockRedis.expire.mockResolvedValue(1);

			await expect(guard.canActivate(mockContext)).rejects.toThrow(WsError);
		});

		it('should handle anonymous users', async () => {
			const mockClient = {
				id: 'socket-123',
				userId: undefined,
			};

			const mockContext = {
				switchToWs: () => ({
					getClient: () => mockClient,
				}),
			} as ExecutionContext;

			mockRedis.incr.mockResolvedValue(1);
			mockRedis.expire.mockResolvedValue(1);

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(true);
			expect(mockRedis.incr).toHaveBeenCalledWith('ws_rate_limit:anonymous:default:socket-123');
		});

		it('should handle missing socket ID', async () => {
			const mockClient = {
				id: undefined,
				userId: 'user-456',
			};

			const mockContext = {
				switchToWs: () => ({
					getClient: () => mockClient,
				}),
			} as ExecutionContext;

			mockRedis.incr.mockResolvedValue(1);
			mockRedis.expire.mockResolvedValue(1);

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(true);
			expect(mockRedis.incr).toHaveBeenCalledWith('ws_rate_limit:user-456:default:unknown');
		});

		it('should allow request when Redis fails', async () => {
			const mockClient = {
				id: 'socket-123',
				userId: 'user-456',
			};

			const mockContext = {
				switchToWs: () => ({
					getClient: () => mockClient,
				}),
			} as ExecutionContext;

			mockRedis.incr.mockRejectedValue(new Error('Redis error'));

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(true); // Should allow request when rate limiting fails
		});

		it('should use custom key prefix when provided', async () => {
			const customGuard = new WsRateLimitGuard(mockRedis, {
				...defaultOptions,
				keyPrefix: 'custom_prefix:',
			});

			const mockClient = {
				id: 'socket-123',
				userId: 'user-456',
			};

			const mockContext = {
				switchToWs: () => ({
					getClient: () => mockClient,
				}),
			} as ExecutionContext;

			mockRedis.incr.mockResolvedValue(1);
			mockRedis.expire.mockResolvedValue(1);

			const result = await customGuard.canActivate(mockContext);

			expect(result).toBe(true);
			expect(mockRedis.incr).toHaveBeenCalledWith('custom_prefix:user-456:default:socket-123');
		});
	});

	describe('resetLimit', () => {
		it('should delete the rate limit key', async () => {
			const key = 'test-key';
			mockRedis.del.mockResolvedValue(1);

			await guard.resetLimit(key);

			expect(mockRedis.del).toHaveBeenCalledWith(key);
		});
	});

	describe('getLimitStatus', () => {
		it('should return correct limit status', async () => {
			const key = 'test-key';
			mockRedis.get.mockResolvedValue('5');
			mockRedis.ttl.mockResolvedValue(30);

			const result = await guard.getLimitStatus(key);

			expect(result).toEqual({
				current: 5,
				limit: 10,
				remaining: 5,
				resetTime: expect.any(Number),
			});
			expect(mockRedis.get).toHaveBeenCalledWith(key);
			expect(mockRedis.ttl).toHaveBeenCalledWith(key);
		});

		it('should handle missing key', async () => {
			const key = 'test-key';
			mockRedis.get.mockResolvedValue(null);
			mockRedis.ttl.mockResolvedValue(-1);

			const result = await guard.getLimitStatus(key);

			expect(result).toEqual({
				current: 0,
				limit: 10,
				remaining: 10,
				resetTime: expect.any(Number),
			});
		});

		it('should handle zero remaining requests', async () => {
			const key = 'test-key';
			mockRedis.get.mockResolvedValue('10');
			mockRedis.ttl.mockResolvedValue(15);

			const result = await guard.getLimitStatus(key);

			expect(result).toEqual({
				current: 10,
				limit: 10,
				remaining: 0,
				resetTime: expect.any(Number),
			});
		});
	});

	describe('generateKey', () => {
		it('should generate correct key format', () => {
			const mockClient = {
				id: 'socket-123',
				userId: 'user-456',
			};

			const result = (guard as any).generateKey(mockClient);

			expect(result).toBe('ws_rate_limit:user-456:default:socket-123');
		});

		it('should handle missing user ID', () => {
			const mockClient = {
				id: 'socket-123',
				userId: undefined,
			};

			const result = (guard as any).generateKey(mockClient);

			expect(result).toBe('ws_rate_limit:anonymous:default:socket-123');
		});

		it('should handle missing socket ID', () => {
			const mockClient = {
				id: undefined,
				userId: 'user-456',
			};

			const result = (guard as any).generateKey(mockClient);

			expect(result).toBe('ws_rate_limit:user-456:default:unknown');
		});
	});

	describe('getEventName', () => {
		it('should return default event name', () => {
			const mockClient = {};

			const result = (guard as any).getEventName(mockClient);

			expect(result).toBe('default');
		});
	});

	describe('Factory Guards', () => {
		it('should create strict guard with correct limits', () => {
			const StrictGuard = createWsRateLimitGuard({
				limit: 5,
				windowMs: 60000,
			});

			const strictGuard = new StrictGuard(mockRedis);
			expect(strictGuard).toBeInstanceOf(WsRateLimitGuard);
		});

		it('should have pre-configured guards available', () => {
			expect(WsRateLimitGuards.strict).toBeDefined();
			expect(WsRateLimitGuards.standard).toBeDefined();
			expect(WsRateLimitGuards.lenient).toBeDefined();
			expect(WsRateLimitGuards.status).toBeDefined();
		});

		it('should create standard guard with correct configuration', () => {
			const StandardGuard = WsRateLimitGuards.standard;
			const standardGuard = new StandardGuard(mockRedis);
			
			expect(standardGuard).toBeInstanceOf(WsRateLimitGuard);
		});

		it('should create lenient guard with correct configuration', () => {
			const LenientGuard = WsRateLimitGuards.lenient;
			const lenientGuard = new LenientGuard(mockRedis);
			
			expect(lenientGuard).toBeInstanceOf(WsRateLimitGuard);
		});
	});
}); 