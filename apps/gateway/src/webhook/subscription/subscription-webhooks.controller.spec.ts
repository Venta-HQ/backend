import { 
  grpcControllerTesting,
  webhookEvents
} from '../../../../../test/helpers';
import { vi } from 'vitest';
import { SubscriptionWebhooksController } from './subscription-webhooks.controller';

// Mock the proto imports to avoid module resolution issues
vi.mock('@app/proto/user', () => ({
  USER_SERVICE_NAME: 'UserService',
  RevenueCatSubscriptionData: vi.fn(),
}));

describe('SubscriptionWebhooksController', () => {
  let controller: SubscriptionWebhooksController;
  let mockGrpcClient: any;

  beforeEach(() => {
    const test = grpcControllerTesting.createTest(SubscriptionWebhooksController);
    controller = test.controller;
    mockGrpcClient = test.mockGrpcClient;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleSubscriptionCreated', () => {
    it('should handle initial purchase event successfully', async () => {
      const mockWebhookEvent = webhookEvents.revenueCat.initialPurchase({
        id: 'event_123',
        product_id: 'premium_monthly',
        transaction_id: 'txn_456',
        subscriber_attributes: {
          clerkUserId: 'clerk_user_123',
        },
      });

      const mockObservable = {
        subscribe: vi.fn().mockImplementation((observer) => {
          observer.next();
          return { unsubscribe: vi.fn() };
        }),
      };

      mockGrpcClient.invoke.mockReturnValue(mockObservable);

      await controller.handleSubscriptionCreated(mockWebhookEvent);

      expect(mockGrpcClient.invoke).toHaveBeenCalledWith('handleSubscriptionCreated', {
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
      const mockWebhookEvent = webhookEvents.revenueCat.renewal({
        id: 'event_123',
        product_id: 'premium_monthly',
        transaction_id: 'txn_456',
        subscriber_attributes: {
          clerkUserId: 'clerk_user_123',
        },
      });

      await controller.handleSubscriptionCreated(mockWebhookEvent);

      expect(mockGrpcClient.invoke).not.toHaveBeenCalled();
    });

    it('should handle gRPC observable errors', async () => {
      const mockWebhookEvent = webhookEvents.revenueCat.initialPurchase({
        id: 'event_123',
        product_id: 'premium_monthly',
        transaction_id: 'txn_456',
        subscriber_attributes: {
          clerkUserId: 'clerk_user_123',
        },
      });

      const mockError = new Error('gRPC error');
      const mockObservable = {
        subscribe: vi.fn().mockImplementation((observer) => {
          observer.error(mockError);
          return { unsubscribe: vi.fn() };
        }),
      };

      mockGrpcClient.invoke.mockReturnValue(mockObservable);

      await controller.handleSubscriptionCreated(mockWebhookEvent);

      expect(mockGrpcClient.invoke).toHaveBeenCalledWith('handleSubscriptionCreated', {
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
      const mockWebhookEvent = webhookEvents.revenueCat.initialPurchase({
        id: 'event_123',
        product_id: 'premium_monthly',
        transaction_id: 'txn_456',
        subscriber_attributes: {
          // Missing clerkUserId
        },
      });

      const mockObservable = {
        subscribe: vi.fn().mockImplementation((observer) => {
          observer.next();
          return { unsubscribe: vi.fn() };
        }),
      };

      mockGrpcClient.invoke.mockReturnValue(mockObservable);

      await controller.handleSubscriptionCreated(mockWebhookEvent);

      expect(mockGrpcClient.invoke).toHaveBeenCalledWith('handleSubscriptionCreated', {
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
      const mockWebhookEvent = webhookEvents.revenueCat.initialPurchase({
        id: 'event_123',
        product_id: 'premium_monthly',
        transaction_id: 'txn_456',
        // Missing subscriber_attributes
      });

      // This should throw an error since subscriber_attributes is missing
      await expect(controller.handleSubscriptionCreated(mockWebhookEvent)).rejects.toThrow();
    });

    it('should handle different product types', async () => {
      const productTypes = [
        'premium_monthly',
        'premium_yearly',
        'basic_monthly',
        'basic_yearly',
      ];

      for (const productId of productTypes) {
        const mockWebhookEvent = webhookEvents.revenueCat.initialPurchase({
          id: `event_${productId}`,
          product_id: productId,
          transaction_id: `txn_${productId}`,
          subscriber_attributes: {
            clerkUserId: 'clerk_user_123',
          },
        });

        const mockObservable = {
          subscribe: vi.fn().mockImplementation((observer) => {
            observer.next();
            return { unsubscribe: vi.fn() };
          }),
        };

        mockGrpcClient.invoke.mockReturnValue(mockObservable);

        await controller.handleSubscriptionCreated(mockWebhookEvent);

        expect(mockGrpcClient.invoke).toHaveBeenCalledWith('handleSubscriptionCreated', {
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
        webhookEvents.revenueCat.initialPurchase({
          id: 'event_1',
          product_id: 'premium_monthly',
          transaction_id: 'txn_1',
          subscriber_attributes: { clerkUserId: 'user_1' },
        }),
        webhookEvents.revenueCat.initialPurchase({
          id: 'event_2',
          product_id: 'premium_yearly',
          transaction_id: 'txn_2',
          subscriber_attributes: { clerkUserId: 'user_2' },
        }),
      ];

      for (const event of events) {
        const mockObservable = {
          subscribe: vi.fn().mockImplementation((observer) => {
            observer.next();
            return { unsubscribe: vi.fn() };
          }),
        };

        mockGrpcClient.invoke.mockReturnValue(mockObservable);

        await controller.handleSubscriptionCreated(event);
      }

      expect(mockGrpcClient.invoke).toHaveBeenCalledTimes(2);
      expect(mockGrpcClient.invoke).toHaveBeenNthCalledWith(1, 'handleSubscriptionCreated', {
        clerkUserId: 'user_1',
        data: {
          eventId: 'event_1',
          productId: 'premium_monthly',
          transactionId: 'txn_1',
        },
        providerId: 'premium_monthly',
      });
      expect(mockGrpcClient.invoke).toHaveBeenNthCalledWith(2, 'handleSubscriptionCreated', {
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