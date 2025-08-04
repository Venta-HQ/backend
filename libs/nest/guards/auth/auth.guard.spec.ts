import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { ClerkService } from '@app/nest/modules';
import { PrismaService } from '@app/nest/modules';
import { AppError } from '@app/nest/errors';
import { ErrorCodes } from '@app/nest/errors';

// Mock Redis
vi.mock('ioredis', () => ({
	default: vi.fn().mockImplementation(() => ({
		get: vi.fn(),
		set: vi.fn(),
	})),
}));

describe('AuthGuard', () => {
	let guard: AuthGuard;
	let mockClerkService: any;
	let mockPrismaService: any;
	let mockRedis: any;
	let mockExecutionContext: ExecutionContext;

	beforeEach(() => {
		mockClerkService = {
			verifyToken: vi.fn(),
		};

		mockPrismaService = {
			db: {
				user: {
					findFirst: vi.fn(),
				},
			},
		};

		mockRedis = {
			get: vi.fn(),
			set: vi.fn(),
		};

		guard = new AuthGuard(mockClerkService, mockPrismaService, mockRedis);

		mockExecutionContext = {
			switchToHttp: vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue({
					headers: {},
					userId: undefined,
				}),
			}),
		} as any;
	});

	describe('canActivate', () => {
		it('should throw error when no authorization header is present', async () => {
			const request = {
				headers: {},
			};
			mockExecutionContext.switchToHttp = vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue(request),
			});

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
				AppError.authentication(ErrorCodes.UNAUTHORIZED)
			);
		});

		it('should throw error when authorization header is malformed', async () => {
			const request = {
				headers: {
					authorization: 'InvalidFormat',
				},
			};
			mockExecutionContext.switchToHttp = vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue(request),
			});

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
				AppError.authentication(ErrorCodes.UNAUTHORIZED)
			);
		});

		it('should throw error when token is missing from authorization header', async () => {
			const request = {
				headers: {
					authorization: 'Bearer ',
				},
			};
			mockExecutionContext.switchToHttp = vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue(request),
			});

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
				AppError.authentication(ErrorCodes.UNAUTHORIZED)
			);
		});

		it('should return true when valid token is provided and user exists in cache', async () => {
			const token = 'valid-token';
			const clerkUserId = 'clerk-user-123';
			const internalUserId = 'internal-user-456';

			const request = {
				headers: {
					authorization: `Bearer ${token}`,
				},
				userId: undefined,
			};

			mockExecutionContext.switchToHttp = vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue(request),
			});

			mockClerkService.verifyToken.mockResolvedValue({
				sub: clerkUserId,
			});

			mockRedis.get.mockResolvedValue(internalUserId);

			const result = await guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(request.userId).toBe(internalUserId);
			expect(mockClerkService.verifyToken).toHaveBeenCalledWith(token);
			expect(mockRedis.get).toHaveBeenCalledWith(`user:${clerkUserId}`);
			expect(mockPrismaService.db.user.findFirst).not.toHaveBeenCalled();
		});

		it('should fetch user from database and cache when not in cache', async () => {
			const token = 'valid-token';
			const clerkUserId = 'clerk-user-123';
			const internalUserId = 'internal-user-456';

			const request = {
				headers: {
					authorization: `Bearer ${token}`,
				},
				userId: undefined,
			};

			mockExecutionContext.switchToHttp = vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue(request),
			});

			mockClerkService.verifyToken.mockResolvedValue({
				sub: clerkUserId,
			});

			mockRedis.get.mockResolvedValue(null);
			mockPrismaService.db.user.findFirst.mockResolvedValue({
				id: internalUserId,
			});
			mockRedis.set.mockResolvedValue('OK');

			const result = await guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(request.userId).toBe(internalUserId);
			expect(mockClerkService.verifyToken).toHaveBeenCalledWith(token);
			expect(mockRedis.get).toHaveBeenCalledWith(`user:${clerkUserId}`);
			expect(mockPrismaService.db.user.findFirst).toHaveBeenCalledWith({
				select: { id: true },
				where: { clerkId: clerkUserId },
			});
			expect(mockRedis.set).toHaveBeenCalledWith(
				`user:${clerkUserId}`,
				internalUserId,
				'EX',
				3600
			);
		});

		it('should throw error when user is not found in database', async () => {
			const token = 'valid-token';
			const clerkUserId = 'clerk-user-123';

			const request = {
				headers: {
					authorization: `Bearer ${token}`,
				},
			};

			mockExecutionContext.switchToHttp = vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue(request),
			});

			mockClerkService.verifyToken.mockResolvedValue({
				sub: clerkUserId,
			});

			mockRedis.get.mockResolvedValue(null);
			mockPrismaService.db.user.findFirst.mockResolvedValue(null);

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
				AppError.authentication(ErrorCodes.UNAUTHORIZED)
			);
		});

		it('should throw error when Clerk token verification fails', async () => {
			const token = 'invalid-token';

			const request = {
				headers: {
					authorization: `Bearer ${token}`,
				},
			};

			mockExecutionContext.switchToHttp = vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue(request),
			});

			mockClerkService.verifyToken.mockRejectedValue(new Error('Invalid token'));

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
				AppError.authentication(ErrorCodes.UNAUTHORIZED)
			);
		});

		it('should handle database errors gracefully', async () => {
			const token = 'valid-token';
			const clerkUserId = 'clerk-user-123';

			const request = {
				headers: {
					authorization: `Bearer ${token}`,
				},
			};

			mockExecutionContext.switchToHttp = vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue(request),
			});

			mockClerkService.verifyToken.mockResolvedValue({
				sub: clerkUserId,
			});

			mockRedis.get.mockResolvedValue(null);
			mockPrismaService.db.user.findFirst.mockRejectedValue(
				new Error('Database connection failed')
			);

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
				AppError.authentication(ErrorCodes.UNAUTHORIZED)
			);
		});

		it('should handle Redis errors gracefully', async () => {
			const token = 'valid-token';
			const clerkUserId = 'clerk-user-123';
			const internalUserId = 'internal-user-456';

			const request = {
				headers: {
					authorization: `Bearer ${token}`,
				},
				userId: undefined,
			};

			mockExecutionContext.switchToHttp = vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue(request),
			});

			mockClerkService.verifyToken.mockResolvedValue({
				sub: clerkUserId,
			});

			mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));
			mockPrismaService.db.user.findFirst.mockResolvedValue({
				id: internalUserId,
			});

			const result = await guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(request.userId).toBe(internalUserId);
			expect(mockPrismaService.db.user.findFirst).toHaveBeenCalled();
		});
	});
}); 