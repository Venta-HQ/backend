import { Logger } from '@nestjs/common';
import { ClerkService } from './clerk.service';
import { IntegrationType } from '@prisma/client';
import { 
  createMockPrismaService, 
  createMockEventsService, 
  sampleData,
  errors,
  clearAllMocks 
} from '../../../../test/helpers';

describe('ClerkService', () => {
  let service: ClerkService;
  let mockPrismaService: any;
  let mockEventsService: any;

  beforeEach(() => {
    // Use brittle mocks for now (robust mocks need refinement)
    mockPrismaService = createMockPrismaService();
    mockEventsService = createMockEventsService();
    service = new ClerkService(mockPrismaService, mockEventsService);
  });

  afterEach(() => {
    clearAllMocks();
  });

  describe('handleUserCreated', () => {
    it('should create user and emit event successfully', async () => {
      const clerkId = 'clerk_user_123';
      const expectedUser = sampleData.user({ clerkId });

      mockPrismaService.db.user.create.mockResolvedValue(expectedUser);
      mockEventsService.publishEvent.mockResolvedValue(undefined);

      const result = await service.handleUserCreated(clerkId);

      expect(result).toEqual(expectedUser);
      expect(mockPrismaService.db.user.create).toHaveBeenCalledWith({
        data: {
          clerkId: 'clerk_user_123',
        },
        select: { clerkId: true, id: true },
      });
      expect(mockEventsService.publishEvent).toHaveBeenCalledWith('user.created', {
        clerkId: 'clerk_user_123',
        timestamp: expect.any(String),
        userId: expectedUser.id,
      });
    });

    it('should handle database errors gracefully', async () => {
      const clerkId = 'clerk_user_123';
      const dbError = errors.database('Database connection failed');
      mockPrismaService.db.user.create.mockRejectedValue(dbError);

      await expect(service.handleUserCreated(clerkId)).rejects.toThrow('Database connection failed');
      expect(mockPrismaService.db.user.create).toHaveBeenCalledWith({
        data: {
          clerkId: 'clerk_user_123',
        },
        select: { clerkId: true, id: true },
      });
    });
  });

  describe('handleUserDeleted', () => {
    it('should delete user and emit event when user exists', async () => {
      const clerkId = 'clerk_user_123';
      const existingUser = sampleData.user({ clerkId });

      mockPrismaService.db.user.findFirst.mockResolvedValue(existingUser);
      mockPrismaService.db.user.deleteMany.mockResolvedValue({ count: 1 });
      mockEventsService.publishEvent.mockResolvedValue(undefined);

      await service.handleUserDeleted(clerkId);

      expect(mockPrismaService.db.user.findFirst).toHaveBeenCalledWith({
        select: { clerkId: true, id: true },
        where: { clerkId: 'clerk_user_123' },
      });
      expect(mockPrismaService.db.user.deleteMany).toHaveBeenCalledWith({
        where: {
          clerkId: 'clerk_user_123',
        },
      });
      expect(mockEventsService.publishEvent).toHaveBeenCalledWith('user.deleted', {
        clerkId: 'clerk_user_123',
        timestamp: expect.any(String),
        userId: existingUser.id,
      });
    });

    it('should handle deletion when user does not exist', async () => {
      const clerkId = 'non_existent_user';

      mockPrismaService.db.user.findFirst.mockResolvedValue(null);
      mockPrismaService.db.user.deleteMany.mockResolvedValue({ count: 0 });

      await service.handleUserDeleted(clerkId);

      expect(mockPrismaService.db.user.findFirst).toHaveBeenCalledWith({
        select: { clerkId: true, id: true },
        where: { clerkId: 'non_existent_user' },
      });
      expect(mockPrismaService.db.user.deleteMany).toHaveBeenCalledWith({
        where: {
          clerkId: 'non_existent_user',
        },
      });
      expect(mockEventsService.publishEvent).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const clerkId = 'clerk_user_123';
      const dbError = errors.database('Database connection failed');
      mockPrismaService.db.user.findFirst.mockRejectedValue(dbError);

      await expect(service.handleUserDeleted(clerkId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('createIntegration', () => {
    it('should create integration successfully', async () => {
      const integrationData = {
        data: { someData: 'value' },
        providerId: 'provider_123',
        userId: 'user_123',
      };

      const expectedIntegration = sampleData.integration({
        config: { data: { someData: 'value' }, providerId: 'provider_123' },
        userId: 'user_123',
      });

      mockPrismaService.db.integration.create.mockResolvedValue(expectedIntegration);
      mockEventsService.publishEvent.mockResolvedValue(undefined);

      await service.createIntegration(integrationData);

      expect(mockPrismaService.db.integration.create).toHaveBeenCalledWith({
        data: {
          config: { data: { someData: 'value' }, providerId: 'provider_123' },
          type: IntegrationType.Clerk,
          userId: 'user_123',
        },
      });
      expect(mockEventsService.publishEvent).toHaveBeenCalledWith('user.integration.created', {
        integrationId: expectedIntegration.id,
        providerId: 'provider_123',
        timestamp: expect.any(String),
        type: IntegrationType.Clerk,
        userId: 'user_123',
      });
    });

    it('should handle null data and providerId', async () => {
      const integrationData = {
        data: undefined,
        providerId: undefined,
        userId: 'user_123',
      };

      const expectedIntegration = sampleData.integration({
        config: { data: null, providerId: null },
        userId: 'user_123',
      });

      mockPrismaService.db.integration.create.mockResolvedValue(expectedIntegration);

      await service.createIntegration(integrationData);

      expect(mockPrismaService.db.integration.create).toHaveBeenCalledWith({
        data: {
          config: { data: null, providerId: null },
          type: IntegrationType.Clerk,
          userId: 'user_123',
        },
      });
    });
  });

  describe('deleteIntegration', () => {
    it('should delete integration and emit event when integration exists', async () => {
      const providerId = 'provider_123';
      const existingIntegration = sampleData.integration({ userId: 'user_123' });

      mockPrismaService.db.integration.findFirst.mockResolvedValue(existingIntegration);
      mockPrismaService.db.integration.deleteMany.mockResolvedValue({ count: 1 });
      mockEventsService.publishEvent.mockResolvedValue(undefined);

      await service.deleteIntegration({ providerId });

      expect(mockPrismaService.db.integration.findFirst).toHaveBeenCalledWith({
        select: { id: true, userId: true },
        where: {
          config: {
            equals: 'provider_123',
            path: ['providerId'],
          },
          type: IntegrationType.Clerk,
        },
      });
      expect(mockPrismaService.db.integration.deleteMany).toHaveBeenCalledWith({
        where: {
          config: {
            equals: 'provider_123',
            path: ['providerId'],
          },
          type: IntegrationType.Clerk,
        },
      });
      expect(mockEventsService.publishEvent).toHaveBeenCalledWith('user.integration.deleted', {
        integrationId: existingIntegration.id,
        providerId: 'provider_123',
        timestamp: expect.any(String),
        type: IntegrationType.Clerk,
        userId: existingIntegration.userId,
      });
    });

    it('should handle deletion when integration does not exist', async () => {
      const providerId = 'non_existent_provider';

      mockPrismaService.db.integration.findFirst.mockResolvedValue(null);
      mockPrismaService.db.integration.deleteMany.mockResolvedValue({ count: 0 });

      await service.deleteIntegration({ providerId });

      expect(mockPrismaService.db.integration.findFirst).toHaveBeenCalledWith({
        select: { id: true, userId: true },
        where: {
          config: {
            equals: 'non_existent_provider',
            path: ['providerId'],
          },
          type: IntegrationType.Clerk,
        },
      });
      expect(mockPrismaService.db.integration.deleteMany).toHaveBeenCalledWith({
        where: {
          config: {
            equals: 'non_existent_provider',
            path: ['providerId'],
          },
          type: IntegrationType.Clerk,
        },
      });
      expect(mockEventsService.publishEvent).not.toHaveBeenCalled();
    });
  });
}); 