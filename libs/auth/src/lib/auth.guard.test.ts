import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@app/errors';
import { AuthGuard } from './auth.guard';

// Mock dependencies
vi.mock('@nestjs-modules/ioredis', () => ({
	InjectRedis: () => vi.fn(),
}));

describe('AuthGuard', () => {
	let authGuard: AuthGuard;
	let mockClerkService: any;
	let mockPrismaService: any;
	let mockRedis: any;
	let mockExecutionContext: any;

	beforeEach(() => {
		mockClerkService = {
			verifyToken: vi.fn(),
		} as any;

		mockPrismaService = {
			db: {
				user: {
					findFirst: vi.fn(),
				},
			},
		} as any;

		mockRedis = {
			get: vi.fn(),
			set: vi.fn(),
		} as any;

		authGuard = new AuthGuard(mockClerkService, mockPrismaService, mockRedis);

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
		it('should throw AppError when no authorization header is present', async () => {
			const request = {
				headers: {},
			};

			mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);

			await expect(authGuard.canActivate(mockExecutionContext)).rejects.toThrow(AppError);
			await expect(authGuard.canActivate(mockExecutionContext)).rejects.toMatchObject({
				code: 'UNAUTHORIZED',
				type: 'AUTHENTICATION',
			});
		});

		it('should throw AppError when authorization header is malformed', async () => {
			const request = {
				headers: {
					authorization: 'InvalidFormat',
				},
			};

			mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);

			await expect(authGuard.canActivate(mockExecutionContext)).rejects.toThrow(AppError);
			await expect(authGuard.canActivate(mockExecutionContext)).rejects.toMatchObject({
				code: 'UNAUTHORIZED',
				type: 'AUTHENTICATION',
			});
		});

		it('should throw AppError when token is empty', async () => {
			const request = {
				headers: {
					authorization: 'Bearer ',
				},
			};

			mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);

			await expect(authGuard.canActivate(mockExecutionContext)).rejects.toThrow(AppError);
			await expect(authGuard.canActivate(mockExecutionContext)).rejects.toMatchObject({
				code: 'UNAUTHORIZED',
				type: 'AUTHENTICATION',
			});
		});

		it('should return true and set userId when valid token and cached user exist', async () => {
			const token = 'valid-token';
			const clerkUserId = 'clerk-user-123';
			const internalUserId = 'internal-user-456';

			const request = {
				headers: {
					authorization: `Bearer ${token}`,
				},
				userId: undefined,
			};

			mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
			mockClerkService.verifyToken.mockResolvedValue({ sub: clerkUserId });
			mockRedis.get.mockResolvedValue(internalUserId);

			const result = await authGuard.canActivate(mockExecutionContext);

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

			mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
			mockClerkService.verifyToken.mockResolvedValue({ sub: clerkUserId });
			mockRedis.get.mockResolvedValue(null);
			mockPrismaService.db.user.findFirst.mockResolvedValue({
				id: internalUserId,
			});
			mockRedis.set.mockResolvedValue('OK');

			const result = await authGuard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(request.userId).toBe(internalUserId);
			expect(mockClerkService.verifyToken).toHaveBeenCalledWith(token);
			expect(mockRedis.get).toHaveBeenCalledWith(`user:${clerkUserId}`);
			expect(mockPrismaService.db.user.findFirst).toHaveBeenCalledWith({
				select: { id: true },
				where: { clerkId: clerkUserId },
			});
			expect(mockRedis.set).toHaveBeenCalledWith(`user:${clerkUserId}`, internalUserId, 'EX', 3600);
		});

		it('should throw AppError when user not found in database', async () => {
			const token = 'valid-token';
			const clerkUserId = 'clerk-user-123';

			const request = {
				headers: {
					authorization: `Bearer ${token}`,
				},
			};

			mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
			mockClerkService.verifyToken.mockResolvedValue({ sub: clerkUserId });
			mockRedis.get.mockResolvedValue(null);
			mockPrismaService.db.user.findFirst.mockResolvedValue(null);

			await expect(authGuard.canActivate(mockExecutionContext)).rejects.toThrow(AppError);
			await expect(authGuard.canActivate(mockExecutionContext)).rejects.toMatchObject({
				code: 'UNAUTHORIZED',
				type: 'AUTHENTICATION',
			});
		});

		it('should throw AppError when ClerkService throws an error', async () => {
			const token = 'invalid-token';

			const request = {
				headers: {
					authorization: `Bearer ${token}`,
				},
			};

			mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
			mockClerkService.verifyToken.mockRejectedValue(new Error('Invalid token'));

			await expect(authGuard.canActivate(mockExecutionContext)).rejects.toThrow(AppError);
			await expect(authGuard.canActivate(mockExecutionContext)).rejects.toMatchObject({
				code: 'UNAUTHORIZED',
				type: 'AUTHENTICATION',
			});
		});

		it('should throw AppError when database query throws an error', async () => {
			const token = 'valid-token';
			const clerkUserId = 'clerk-user-123';

			const request = {
				headers: {
					authorization: `Bearer ${token}`,
				},
			};

			mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
			mockClerkService.verifyToken.mockResolvedValue({ sub: clerkUserId });
			mockRedis.get.mockResolvedValue(null);
			mockPrismaService.db.user.findFirst.mockRejectedValue(new Error('Database error'));

			await expect(authGuard.canActivate(mockExecutionContext)).rejects.toThrow(AppError);
			await expect(authGuard.canActivate(mockExecutionContext)).rejects.toMatchObject({
				code: 'UNAUTHORIZED',
				type: 'AUTHENTICATION',
			});
		});

		it('should handle Redis errors gracefully', async () => {
			const token = 'valid-token';
			const clerkUserId = 'clerk-user-123';

			const request = {
				headers: {
					authorization: `Bearer ${token}`,
				},
				userId: undefined,
			};

			mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
			mockClerkService.verifyToken.mockResolvedValue({ sub: clerkUserId });
			mockRedis.get.mockRejectedValue(new Error('Redis error'));

			await expect(authGuard.canActivate(mockExecutionContext)).rejects.toThrow(AppError);
			await expect(authGuard.canActivate(mockExecutionContext)).rejects.toMatchObject({
				code: 'UNAUTHORIZED',
				type: 'AUTHENTICATION',
			});
		});

		it('should handle Redis set errors gracefully', async () => {
			const token = 'valid-token';
			const clerkUserId = 'clerk-user-123';
			const internalUserId = 'internal-user-456';

			const request = {
				headers: {
					authorization: `Bearer ${token}`,
				},
				userId: undefined,
			};

			mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
			mockClerkService.verifyToken.mockResolvedValue({ sub: clerkUserId });
			mockRedis.get.mockResolvedValue(null);
			mockPrismaService.db.user.findFirst.mockResolvedValue({
				id: internalUserId,
			});
			mockRedis.set.mockRejectedValue(new Error('Redis set error'));

			await expect(authGuard.canActivate(mockExecutionContext)).rejects.toThrow(AppError);
			await expect(authGuard.canActivate(mockExecutionContext)).rejects.toMatchObject({
				code: 'UNAUTHORIZED',
				type: 'AUTHENTICATION',
			});
		});
	});
});
