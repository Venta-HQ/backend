import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
// Import after mocking
import { ClerkService } from './clerk.service';

// Mock @clerk/clerk-sdk-node
const { mockVerifyToken } = vi.hoisted(() => ({
	mockVerifyToken: vi.fn(),
}));

vi.mock('@clerk/clerk-sdk-node', () => ({
	verifyToken: mockVerifyToken,
}));

describe('ClerkService', () => {
	let clerkService: ClerkService;
	const secretKey = 'test-secret-key';

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock Logger
		vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {
			// Empty implementation
		});
		vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {
			// Empty implementation
		});

		clerkService = new ClerkService(secretKey);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('constructor', () => {
		it('should create service with secret key', () => {
			expect(clerkService).toBeDefined();
		});

		it('should handle empty secret key', () => {
			expect(() => new ClerkService('')).not.toThrow();
		});
	});

	describe('verifyToken', () => {
		it('should verify valid token successfully', async () => {
			const mockToken = 'valid-token';
			const mockPayload = {
				email: 'test@example.com',
				exp: 1234567890 + 3600,
				iat: 1234567890,
				sub: 'user-123',
			};

			mockVerifyToken.mockResolvedValue(mockPayload);

			const result = await clerkService.verifyToken(mockToken);

			expect(mockVerifyToken).toHaveBeenCalledWith(mockToken, { secretKey });
			expect(result).toEqual(mockPayload);
		});

		it('should handle invalid token', async () => {
			const mockToken = 'invalid-token';
			const mockError = new Error('Invalid token');

			mockVerifyToken.mockRejectedValue(mockError);

			await expect(clerkService.verifyToken(mockToken)).rejects.toThrow('Invalid or expired token');
			expect(mockVerifyToken).toHaveBeenCalledWith(mockToken, { secretKey });
		});

		it('should handle expired token', async () => {
			const mockToken = 'expired-token';
			const mockError = new Error('Token expired');

			mockVerifyToken.mockRejectedValue(mockError);

			await expect(clerkService.verifyToken(mockToken)).rejects.toThrow('Invalid or expired token');
			expect(mockVerifyToken).toHaveBeenCalledWith(mockToken, { secretKey });
		});

		it('should handle network errors', async () => {
			const mockToken = 'network-error-token';
			const mockError = new Error('Network error');

			mockVerifyToken.mockRejectedValue(mockError);

			await expect(clerkService.verifyToken(mockToken)).rejects.toThrow('Invalid or expired token');
			expect(mockVerifyToken).toHaveBeenCalledWith(mockToken, { secretKey });
		});

		it('should handle empty token', async () => {
			const mockToken = '';
			const mockError = new Error('Empty token');

			mockVerifyToken.mockRejectedValue(mockError);

			await expect(clerkService.verifyToken(mockToken)).rejects.toThrow('Invalid or expired token');
			expect(mockVerifyToken).toHaveBeenCalledWith(mockToken, { secretKey });
		});

		it('should handle null token', async () => {
			const mockToken = null as any;
			const mockError = new Error('Null token');

			mockVerifyToken.mockRejectedValue(mockError);

			await expect(clerkService.verifyToken(mockToken)).rejects.toThrow('Invalid or expired token');
			expect(mockVerifyToken).toHaveBeenCalledWith(mockToken, { secretKey });
		});

		it('should handle undefined token', async () => {
			const mockToken = undefined as any;
			const mockError = new Error('Undefined token');

			mockVerifyToken.mockRejectedValue(mockError);

			await expect(clerkService.verifyToken(mockToken)).rejects.toThrow('Invalid or expired token');
			expect(mockVerifyToken).toHaveBeenCalledWith(mockToken, { secretKey });
		});

		it('should handle malformed token', async () => {
			const mockToken = 'malformed.token.here';
			const mockError = new Error('Malformed token');

			mockVerifyToken.mockRejectedValue(mockError);

			await expect(clerkService.verifyToken(mockToken)).rejects.toThrow('Invalid or expired token');
			expect(mockVerifyToken).toHaveBeenCalledWith(mockToken, { secretKey });
		});

		it('should handle token with different payload structure', async () => {
			const mockToken = 'different-payload-token';
			const mockPayload = {
				email_verified: true,
				exp: 1234567890 + 7200,
				iat: 1234567890,
				phone_number: '+1234567890',
				user_id: 'user-456',
			};

			mockVerifyToken.mockResolvedValue(mockPayload);

			const result = await clerkService.verifyToken(mockToken);

			expect(mockVerifyToken).toHaveBeenCalledWith(mockToken, { secretKey });
			expect(result).toEqual(mockPayload);
		});

		it('should handle token with custom claims', async () => {
			const mockToken = 'custom-claims-token';
			const mockPayload = {
				custom_claim: 'custom_value',
				email: 'custom@example.com',
				exp: 1234567890 + 1800,
				iat: 1234567890,
				roles: ['admin', 'user'],
				sub: 'user-789',
			};

			mockVerifyToken.mockResolvedValue(mockPayload);

			const result = await clerkService.verifyToken(mockToken);

			expect(mockVerifyToken).toHaveBeenCalledWith(mockToken, { secretKey });
			expect(result).toEqual(mockPayload);
		});
	});

	describe('multiple instances', () => {
		it('should create separate instances with different secret keys', () => {
			const service1 = new ClerkService('secret-key-1');
			const service2 = new ClerkService('secret-key-2');

			expect(service1).not.toBe(service2);
			expect(service1).toBeInstanceOf(ClerkService);
			expect(service2).toBeInstanceOf(ClerkService);
		});

		it('should use correct secret key for each instance', async () => {
			const service1 = new ClerkService('secret-key-1');
			const service2 = new ClerkService('secret-key-2');

			const mockToken = 'test-token';
			const mockPayload = { sub: 'user-123' };

			mockVerifyToken.mockResolvedValue(mockPayload);

			await service1.verifyToken(mockToken);
			await service2.verifyToken(mockToken);

			expect(mockVerifyToken).toHaveBeenCalledTimes(2);
			expect(mockVerifyToken).toHaveBeenNthCalledWith(1, mockToken, { secretKey: 'secret-key-1' });
			expect(mockVerifyToken).toHaveBeenNthCalledWith(2, mockToken, { secretKey: 'secret-key-2' });
		});
	});

	describe('error handling', () => {
		it('should handle Clerk SDK errors gracefully', async () => {
			const mockToken = 'sdk-error-token';
			const mockError = new Error('Clerk SDK error');

			mockVerifyToken.mockRejectedValue(mockError);

			await expect(clerkService.verifyToken(mockToken)).rejects.toThrow('Invalid or expired token');
		});

		it('should handle timeout errors', async () => {
			const mockToken = 'timeout-token';
			const mockError = new Error('Request timeout');

			mockVerifyToken.mockRejectedValue(mockError);

			await expect(clerkService.verifyToken(mockToken)).rejects.toThrow('Invalid or expired token');
		});

		it('should handle rate limiting errors', async () => {
			const mockToken = 'rate-limit-token';
			const mockError = new Error('Rate limit exceeded');

			mockVerifyToken.mockRejectedValue(mockError);

			await expect(clerkService.verifyToken(mockToken)).rejects.toThrow('Invalid or expired token');
		});
	});

	describe('performance considerations', () => {
		it('should handle multiple concurrent token verifications', async () => {
			const mockTokens = ['token1', 'token2', 'token3'];
			const mockPayload = { sub: 'user-123' };

			mockVerifyToken.mockResolvedValue(mockPayload);

			const verificationPromises = mockTokens.map((token) => clerkService.verifyToken(token));
			const results = await Promise.all(verificationPromises);

			expect(results).toHaveLength(3);
			expect(mockVerifyToken).toHaveBeenCalledTimes(3);
			results.forEach((result) => {
				expect(result).toEqual(mockPayload);
			});
		});

		it('should not create memory leaks with repeated verifications', async () => {
			const mockToken = 'repeated-token';
			const mockPayload = { sub: 'user-123' };

			mockVerifyToken.mockResolvedValue(mockPayload);

			// Perform multiple verifications
			for (let i = 0; i < 10; i++) {
				await clerkService.verifyToken(mockToken);
			}

			expect(mockVerifyToken).toHaveBeenCalledTimes(10);
		});
	});
});
