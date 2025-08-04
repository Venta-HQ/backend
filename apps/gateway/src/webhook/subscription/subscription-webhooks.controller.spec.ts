import { vi } from 'vitest';
import { mockGrpcClient, webhooks } from '../../../../../test/helpers/test-utils';
import { SubscriptionWebhooksController } from './subscription-webhooks.controller';

// Mock the proto imports to avoid module resolution issues
vi.mock('@app/proto/user', () => ({
	RevenueCatSubscriptionData: vi.fn(),
	USER_SERVICE_NAME: 'UserService',
}));

describe('SubscriptionWebhooksController', () => {
	let controller: SubscriptionWebhooksController;
	let grpcClient: any;

	beforeEach(() => {
		grpcClient = mockGrpcClient();
		controller = new SubscriptionWebhooksController(grpcClient);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('handleSubscriptionCreated', () => {
		it('should handle initial purchase event successfully', async () => {
			const mockWebhookEvent = webhooks.revenueCat.initialPurchase({
				id: 'event_123',
				product_id: 'premium_monthly',
				subscriber_attributes: {
					clerkUserId: 'clerk_user_123',
				},
				transaction_id: 'txn_456',
			});

			const mockObservable = {
				subscribe: vi.fn().mockImplementation((observer) => {
					observer.next();
					return { unsubscribe: vi.fn() };
				}),
			};

			grpcClient.invoke.mockReturnValue(mockObservable);

			await controller.handleSubscriptionCreated(mockWebhookEvent);

			expect(grpcClient.invoke).toHaveBeenCalledWith('handleSubscriptionCreated', {
				clerkUserId: 'clerk_user_123',
				data: {
					eventId: 'event_123',
					productId: 'premium_monthly',
					transactionId: 'txn_456',
				},
				providerId: 'premium_monthly',
			});
		});

		it('should handle unhandled event types', async () => {
			const mockWebhookEvent = webhooks.revenueCat.renewal({
				id: 'event_123',
				product_id: 'premium_monthly',
				subscriber_attributes: {
					clerkUserId: 'clerk_user_123',
				},
				transaction_id: 'txn_456',
			});

			await controller.handleSubscriptionCreated(mockWebhookEvent);

			expect(grpcClient.invoke).not.toHaveBeenCalled();
		});

		it('should handle gRPC observable errors', async () => {
			const mockWebhookEvent = webhooks.revenueCat.initialPurchase({
				id: 'event_123',
				product_id: 'premium_monthly',
				subscriber_attributes: {
					clerkUserId: 'clerk_user_123',
				},
				transaction_id: 'txn_456',
			});

			const mockError = new Error('gRPC error');
			const mockObservable = {
				subscribe: vi.fn().mockImplementation((observer) => {
					observer.error(mockError);
					return { unsubscribe: vi.fn() };
				}),
			};

			grpcClient.invoke.mockReturnValue(mockObservable);

			await controller.handleSubscriptionCreated(mockWebhookEvent);

			expect(grpcClient.invoke).toHaveBeenCalledWith('handleSubscriptionCreated', {
				clerkUserId: 'clerk_user_123',
				data: {
					eventId: 'event_123',
					productId: 'premium_monthly',
					transactionId: 'txn_456',
				},
				providerId: 'premium_monthly',
			});
		});

		it('should handle missing clerkUserId in subscriber attributes', async () => {
			const mockWebhookEvent = webhooks.revenueCat.initialPurchase({
				id: 'event_123',
				product_id: 'premium_monthly',
				subscriber_attributes: {
					// Missing clerkUserId
				},
				transaction_id: 'txn_456',
			});

			const mockObservable = {
				subscribe: vi.fn().mockImplementation((observer) => {
					observer.next();
					return { unsubscribe: vi.fn() };
				}),
			};

			grpcClient.invoke.mockReturnValue(mockObservable);

			await controller.handleSubscriptionCreated(mockWebhookEvent);

			expect(grpcClient.invoke).toHaveBeenCalledWith('handleSubscriptionCreated', {
				clerkUserId: undefined,
				data: {
					eventId: 'event_123',
					productId: 'premium_monthly',
					transactionId: 'txn_456',
				},
				providerId: 'premium_monthly',
			});
		});

		it('should handle missing subscriber attributes', async () => {
			const mockWebhookEvent = webhooks.revenueCat.initialPurchase({
				id: 'event_123',
				product_id: 'premium_monthly',
				transaction_id: 'txn_456',
				// Missing subscriber_attributes
			});

			// This should throw an error since subscriber_attributes is missing
			await expect(controller.handleSubscriptionCreated(mockWebhookEvent)).rejects.toThrow();
		});

		it('should handle different product types', async () => {
			const productTypes = ['premium_monthly', 'premium_yearly', 'basic_monthly', 'basic_yearly'];

			for (const productId of productTypes) {
				const mockWebhookEvent = webhooks.revenueCat.initialPurchase({
					id: `event_${productId}`,
					product_id: productId,
					subscriber_attributes: {
						clerkUserId: 'clerk_user_123',
					},
					transaction_id: `txn_${productId}`,
				});

				const mockObservable = {
					subscribe: vi.fn().mockImplementation((observer) => {
						observer.next();
						return { unsubscribe: vi.fn() };
					}),
				};

				grpcClient.invoke.mockReturnValue(mockObservable);

				await controller.handleSubscriptionCreated(mockWebhookEvent);

				expect(grpcClient.invoke).toHaveBeenCalledWith('handleSubscriptionCreated', {
					clerkUserId: 'clerk_user_123',
					data: {
						eventId: `event_${productId}`,
						productId: productId,
						transactionId: `txn_${productId}`,
					},
					providerId: productId,
				});
			}
		});

		it('should handle multiple events in sequence', async () => {
			const events = [
				webhooks.revenueCat.initialPurchase({
					id: 'event_1',
					product_id: 'premium_monthly',
					subscriber_attributes: { clerkUserId: 'user_1' },
					transaction_id: 'txn_1',
				}),
				webhooks.revenueCat.initialPurchase({
					id: 'event_2',
					product_id: 'premium_yearly',
					subscriber_attributes: { clerkUserId: 'user_2' },
					transaction_id: 'txn_2',
				}),
			];

			for (const event of events) {
				const mockObservable = {
					subscribe: vi.fn().mockImplementation((observer) => {
						observer.next();
						return { unsubscribe: vi.fn() };
					}),
				};

				grpcClient.invoke.mockReturnValue(mockObservable);

				await controller.handleSubscriptionCreated(event);
			}

			expect(grpcClient.invoke).toHaveBeenCalledTimes(2);
			expect(grpcClient.invoke).toHaveBeenNthCalledWith(1, 'handleSubscriptionCreated', {
				clerkUserId: 'user_1',
				data: {
					eventId: 'event_1',
					productId: 'premium_monthly',
					transactionId: 'txn_1',
				},
				providerId: 'premium_monthly',
			});
			expect(grpcClient.invoke).toHaveBeenNthCalledWith(2, 'handleSubscriptionCreated', {
				clerkUserId: 'user_2',
				data: {
					eventId: 'event_2',
					productId: 'premium_yearly',
					transactionId: 'txn_2',
				},
				providerId: 'premium_yearly',
			});
		});
	});
});
