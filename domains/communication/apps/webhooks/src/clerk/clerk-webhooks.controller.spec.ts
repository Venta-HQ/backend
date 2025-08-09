import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { GrpcInstance } from '@venta/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@venta/proto/marketplace/user-management';
import { ClerkWebhooksController } from './clerk-webhooks.controller';

describe('ClerkWebhooksController', () => {
	let controller: ClerkWebhooksController;
	let mockGrpcInstance: any;

	beforeEach(async () => {
		mockGrpcInstance = {
			invoke: vi.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [ClerkWebhooksController],
			providers: [
				{
					provide: USER_MANAGEMENT_SERVICE_NAME,
					useValue: mockGrpcInstance,
				},
			],
		}).compile();

		controller = module.get<ClerkWebhooksController>(ClerkWebhooksController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('handleClerkEvent', () => {
		it('should handle user.created event successfully', () => {
			const mockEvent = {
				data: { id: 'clerk_user_123' },
				type: 'user.created',
			};

			const mockResponse = { message: 'Success' };
			mockGrpcInstance.invoke.mockReturnValue(mockResponse);

			const result = controller.handleClerkEvent(mockEvent);

			expect(result).toEqual(mockResponse);
			expect(mockGrpcInstance.invoke).toHaveBeenCalledWith('handleUserCreated', {
				id: 'clerk_user_123',
			});
		});

		it('should handle user.deleted event successfully', () => {
			const mockEvent = {
				data: { id: 'clerk_user_123' },
				type: 'user.deleted',
			};

			const mockResponse = { message: 'Success' };
			mockGrpcInstance.invoke.mockReturnValue(mockResponse);

			const result = controller.handleClerkEvent(mockEvent);

			expect(result).toEqual(mockResponse);
			expect(mockGrpcInstance.invoke).toHaveBeenCalledWith('handleUserDeleted', {
				id: 'clerk_user_123',
			});
		});

		it('should handle event without user ID', () => {
			const mockEvent = {
				data: {},
				type: 'user.created',
			};

			const result = controller.handleClerkEvent(mockEvent);

			expect(result).toEqual({ success: true });
			expect(mockGrpcInstance.invoke).not.toHaveBeenCalled();
		});

		it('should handle unknown event type', () => {
			const mockEvent = {
				data: { id: 'clerk_user_123' },
				type: 'unknown.event',
			};

			const result = controller.handleClerkEvent(mockEvent);

			expect(result).toEqual({ success: true });
			expect(mockGrpcInstance.invoke).not.toHaveBeenCalled();
		});

		it('should handle gRPC errors during user creation', () => {
			const mockEvent = {
				data: { id: 'clerk_user_123' },
				type: 'user.created',
			};

			const mockError = new Error('gRPC error');
			mockGrpcInstance.invoke.mockImplementation(() => {
				throw mockError;
			});

			expect(() => controller.handleClerkEvent(mockEvent)).toThrow(mockError);
			expect(mockGrpcInstance.invoke).toHaveBeenCalledWith('handleUserCreated', {
				id: 'clerk_user_123',
			});
		});

		it('should handle gRPC errors during user deletion', () => {
			const mockEvent = {
				data: { id: 'clerk_user_123' },
				type: 'user.deleted',
			};

			const mockError = new Error('gRPC error');
			mockGrpcInstance.invoke.mockImplementation(() => {
				throw mockError;
			});

			expect(() => controller.handleClerkEvent(mockEvent)).toThrow(mockError);
			expect(mockGrpcInstance.invoke).toHaveBeenCalledWith('handleUserDeleted', {
				id: 'clerk_user_123',
			});
		});

		it('should handle multiple events in sequence', () => {
			const events = [
				{ data: { id: 'user_1' }, type: 'user.created' },
				{ data: { id: 'user_2' }, type: 'user.deleted' },
				{ data: { id: 'user_3' }, type: 'user.created' },
			];

			mockGrpcInstance.invoke.mockReturnValue({} as any);

			events.forEach((event) => {
				controller.handleClerkEvent(event);
			});

			expect(mockGrpcInstance.invoke).toHaveBeenCalledTimes(3);
			expect(mockGrpcInstance.invoke).toHaveBeenNthCalledWith(1, 'handleUserCreated', { id: 'user_1' });
			expect(mockGrpcInstance.invoke).toHaveBeenNthCalledWith(2, 'handleUserDeleted', { id: 'user_2' });
			expect(mockGrpcInstance.invoke).toHaveBeenNthCalledWith(3, 'handleUserCreated', { id: 'user_3' });
		});
	});
});
