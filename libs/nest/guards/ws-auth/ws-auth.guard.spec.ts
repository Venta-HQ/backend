import { AppError, ErrorCodes } from '@app/nest/errors';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { vi } from 'vitest';
import { WsAuthGuard } from './ws-auth.guard';

describe('WsAuthGuard', () => {
	let guard: WsAuthGuard;
	let mockContext: ExecutionContext;
	let mockSocket: Partial<Socket>;
	let mockPrisma: any;

	beforeEach(() => {
		mockPrisma = {
			db: {
				user: {
					findFirst: vi.fn(),
				},
			},
		};
		guard = new WsAuthGuard(mockPrisma);

		mockSocket = {
			id: 'test-socket-id',
			handshake: {
				auth: {},
				query: {},
				headers: {},
			},
		};

		mockContext = {
			switchToWs: () => ({
				getClient: () => mockSocket,
			}),
		} as ExecutionContext;
	});

	describe('canActivate', () => {
		it('should allow access with valid token in auth', async () => {
			const userData = { id: 'user-1', clerkId: 'clerk-123' };
			mockPrisma.db.user.findFirst.mockResolvedValue(userData);

			mockSocket.handshake = {
				auth: { token: 'clerk-123' },
				query: {},
				headers: {},
			};

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(true);
			expect(mockSocket.clerkId).toBe('clerk-123');
			expect(mockSocket.userId).toBe('user-1');
		});

		it('should allow access with valid token in query params', async () => {
			const userData = { id: 'user-1', clerkId: 'clerk-123' };
			mockPrisma.db.user.findFirst.mockResolvedValue(userData);

			mockSocket.handshake = {
				auth: {},
				query: { token: 'clerk-123' },
				headers: {},
			};

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(true);
			expect(mockSocket.clerkId).toBe('clerk-123');
			expect(mockSocket.userId).toBe('user-1');
		});

		it('should allow access with valid token in authorization header', async () => {
			const userData = { id: 'user-1', clerkId: 'clerk-123' };
			mockPrisma.db.user.findFirst.mockResolvedValue(userData);

			mockSocket.handshake = {
				auth: {},
				query: {},
				headers: { authorization: 'Bearer clerk-123' },
			};

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(true);
			expect(mockSocket.clerkId).toBe('clerk-123');
			expect(mockSocket.userId).toBe('user-1');
		});

		it('should throw WsException when no token provided', async () => {
			await expect(guard.canActivate(mockContext)).rejects.toThrow(WsException);
		});

		it('should throw WsException when token is invalid', async () => {
			mockPrisma.db.user.findFirst.mockResolvedValue(null);

			mockSocket.handshake = {
				auth: { token: 'invalid-token' },
				query: {},
				headers: {},
			};

			await expect(guard.canActivate(mockContext)).rejects.toThrow(WsException);
		});

		it('should throw WsException when user not found in database', async () => {
			mockPrisma.db.user.findFirst.mockResolvedValue(null);

			mockSocket.handshake = {
				auth: { token: 'clerk-123' },
				query: {},
				headers: {},
			};

			await expect(guard.canActivate(mockContext)).rejects.toThrow(WsException);
		});

		it('should handle database errors gracefully', async () => {
			mockPrisma.db.user.findFirst.mockRejectedValue(new Error('Database error'));

			mockSocket.handshake = {
				auth: { token: 'clerk-123' },
				query: {},
				headers: {},
			};

			await expect(guard.canActivate(mockContext)).rejects.toThrow(WsException);
		});
	});
});
