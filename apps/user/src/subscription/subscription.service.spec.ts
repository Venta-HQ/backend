import { SubscriptionService } from './subscription.service';
import { 
  mockPrisma, 
  data,
  errors,
  clearMocks 
} from '../../../../test/helpers/test-utils';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let prisma: any;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new SubscriptionService(prisma);
  });

  afterEach(() => {
    clearMocks();
  });

  describe('createIntegration', () => {
    it('should create integration successfully', async () => {
      const integrationData = {
        clerkUserId: 'clerk_user_123',
        data: {
          eventId: 'event_123',
          productId: 'premium_monthly',
          transactionId: 'txn_456',
        },
        providerId: 'premium_monthly',
      };

      const expectedIntegration = data.integration({
        type: 'RevenueCat',
        providerId: 'premium_monthly',
        userId: 'user_123',
      });

      prisma.db.integration.create.mockResolvedValue(expectedIntegration);

      await service.createIntegration(integrationData);

      expect(prisma.db.integration.create).toHaveBeenCalledWith({
        data: {
          config: { 
            data: integrationData.data, 
            providerId: integrationData.providerId 
          },
          type: 'RevenueCat',
          user: {
            connect: {
              clerkId: 'clerk_user_123',
            },
          },
        },
      });
    });

    it('should handle database errors during integration creation', async () => {
      const integrationData = {
        clerkUserId: 'clerk_user_123',
        data: {
          eventId: 'event_123',
          productId: 'premium_monthly',
          transactionId: 'txn_456',
        },
        providerId: 'premium_monthly',
      };

      const dbError = errors.database('Database connection failed');
      prisma.db.integration.create.mockRejectedValue(dbError);

      await expect(service.createIntegration(integrationData)).rejects.toThrow('Database connection failed');
      expect(prisma.db.integration.create).toHaveBeenCalledWith({
        data: {
          config: { 
            data: integrationData.data, 
            providerId: integrationData.providerId 
          },
          type: 'RevenueCat',
          user: {
            connect: {
              clerkId: 'clerk_user_123',
            },
          },
        },
      });
    });
  });

  describe('createUserSubscription', () => {
    it('should create user subscription successfully', async () => {
      const subscriptionData = {
        clerkUserId: 'clerk_user_123',
      };

      const expectedSubscription = {
        id: 'subscription_123',
        userId: 'user_123',
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      prisma.db.userSubscription.create.mockResolvedValue(expectedSubscription);

      await service.createUserSubscription(subscriptionData);

      expect(prisma.db.userSubscription.create).toHaveBeenCalledWith({
        data: {
          status: 'Active',
          user: {
            connect: {
              clerkId: 'clerk_user_123',
            },
          },
        },
      });
    });

    it('should handle database errors during subscription creation', async () => {
      const subscriptionData = {
        clerkUserId: 'clerk_user_123',
      };

      const dbError = errors.database('Database connection failed');
      prisma.db.userSubscription.create.mockRejectedValue(dbError);

      await expect(service.createUserSubscription(subscriptionData)).rejects.toThrow('Database connection failed');
      expect(prisma.db.userSubscription.create).toHaveBeenCalledWith({
        data: {
          status: 'Active',
          user: {
            connect: {
              clerkId: 'clerk_user_123',
            },
          },
        },
      });
    });
  });

  describe('handleUserCreated', () => {
    it('should create user when user does not exist', async () => {
      const clerkId = 'clerk_user_123';
      const expectedUser = data.user({ clerkId });

      prisma.db.user.count.mockResolvedValue(0);
      prisma.db.user.create.mockResolvedValue(expectedUser);

      await service.handleUserCreated(clerkId);

      expect(prisma.db.user.count).toHaveBeenCalledWith({
        where: {
          clerkId: 'clerk_user_123',
        },
      });
      expect(prisma.db.user.create).toHaveBeenCalledWith({
        data: {
          clerkId: 'clerk_user_123',
        },
      });
    });

    it('should not create user when user already exists', async () => {
      const clerkId = 'clerk_user_123';

      prisma.db.user.count.mockResolvedValue(1);

      await service.handleUserCreated(clerkId);

      expect(prisma.db.user.count).toHaveBeenCalledWith({
        where: {
          clerkId: 'clerk_user_123',
        },
      });
      expect(prisma.db.user.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during user count check', async () => {
      const clerkId = 'clerk_user_123';
      const dbError = errors.database('Database connection failed');
      prisma.db.user.count.mockRejectedValue(dbError);

      await expect(service.handleUserCreated(clerkId)).rejects.toThrow('Database connection failed');
      expect(prisma.db.user.count).toHaveBeenCalledWith({
        where: {
          clerkId: 'clerk_user_123',
        },
      });
    });

    it('should handle database errors during user creation', async () => {
      const clerkId = 'clerk_user_123';
      const dbError = errors.database('Database connection failed');
      
      prisma.db.user.count.mockResolvedValue(0);
      prisma.db.user.create.mockRejectedValue(dbError);

      await expect(service.handleUserCreated(clerkId)).rejects.toThrow('Database connection failed');
      expect(prisma.db.user.count).toHaveBeenCalledWith({
        where: {
          clerkId: 'clerk_user_123',
        },
      });
      expect(prisma.db.user.create).toHaveBeenCalledWith({
        data: {
          clerkId: 'clerk_user_123',
        },
      });
    });
  });

  describe('handleUserDeleted', () => {
    it('should handle user deleted event', async () => {
      const clerkId = 'clerk_user_123';

      prisma.db.user.deleteMany.mockResolvedValue({ count: 1 });

      await service.handleUserDeleted(clerkId);

      expect(prisma.db.user.deleteMany).toHaveBeenCalledWith({
        where: {
          clerkId: 'clerk_user_123',
        },
      });
    });

    it('should handle database errors during user deletion', async () => {
      const clerkId = 'clerk_user_123';
      const dbError = errors.database('Database connection failed');
      prisma.db.user.deleteMany.mockRejectedValue(dbError);

      await expect(service.handleUserDeleted(clerkId)).rejects.toThrow('Database connection failed');
      expect(prisma.db.user.deleteMany).toHaveBeenCalledWith({
        where: {
          clerkId: 'clerk_user_123',
        },
      });
    });
  });
}); 