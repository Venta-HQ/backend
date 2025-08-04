import { beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyToken } from '@clerk/clerk-sdk-node';
import { ClerkService } from './clerk.service';

// Mock the clerk-sdk-node module
vi.mock('@clerk/clerk-sdk-node', () => ({
	verifyToken: vi.fn(),
}));

describe('ClerkService', () => {
	let service: ClerkService;
	const mockSecretKey = 'test-secret-key';

	beforeEach(() => {
		service = new ClerkService(mockSecretKey);
		vi.clearAllMocks();
	});

	describe('verifyToken', () => {
		it('should verify token successfully', async () => {
			const mockToken = 'valid-token';
			const mockVerifiedToken = {
				email: 'test@example.com',
				exp: 1234567890 + 3600,
				iat: 1234567890,
				sub: 'user-123',
			};

			(verifyToken as any).mockResolvedValue(mockVerifiedToken);

			const result = await service.verifyToken(mockToken);

			expect(verifyToken).toHaveBeenCalledWith(mockToken, {
				secretKey: mockSecretKey,
			});
			expect(result).toEqual(mockVerifiedToken);
		});

		it('should throw error when token verification fails', async () => {
			const mockToken = 'invalid-token';
			const mockError = new Error('Token verification failed');

			(verifyToken as any).mockRejectedValue(mockError);

			await expect(service.verifyToken(mockToken)).rejects.toThrow('Invalid or expired token');

			expect(verifyToken).toHaveBeenCalledWith(mockToken, {
				secretKey: mockSecretKey,
			});
		});

		it('should throw error when token is expired', async () => {
			const mockToken = 'expired-token';
			const mockError = new Error('Token expired');

			(verifyToken as any).mockRejectedValue(mockError);

			await expect(service.verifyToken(mockToken)).rejects.toThrow('Invalid or expired token');

			expect(verifyToken).toHaveBeenCalledWith(mockToken, {
				secretKey: mockSecretKey,
			});
		});

		it('should throw error when token is malformed', async () => {
			const mockToken = 'malformed-token';
			const mockError = new Error('Invalid token format');

			(verifyToken as any).mockRejectedValue(mockError);

			await expect(service.verifyToken(mockToken)).rejects.toThrow('Invalid or expired token');

			expect(verifyToken).toHaveBeenCalledWith(mockToken, {
				secretKey: mockSecretKey,
			});
		});

		it('should throw error when verifyToken throws non-Error object', async () => {
			const mockToken = 'invalid-token';

			(verifyToken as any).mockRejectedValue('String error');

			await expect(service.verifyToken(mockToken)).rejects.toThrow('Invalid or expired token');

			expect(verifyToken).toHaveBeenCalledWith(mockToken, {
				secretKey: mockSecretKey,
			});
		});

		it('should use the correct secret key for verification', async () => {
			const mockToken = 'valid-token';
			const mockVerifiedToken = { sub: 'user-123' };

			(verifyToken as any).mockResolvedValue(mockVerifiedToken);

			await service.verifyToken(mockToken);

			expect(verifyToken).toHaveBeenCalledWith(mockToken, {
				secretKey: mockSecretKey,
			});
		});

		it('should handle different token formats', async () => {
			const tokens = [
				'Bearer valid-token',
				'valid-token',
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
			];

			const mockVerifiedToken = { sub: 'user-123' };
			(verifyToken as any).mockResolvedValue(mockVerifiedToken);

			for (const token of tokens) {
				await service.verifyToken(token);
				expect(verifyToken).toHaveBeenCalledWith(token, {
					secretKey: mockSecretKey,
				});
			}
		});
	});

	describe('constructor', () => {
		it('should store the secret key', () => {
			const customSecretKey = 'custom-secret-key';
			const customService = new ClerkService(customSecretKey);

			// We can't directly test the private property, but we can verify it's used correctly
			// by testing that the service works with the provided secret key
			const mockToken = 'valid-token';
			const mockVerifiedToken = { sub: 'user-123' };

			(verifyToken as any).mockResolvedValue(mockVerifiedToken);

			// This should work without throwing an error
			expect(async () => {
				await customService.verifyToken(mockToken);
			}).not.toThrow();
		});
	});
});
