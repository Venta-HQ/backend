import { vi } from 'vitest';
import { ClerkWebhooksController } from './clerk-webhooks.controller';
import { mockGrpcClient, webhooks } from '../../../../../test/helpers/simple';

// Mock the proto imports to avoid module resolution issues
vi.mock('@app/proto/user', () => ({
  USER_SERVICE_NAME: 'UserService',
}));

describe('ClerkWebhooksController', () => {
  let controller: ClerkWebhooksController;
  let grpcClient: any;

  beforeEach(() => {
    grpcClient = mockGrpcClient();
    controller = new ClerkWebhooksController(grpcClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleClerkEvent', () => {
    it('should handle user.created event successfully', async () => {
      const mockEvent = webhooks.clerk.userCreated({ id: 'clerk_user_123' });

      grpcClient.invoke.mockResolvedValue({ success: true });

      const result = await controller.handleClerkEvent(mockEvent);

      expect(result).toEqual({ success: true });
      expect(grpcClient.invoke).toHaveBeenCalledWith('handleClerkUserCreated', {
        id: 'clerk_user_123',
      });
    });

    it('should handle user.deleted event successfully', async () => {
      const mockEvent = webhooks.clerk.userDeleted({ id: 'clerk_user_123' });

      grpcClient.invoke.mockResolvedValue({ success: true });

      const result = await controller.handleClerkEvent(mockEvent);

      expect(result).toEqual({ success: true });
      expect(grpcClient.invoke).toHaveBeenCalledWith('handleClerkUserDeleted', {
        id: 'clerk_user_123',
      });
    });

    it('should handle user.created event with missing data.id', async () => {
      const mockEvent = webhooks.clerk.userCreated({
        id: undefined,
        email_addresses: [{ email_address: 'test@example.com' }]
      });

      const result = await controller.handleClerkEvent(mockEvent);

      expect(result).toEqual({ success: true });
      expect(grpcClient.invoke).not.toHaveBeenCalled();
    });

    it('should handle user.deleted event with missing data.id', async () => {
      const mockEvent = webhooks.clerk.userDeleted({ id: undefined });

      const result = await controller.handleClerkEvent(mockEvent);

      expect(result).toEqual({ success: true });
      expect(grpcClient.invoke).not.toHaveBeenCalled();
    });

    it('should handle unhandled event types', async () => {
      const mockEvent = webhooks.clerk.userUpdated({ id: 'clerk_user_123' });

      const result = await controller.handleClerkEvent(mockEvent);

      expect(result).toEqual({ success: true });
      expect(grpcClient.invoke).not.toHaveBeenCalled();
    });

    it('should handle gRPC errors during user creation', async () => {
      const mockEvent = webhooks.clerk.userCreated({ id: 'clerk_user_123' });

      const mockError = new Error('Failed to create user');
      grpcClient.invoke.mockRejectedValue(mockError);

      await expect(controller.handleClerkEvent(mockEvent)).rejects.toThrow(mockError);
      expect(grpcClient.invoke).toHaveBeenCalledWith('handleClerkUserCreated', {
        id: 'clerk_user_123',
      });
    });

    it('should handle gRPC errors during user deletion', async () => {
      const mockEvent = webhooks.clerk.userDeleted({ id: 'clerk_user_123' });

      const mockError = new Error('Failed to delete user');
      grpcClient.invoke.mockRejectedValue(mockError);

      await expect(controller.handleClerkEvent(mockEvent)).rejects.toThrow(mockError);
      expect(grpcClient.invoke).toHaveBeenCalledWith('handleClerkUserDeleted', {
        id: 'clerk_user_123',
      });
    });

    it('should handle events with null data', async () => {
      const mockEvent = webhooks.clerk.userCreated({ id: 'clerk_user_123' });
      mockEvent.data = null;

      const result = await controller.handleClerkEvent(mockEvent);

      expect(result).toEqual({ success: true });
      expect(grpcClient.invoke).not.toHaveBeenCalled();
    });

    it('should handle events with undefined data', async () => {
      const mockEvent = webhooks.clerk.userDeleted({ id: 'clerk_user_123' });
      mockEvent.data = undefined;

      const result = await controller.handleClerkEvent(mockEvent);

      expect(result).toEqual({ success: true });
      expect(grpcClient.invoke).not.toHaveBeenCalled();
    });

    it('should handle multiple events in sequence', async () => {
      const events = [
        webhooks.clerk.userCreated({ id: 'user_1' }),
        webhooks.clerk.userDeleted({ id: 'user_2' }),
        webhooks.clerk.userCreated({ id: 'user_3' }),
      ];

      grpcClient.invoke.mockResolvedValue({ success: true });

      for (const event of events) {
        const result = await controller.handleClerkEvent(event);
        expect(result).toEqual({ success: true });
      }

      expect(grpcClient.invoke).toHaveBeenCalledTimes(3);
      expect(grpcClient.invoke).toHaveBeenNthCalledWith(1, 'handleClerkUserCreated', { id: 'user_1' });
      expect(grpcClient.invoke).toHaveBeenNthCalledWith(2, 'handleClerkUserDeleted', { id: 'user_2' });
      expect(grpcClient.invoke).toHaveBeenNthCalledWith(3, 'handleClerkUserCreated', { id: 'user_3' });
    });
  });
}); 