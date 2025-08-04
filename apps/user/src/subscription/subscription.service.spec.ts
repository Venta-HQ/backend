import { SubscriptionService } from './subscription.service';
import { 
  createMockPrismaService, 
  sampleData,
  errors,
  clearAllMocks 
} from '../../../../test/helpers';
import { IntegrationType, SubscriptionStatus } from '@prisma/client';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = createMockPrismaService();
    service = new SubscriptionService(mockPrismaService);
  });

  afterEach(() => {
    clearAllMocks();
  });

  describe('handleUserCreated', () => {
    it('should create new user when user does not exist', async () => {
      const clerkId = 'clerk_user_123';
      const expectedUser = sampleData.user({ clerkId });

      mockPrismaService.db.user.count.mockResolvedValue(0);
      mockPrismaService.db.user.create.mockResolvedValue(expectedUser);

      await service.handleUserCreated(clerkId);

      expect(mockPrismaService.db.user.count).toHaveBeenCalledWith({
        where: {
          clerkId: 'clerk_user_123',
        },
      });
      expect(mockPrismaService.db.user.create).toHaveBeenCalledWith({
        data: {
          clerkId: 'clerk_user_123',
        },
      });
    });

    it('should not create user when user already exists', async () => {
      const clerkId = 'existing_clerk_user';

      mockPrismaService.db.user.count.mockResolvedValue(1);

      await service.handleUserCreated(clerkId);

      expect(mockPrismaService.db.user.count).toHaveBeenCalledWith({
        where: {
          clerkId: 'existing_clerk_user',
        },
      });
      expect(mockPrismaService.db.user.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const clerkId = 'clerk_user_123';
      const dbError = errors.database('Database connection failed');
      mockPrismaService.db.user.count.mockRejectedValue(dbError);

      await expect(service.handleUserCreated(clerkId)).rejects.toThrow('Database connection failed');
      expect(mockPrismaService.db.user.count).toHaveBeenCalledWith({
        where: {
          clerkId: 'clerk_user_123',
        },
      });
    });
  });

  describe('handleUserDeleted', () => {
    it('should delete user successfully', async () => {
      const clerkId = 'clerk_user_123';

      mockPrismaService.db.user.deleteMany.mockResolvedValue({ count: 1 });

      await service.handleUserDeleted(clerkId);

      expect(mockPrismaService.db.user.deleteMany).toHaveBeenCalledWith({
        where: {
          clerkId: 'clerk_user_123',
        },
      });
    });

    it('should handle deletion when user does not exist', async () => {
      const clerkId = 'non_existent_user';

      mockPrismaService.db.user.deleteMany.mockResolvedValue({ count: 0 });

      await service.handleUserDeleted(clerkId);

      expect(mockPrismaService.db.user.deleteMany).toHaveBeenCalledWith({
        where: {
          clerkId: 'non_existent_user',
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      const clerkId = 'clerk_user_123';
      const dbError = errors.database('Database connection failed');
      mockPrismaService.db.user.deleteMany.mockRejectedValue(dbError);

      await expect(service.handleUserDeleted(clerkId)).rejects.toThrow('Database connection failed');
      expect(mockPrismaService.db.user.deleteMany).toHaveBeenCalledWith({
        where: {
          clerkId: 'clerk_user_123',
        },
      });
    });
  });

  describe('createIntegration', () => {
    it('should create integration successfully with all data', async () => {
      const integrationData = {
        clerkUserId: 'clerk_user_123',
        data: { subscriptionId: 'sub_123', plan: 'premium' },
        providerId: 'revenue_cat_123',
      };

      const expectedIntegration = sampleData.integration({
        type: IntegrationType.RevenueCat,
        userId: 'user_123',
        config: { data: { subscriptionId: 'sub_123', plan: 'premium' }, providerId: 'revenue_cat_123' },
      });

      mockPrismaService.db.integration.create.mockResolvedValue(expectedIntegration);

      await service.createIntegration(integrationData);

      expect(mockPrismaService.db.integration.create).toHaveBeenCalledWith({
        data: {
          config: { data: { subscriptionId: 'sub_123', plan: 'premium' }, providerId: 'revenue_cat_123' },
          type: IntegrationType.RevenueCat,
          user: {
            connect: {
              clerkId: 'clerk_user_123',
            },
          },
        },
      });
    });

    it('should create integration with undefined data and providerId', async () => {
      const integrationData = {
        clerkUserId: 'clerk_user_123',
        data: undefined,
        providerId: undefined,
      };

      const expectedIntegration = sampleData.integration({
        type: IntegrationType.RevenueCat,
        userId: 'user_123',
        config: { data: undefined, providerId: undefined },
      });

      mockPrismaService.db.integration.create.mockResolvedValue(expectedIntegration);

      await service.createIntegration(integrationData);

      expect(mockPrismaService.db.integration.create).toHaveBeenCalledWith({
        data: {
          config: { data: undefined, providerId: undefined },
          type: IntegrationType.RevenueCat,
          user: {
            connect: {
              clerkId: 'clerk_user_123',
            },
          },
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      const integrationData = {
        clerkUserId: 'clerk_user_123',
        data: { subscriptionId: 'sub_123' },
        providerId: 'revenue_cat_123',
      };

      const dbError = errors.database('Database connection failed');
      mockPrismaService.db.integration.create.mockRejectedValue(dbError);

      await expect(service.createIntegration(integrationData)).rejects.toThrow('Database connection failed');
      expect(mockPrismaService.db.integration.create).toHaveBeenCalledWith({
        data: {
          config: { data: { subscriptionId: 'sub_123' }, providerId: 'revenue_cat_123' },
          type: IntegrationType.RevenueCat,
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

      const expectedSubscription = sampleData.userSubscription({
        userId: 'user_123',
        status: SubscriptionStatus.Active,
      });

      mockPrismaService.db.userSubscription.create.mockResolvedValue(expectedSubscription);

      await service.createUserSubscription(subscriptionData);

      expect(mockPrismaService.db.userSubscription.create).toHaveBeenCalledWith({
        data: {
          status: SubscriptionStatus.Active,
          user: {
            connect: {
              clerkId: 'clerk_user_123',
            },
          },
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      const subscriptionData = {
        clerkUserId: 'clerk_user_123',
      };

      const dbError = errors.database('Database connection failed');
      mockPrismaService.db.userSubscription.create.mockRejectedValue(dbError);

      await expect(service.createUserSubscription(subscriptionData)).rejects.toThrow('Database connection failed');
      expect(mockPrismaService.db.userSubscription.create).toHaveBeenCalledWith({
        data: {
          status: SubscriptionStatus.Active,
          user: {
            connect: {
              clerkId: 'clerk_user_123',
            },
          },
        },
      });
    });

    it('should handle null clerkUserId gracefully', async () => {
      const subscriptionData = {
        clerkUserId: null as any,
      };

      const expectedSubscription = sampleData.userSubscription({
        userId: 'user_123',
        status: SubscriptionStatus.Active,
      });

      mockPrismaService.db.userSubscription.create.mockResolvedValue(expectedSubscription);

      await service.createUserSubscription(subscriptionData);

      expect(mockPrismaService.db.userSubscription.create).toHaveBeenCalledWith({
        data: {
          status: SubscriptionStatus.Active,
          user: {
            connect: {
              clerkId: null,
            },
          },
        },
      });
    });
  });
}); 