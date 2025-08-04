import { vi } from 'vitest';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

// Mock the proto imports to avoid module resolution issues
vi.mock('@app/proto/user', () => ({
  USER_SERVICE_NAME: 'UserService',
  RevenueCatSubscriptionData: vi.fn(),
}));

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  let mockSubscriptionService: any;

  beforeEach(() => {
    mockSubscriptionService = {
      createIntegration: vi.fn(),
      createUserSubscription: vi.fn(),
    };
    controller = new SubscriptionController(mockSubscriptionService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleSubscriptionCreated', () => {
    it('should handle subscription created successfully', async () => {
      const mockData = {
        clerkUserId: 'clerk_user_123',
        data: {
          eventId: 'event_123',
          productId: 'premium_monthly',
          transactionId: 'txn_456',
        },
        providerId: 'premium_monthly',
      };

      mockSubscriptionService.createIntegration.mockResolvedValue(undefined);
      mockSubscriptionService.createUserSubscription.mockResolvedValue(undefined);

      const result = await controller.handleSubscriptionCreated(mockData);

      expect(result).toEqual({ message: 'Success' });
      expect(mockSubscriptionService.createIntegration).toHaveBeenCalledWith({
        clerkUserId: 'clerk_user_123',
        data: {
          eventId: 'event_123',
          productId: 'premium_monthly',
          transactionId: 'txn_456',
        },
        providerId: 'premium_monthly',
      });
      expect(mockSubscriptionService.createUserSubscription).toHaveBeenCalledWith({
        clerkUserId: 'clerk_user_123',
      });
    });

    it('should handle service errors', async () => {
      const mockData = {
        clerkUserId: 'clerk_user_123',
        data: {
          eventId: 'event_123',
          productId: 'premium_monthly',
          transactionId: 'txn_456',
        },
        providerId: 'premium_monthly',
      };

      const mockError = new Error('Service error');
      mockSubscriptionService.createIntegration.mockRejectedValue(mockError);

      await expect(controller.handleSubscriptionCreated(mockData)).rejects.toThrow(mockError);
      expect(mockSubscriptionService.createIntegration).toHaveBeenCalledWith({
        clerkUserId: 'clerk_user_123',
        data: {
          eventId: 'event_123',
          productId: 'premium_monthly',
          transactionId: 'txn_456',
        },
        providerId: 'premium_monthly',
      });
    });
  });
}); 