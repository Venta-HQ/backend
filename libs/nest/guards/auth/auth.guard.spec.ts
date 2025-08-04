import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { AppError } from '../../errors/app-error';
import { AuthGuard } from './auth.guard';

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

		// Create guard with mocked dependencies
		guard = new AuthGuard(mockClerkService, mockPrismaService, mockRedis);

		const mockGetRequest = vi.fn().mockReturnValue({
			headers: {},
		});

		mockExecutionContext = {
			switchToHttp: vi.fn().mockReturnValue({
				getRequest: mockGetRequest,
			}),
		} as any;
	});

	describe('canActivate', () => {
		it('should throw error when no authorization header is present', async () => {
			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(AppError);
		});

		it('should throw error when authorization header is malformed', async () => {
			const mockGetRequest = vi.fn().mockReturnValue({
				headers: {
					authorization: 'InvalidFormat',
				},
			});

			mockExecutionContext.switchToHttp = vi.fn().mockReturnValue({
				getRequest: mockGetRequest,
			});

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(AppError);
		});

		it('should throw error when token is missing from authorization header', async () => {
			const mockGetRequest = vi.fn().mockReturnValue({
				headers: {
					authorization: 'Bearer ',
				},
			});

			mockExecutionContext.switchToHttp = vi.fn().mockReturnValue({
				getRequest: mockGetRequest,
			});

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(AppError);
		});

		it('should return true when valid token is provided and user exists in cache', async () => {
			const token = 'valid-token';

			const mockGetRequest = vi.fn().mockReturnValue({
				headers: {
					authorization: `Bearer ${token}`,
				},
			});

			mockExecutionContext.switchToHttp = vi.fn().mockReturnValue({
				getRequest: mockGetRequest,
			});

			mockClerkService.verifyToken.mockResolvedValue({ sub: 'clerk-user-123' });
			mockRedis.get.mockResolvedValue('internal-user-456');

			const result = await guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(mockClerkService.verifyToken).toHaveBeenCalledWith(token);
			expect(mockRedis.get).toHaveBeenCalledWith(`user:clerk-user-123`);
		});

		it('should fetch user from database and cache when not in cache', async () => {
			const mockUser = { id: 'internal-user-456' };
			const token = 'valid-token';

			const mockGetRequest = vi.fn().mockReturnValue({
				headers: {
					authorization: `Bearer ${token}`,
				},
			});

			mockExecutionContext.switchToHttp = vi.fn().mockReturnValue({
				getRequest: mockGetRequest,
			});

			mockClerkService.verifyToken.mockResolvedValue({ sub: 'clerk-user-123' });
			mockRedis.get.mockResolvedValue(null);
			mockPrismaService.db.user.findFirst.mockResolvedValue(mockUser);
			mockRedis.set.mockResolvedValue('OK');

			const result = await guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(mockPrismaService.db.user.findFirst).toHaveBeenCalledWith({
				select: { id: true },
				where: { clerkId: 'clerk-user-123' },
			});
			expect(mockRedis.set).toHaveBeenCalledWith(`user:clerk-user-123`, 'internal-user-456', 'EX', 3600);
		});

		it('should throw error when user is not found in database', async () => {
			const token = 'valid-token';

			const mockGetRequest = vi.fn().mockReturnValue({
				headers: {
					authorization: `Bearer ${token}`,
				},
			});

			mockExecutionContext.switchToHttp = vi.fn().mockReturnValue({
				getRequest: mockGetRequest,
			});

			mockClerkService.verifyToken.mockResolvedValue({ sub: 'clerk-user-123' });
			mockRedis.get.mockResolvedValue(null);
			mockPrismaService.db.user.findFirst.mockResolvedValue(null);

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(AppError);
		});

		it('should throw error when Clerk token verification fails', async () => {
			const token = 'invalid-token';

			const mockGetRequest = vi.fn().mockReturnValue({
				headers: {
					authorization: `Bearer ${token}`,
				},
			});

			mockExecutionContext.switchToHttp = vi.fn().mockReturnValue({
				getRequest: mockGetRequest,
			});

			mockClerkService.verifyToken.mockRejectedValue(new Error('Invalid token'));

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(AppError);
		});

		it('should handle database errors gracefully', async () => {
			const token = 'valid-token';

			const mockGetRequest = vi.fn().mockReturnValue({
				headers: {
					authorization: `Bearer ${token}`,
				},
			});

			mockExecutionContext.switchToHttp = vi.fn().mockReturnValue({
				getRequest: mockGetRequest,
			});

			mockClerkService.verifyToken.mockResolvedValue({ sub: 'clerk-user-123' });
			mockRedis.get.mockResolvedValue(null);
			mockPrismaService.db.user.findFirst.mockRejectedValue(new Error('Database connection failed'));

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(AppError);
		});

		it('should handle Redis errors gracefully', async () => {
			const token = 'valid-token';

			const mockGetRequest = vi.fn().mockReturnValue({
				headers: {
					authorization: `Bearer ${token}`,
				},
			});

			mockExecutionContext.switchToHttp = vi.fn().mockReturnValue({
				getRequest: mockGetRequest,
			});

			mockClerkService.verifyToken.mockResolvedValue({ sub: 'clerk-user-123' });
			mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(AppError);
		});
	});
});
