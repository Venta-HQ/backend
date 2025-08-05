import { Socket } from 'socket.io';
import { vi } from 'vitest';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { WsRateLimitGuard } from './ws-rate-limit.guard';

describe('WsRateLimitGuard', () => {
	let guard: WsRateLimitGuard;
	let mockContext: ExecutionContext;
	let mockSocket: Partial<Socket>;
	let mockRedis: any;

	beforeEach(() => {
		mockRedis = {
			expire: vi.fn(),
			incr: vi.fn(),
		};
		guard = new WsRateLimitGuard(mockRedis);

		mockSocket = {
			clerkId: 'test-user',
			id: 'test-socket-id',
		};

		mockContext = {
			switchToWs: () => ({
				getClient: () => mockSocket,
			}),
		} as ExecutionContext;
	});

	describe('canActivate', () => {
		it('should allow access when under rate limit', async () => {
			mockRedis.incr.mockResolvedValue(50);
			mockRedis.expire.mockResolvedValue(1);

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(true);
			expect(mockRedis.incr).toHaveBeenCalledWith('ws_rate_limit:test-user');
		});

		it('should set expiry on first request', async () => {
			mockRedis.incr.mockResolvedValue(1);
			mockRedis.expire.mockResolvedValue(1);

			await guard.canActivate(mockContext);

			expect(mockRedis.expire).toHaveBeenCalledWith('ws_rate_limit:test-user', 60);
		});

		it('should not set expiry on subsequent requests', async () => {
			mockRedis.incr.mockResolvedValue(2);

			await guard.canActivate(mockContext);

			expect(mockRedis.expire).not.toHaveBeenCalled();
		});

		it('should throw WsException when rate limit exceeded', async () => {
			mockRedis.incr.mockResolvedValue(101);

			await expect(guard.canActivate(mockContext)).rejects.toThrow(WsException);
		});

		it('should use socket ID when no user ID available', async () => {
			mockSocket.clerkId = undefined;
			mockSocket.userId = undefined;
			mockRedis.incr.mockResolvedValue(1);
			mockRedis.expire.mockResolvedValue(1);

			await guard.canActivate(mockContext);

			expect(mockRedis.incr).toHaveBeenCalledWith('ws_rate_limit:test-socket-id');
		});

		it('should allow access on Redis error', async () => {
			mockRedis.incr.mockRejectedValue(new Error('Redis error'));

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(true);
		});

		it('should re-throw WsException on Redis error', async () => {
			mockRedis.incr.mockRejectedValue(
				new WsException(new AppError('RATE_LIMIT_EXCEEDED', ErrorCodes.RATE_LIMIT_EXCEEDED)),
			);

			await expect(guard.canActivate(mockContext)).rejects.toThrow(WsException);
		});
	});
});
