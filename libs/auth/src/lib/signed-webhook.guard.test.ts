import { Webhook } from 'svix';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignedWebhookGuard } from './signed-webhook.guard';

// Mock svix Webhook
vi.mock('svix', () => ({
	Webhook: vi.fn(),
}));

describe('SignedWebhookGuard', () => {
	let mockWebhook: any;
	let mockExecutionContext: any;
	const secret = 'test-secret';

	beforeEach(() => {
		vi.clearAllMocks();

		mockWebhook = {
			verify: vi.fn(),
		} as any;

		(Webhook as any).mockImplementation(() => mockWebhook);

		mockExecutionContext = {
			switchToHttp: vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue({
					headers: {
						'svix-id': 'test-id',
						'svix-signature': 'test-signature',
						'svix-timestamp': 'test-timestamp',
					},
					rawBody: Buffer.from('test-payload'),
				}),
			}),
		} as any;
	});

	describe('SignedWebhookGuard factory', () => {
		it('should create a guard class with the provided secret', () => {
			const GuardClass = SignedWebhookGuard(secret);

			expect(GuardClass).toBeDefined();
			expect(typeof GuardClass).toBe('function');
		});

		it('should create a guard that implements CanActivate', () => {
			const GuardClass = SignedWebhookGuard(secret);
			const guard = new GuardClass();

			expect(guard).toHaveProperty('canActivate');
			expect(typeof guard.canActivate).toBe('function');
		});
	});

	describe('canActivate', () => {
		it('should return true when webhook signature is valid', () => {
			const GuardClass = SignedWebhookGuard(secret);
			const guard = new GuardClass();

			mockWebhook.verify.mockReturnValue(true);

			const result = guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(Webhook).toHaveBeenCalledWith(secret);
			expect(mockWebhook.verify).toHaveBeenCalledWith('test-payload', {
				'svix-id': 'test-id',
				'svix-signature': 'test-signature',
				'svix-timestamp': 'test-timestamp',
			});
		});

		it('should return false when webhook signature is invalid', () => {
			const GuardClass = SignedWebhookGuard(secret);
			const guard = new GuardClass();

			mockWebhook.verify.mockImplementation(() => {
				throw new Error('Invalid signature');
			});

			const result = guard.canActivate(mockExecutionContext);

			expect(result).toBe(false);
			expect(Webhook).toHaveBeenCalledWith(secret);
			expect(mockWebhook.verify).toHaveBeenCalledWith('test-payload', {
				'svix-id': 'test-id',
				'svix-signature': 'test-signature',
				'svix-timestamp': 'test-timestamp',
			});
		});

		it('should handle different payload formats', () => {
			const GuardClass = SignedWebhookGuard(secret);
			const guard = new GuardClass();

			const jsonPayload = JSON.stringify({ data: { id: '123' }, event: 'user.created' });
			const request = {
				headers: {
					'svix-id': 'test-id',
					'svix-signature': 'test-signature',
					'svix-timestamp': 'test-timestamp',
				},
				rawBody: Buffer.from(jsonPayload),
			};

			mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
			mockWebhook.verify.mockReturnValue(true);

			const result = guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(mockWebhook.verify).toHaveBeenCalledWith(jsonPayload, request.headers);
		});

		it('should handle empty payload', () => {
			const GuardClass = SignedWebhookGuard(secret);
			const guard = new GuardClass();

			const request = {
				headers: {
					'svix-id': 'test-id',
					'svix-signature': 'test-signature',
					'svix-timestamp': 'test-timestamp',
				},
				rawBody: Buffer.from(''),
			};

			mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
			mockWebhook.verify.mockReturnValue(true);

			const result = guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(mockWebhook.verify).toHaveBeenCalledWith('', request.headers);
		});

		it('should handle missing headers', () => {
			const GuardClass = SignedWebhookGuard(secret);
			const guard = new GuardClass();

			const request = {
				headers: {},
				rawBody: Buffer.from('test-payload'),
			};

			mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
			mockWebhook.verify.mockImplementation(() => {
				throw new Error('Missing headers');
			});

			const result = guard.canActivate(mockExecutionContext);

			expect(result).toBe(false);
			expect(mockWebhook.verify).toHaveBeenCalledWith('test-payload', {});
		});

		it('should handle partial headers', () => {
			const GuardClass = SignedWebhookGuard(secret);
			const guard = new GuardClass();

			const request = {
				headers: {
					'svix-id': 'test-id',
					// Missing svix-timestamp and svix-signature
				},
				rawBody: Buffer.from('test-payload'),
			};

			mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
			mockWebhook.verify.mockImplementation(() => {
				throw new Error('Missing required headers');
			});

			const result = guard.canActivate(mockExecutionContext);

			expect(result).toBe(false);
			expect(mockWebhook.verify).toHaveBeenCalledWith('test-payload', {
				'svix-id': 'test-id',
			});
		});

		it('should handle webhook verification errors gracefully', () => {
			const GuardClass = SignedWebhookGuard(secret);
			const guard = new GuardClass();

			mockWebhook.verify.mockImplementation(() => {
				throw new Error('Verification failed');
			});

			const result = guard.canActivate(mockExecutionContext);

			expect(result).toBe(false);
		});

		it('should handle different error types', () => {
			const GuardClass = SignedWebhookGuard(secret);
			const guard = new GuardClass();

			const errorTypes = [
				new Error('Generic error'),
				new TypeError('Type error'),
				'String error',
				{ message: 'Object error' },
			];

			errorTypes.forEach((error) => {
				mockWebhook.verify.mockImplementation(() => {
					throw error;
				});

				const result = guard.canActivate(mockExecutionContext);

				expect(result).toBe(false);
			});
		});

		it('should create new Webhook instance for each verification', () => {
			const GuardClass = SignedWebhookGuard(secret);
			const guard = new GuardClass();

			mockWebhook.verify.mockReturnValue(true);

			// Call canActivate multiple times
			guard.canActivate(mockExecutionContext);
			guard.canActivate(mockExecutionContext);
			guard.canActivate(mockExecutionContext);

			// Webhook should be instantiated for each call
			expect(Webhook).toHaveBeenCalledTimes(3);
			expect(Webhook).toHaveBeenCalledWith(secret);
		});

		it('should handle different secrets', () => {
			const secret1 = 'secret-1';
			const secret2 = 'secret-2';

			const GuardClass1 = SignedWebhookGuard(secret1);
			const GuardClass2 = SignedWebhookGuard(secret2);

			const guard1 = new GuardClass1();
			const guard2 = new GuardClass2();

			mockWebhook.verify.mockReturnValue(true);

			guard1.canActivate(mockExecutionContext);
			guard2.canActivate(mockExecutionContext);

			expect(Webhook).toHaveBeenCalledWith(secret1);
			expect(Webhook).toHaveBeenCalledWith(secret2);
		});
	});

	describe('edge cases', () => {
		it('should handle null rawBody', () => {
			const GuardClass = SignedWebhookGuard(secret);
			const guard = new GuardClass();

			const request = {
				headers: {
					'svix-id': 'test-id',
					'svix-signature': 'test-signature',
					'svix-timestamp': 'test-timestamp',
				},
				rawBody: null,
			};

			mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
			mockWebhook.verify.mockImplementation(() => {
				throw new Error('Invalid body');
			});

			const result = guard.canActivate(mockExecutionContext);

			expect(result).toBe(false);
		});

		it('should handle undefined rawBody', () => {
			const GuardClass = SignedWebhookGuard(secret);
			const guard = new GuardClass();

			const request = {
				headers: {
					'svix-id': 'test-id',
					'svix-signature': 'test-signature',
					'svix-timestamp': 'test-timestamp',
				},
				rawBody: undefined,
			};

			mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
			mockWebhook.verify.mockImplementation(() => {
				throw new Error('Invalid body');
			});

			const result = guard.canActivate(mockExecutionContext);

			expect(result).toBe(false);
		});

		it('should handle non-Buffer rawBody', () => {
			const GuardClass = SignedWebhookGuard(secret);
			const guard = new GuardClass();

			const request = {
				headers: {
					'svix-id': 'test-id',
					'svix-signature': 'test-signature',
					'svix-timestamp': 'test-timestamp',
				},
				rawBody: 'string-body',
			};

			mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
			mockWebhook.verify.mockImplementation(() => {
				throw new Error('Invalid body type');
			});

			const result = guard.canActivate(mockExecutionContext);

			expect(result).toBe(false);
		});
	});
});
