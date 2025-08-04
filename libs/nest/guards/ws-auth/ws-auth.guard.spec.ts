import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WsError } from '@app/nest/errors';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClerkService } from '../../modules/clerk';
import { PrismaService } from '../../modules/prisma';
import { WsAuthGuard } from './ws-auth.guard';

// Mock Redis
const mockRedis = {
	get: vi.fn(),
	set: vi.fn(),
};

// Mock ClerkService
const mockClerkService = {
	verifyToken: vi.fn(),
};

// Mock PrismaService
const mockPrismaService = {
	db: {
		user: {
			findFirst: vi.fn(),
		},
	},
};

describe('WsAuthGuard', () => {
	let guard: WsAuthGuard;
	let module: TestingModule;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				WsAuthGuard,
				{
					provide: 'default_IORedisModuleConnectionToken',
					useValue: mockRedis,
				},
				{
					provide: ClerkService,
					useValue: mockClerkService,
				},
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
			],
		}).compile();

		guard = module.get<WsAuthGuard>(WsAuthGuard);

		// Ensure the guard has access to the mocked services
		(guard as any).clerkService = mockClerkService;
		(guard as any).prisma = mockPrismaService;
		(guard as any).redis = mockRedis;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('canActivate', () => {
		it('should allow access with valid token from handshake auth', async () => {
			const mockClient = {
				clerkId: undefined,
				handshake: {
					auth: {
						token: 'valid-jwt-token',
					},
				},
				userId: undefined,
			};

			const mockContext = {
				switchToWs: () => ({
					getClient: () => mockClient,
					getData: () => ({}),
				}),
			} as ExecutionContext;

			mockClerkService.verifyToken.mockResolvedValue({
				sub: 'clerk-user-id',
			});

			mockRedis.get.mockResolvedValue('internal-user-id');

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(true);
			expect(mockClient.userId).toBe('internal-user-id');
			expect(mockClient.clerkId).toBe('clerk-user-id');
		});

		it('should allow access with valid token from query parameters', async () => {
			const mockClient = {
				clerkId: undefined,
				handshake: {
					query: {
						token: 'valid-jwt-token',
					},
				},
				userId: undefined,
			};

			const mockContext = {
				switchToWs: () => ({
					getClient: () => mockClient,
					getData: () => ({}),
				}),
			} as ExecutionContext;

			mockClerkService.verifyToken.mockResolvedValue({
				sub: 'clerk-user-id',
			});

			mockRedis.get.mockResolvedValue('internal-user-id');

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(true);
			expect(mockClient.userId).toBe('internal-user-id');
			expect(mockClient.clerkId).toBe('clerk-user-id');
		});

		it('should allow access with valid token from headers', async () => {
			const mockClient = {
				clerkId: undefined,
				handshake: {
					headers: {
						authorization: 'Bearer valid-jwt-token',
					},
				},
				userId: undefined,
			};

			const mockContext = {
				switchToWs: () => ({
					getClient: () => mockClient,
					getData: () => ({}),
				}),
			} as ExecutionContext;

			mockClerkService.verifyToken.mockResolvedValue({
				sub: 'clerk-user-id',
			});

			mockRedis.get.mockResolvedValue('internal-user-id');

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(true);
			expect(mockClient.userId).toBe('internal-user-id');
			expect(mockClient.clerkId).toBe('clerk-user-id');
		});

		it('should fetch user from database when not cached', async () => {
			const mockClient = {
				clerkId: undefined,
				handshake: {
					auth: {
						token: 'valid-jwt-token',
					},
				},
				userId: undefined,
			};

			const mockContext = {
				switchToWs: () => ({
					getClient: () => mockClient,
					getData: () => ({}),
				}),
			} as ExecutionContext;

			mockClerkService.verifyToken.mockResolvedValue({
				sub: 'clerk-user-id',
			});

			mockRedis.get.mockResolvedValue(null);

			mockPrismaService.db.user.findFirst.mockResolvedValue({
				id: 'internal-user-id',
			});

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(true);
			expect(mockClient.userId).toBe('internal-user-id');
			expect(mockClient.clerkId).toBe('clerk-user-id');
			expect(mockPrismaService.db.user.findFirst).toHaveBeenCalledWith({
				select: { id: true },
				where: { clerkId: 'clerk-user-id' },
			});
			expect(mockRedis.set).toHaveBeenCalledWith('user:clerk-user-id', 'internal-user-id', 'EX', 3600);
		});

		it('should throw WsError when no token provided', async () => {
			const mockClient = {
				clerkId: undefined,
				handshake: {},
				userId: undefined,
			};

			const mockContext = {
				switchToWs: () => ({
					getClient: () => mockClient,
					getData: () => ({}),
				}),
			} as ExecutionContext;

			await expect(guard.canActivate(mockContext)).rejects.toThrow(WsError);
		});

		it('should throw WsError when token is invalid', async () => {
			const mockClient = {
				clerkId: undefined,
				handshake: {
					auth: {
						token: 'invalid-token',
					},
				},
				userId: undefined,
			};

			const mockContext = {
				switchToWs: () => ({
					getClient: () => mockClient,
					getData: () => ({}),
				}),
			} as ExecutionContext;

			mockClerkService.verifyToken.mockRejectedValue(new Error('Invalid token'));

			await expect(guard.canActivate(mockContext)).rejects.toThrow(WsError);
		});

		it('should throw WsError when user not found in database', async () => {
			const mockClient = {
				clerkId: undefined,
				handshake: {
					auth: {
						token: 'valid-jwt-token',
					},
				},
				userId: undefined,
			};

			const mockContext = {
				switchToWs: () => ({
					getClient: () => mockClient,
					getData: () => ({}),
				}),
			} as ExecutionContext;

			mockClerkService.verifyToken.mockResolvedValue({
				sub: 'clerk-user-id',
			});

			mockRedis.get.mockResolvedValue(null);
			mockPrismaService.db.user.findFirst.mockResolvedValue(null);

			await expect(guard.canActivate(mockContext)).rejects.toThrow(WsError);
		});

		it('should handle Redis errors gracefully', async () => {
			const mockClient = {
				clerkId: undefined,
				handshake: {
					auth: {
						token: 'valid-jwt-token',
					},
				},
				userId: undefined,
			};

			const mockContext = {
				switchToWs: () => ({
					getClient: () => mockClient,
					getData: () => ({}),
				}),
			} as ExecutionContext;

			mockClerkService.verifyToken.mockResolvedValue({
				sub: 'clerk-user-id',
			});

			mockRedis.get.mockRejectedValue(new Error('Redis error'));

			await expect(guard.canActivate(mockContext)).rejects.toThrow(WsError);
		});
	});

	describe('extractToken', () => {
		it('should extract token from handshake auth', () => {
			const mockClient = {
				handshake: {
					auth: {
						token: 'test-token',
					},
				},
			};

			const result = (guard as any).extractToken(mockClient);
			expect(result).toBe('test-token');
		});

		it('should extract token from query parameters', () => {
			const mockClient = {
				handshake: {
					query: {
						token: 'test-token',
					},
				},
			};

			const result = (guard as any).extractToken(mockClient);
			expect(result).toBe('test-token');
		});

		it('should extract token from authorization header', () => {
			const mockClient = {
				handshake: {
					headers: {
						authorization: 'Bearer test-token',
					},
				},
			};

			const result = (guard as any).extractToken(mockClient);
			expect(result).toBe('test-token');
		});

		it('should return null when no token found', () => {
			const mockClient = {
				handshake: {},
			};

			const result = (guard as any).extractToken(mockClient);
			expect(result).toBeNull();
		});
	});
});
