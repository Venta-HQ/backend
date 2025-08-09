import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { GrpcInstance } from '@venta/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@venta/proto/marketplace/user-management';
import { RevenueCatWebhooksController } from './revenuecat-webhooks.controller';

describe('RevenueCatWebhooksController', () => {
	let controller: RevenueCatWebhooksController;
	let mockGrpcInstance: any;

	beforeEach(async () => {
		mockGrpcInstance = {
			invoke: vi.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [RevenueCatWebhooksController],
			providers: [
				{
					provide: USER_MANAGEMENT_SERVICE_NAME,
					useValue: mockGrpcInstance,
				},
			],
		}).compile();

		controller = module.get<RevenueCatWebhooksController>(RevenueCatWebhooksController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('handleRevenueCatEvent', () => {
		it('should handle INITIAL_PURCHASE event', () => {
			const mockEvent = {
				event: {
					app_user_id: 'test-user-id',
					id: 'test-event-id',
					product_id: 'test-product-id',
					transaction_id: 'test-transaction-id',
					type: 'INITIAL_PURCHASE',
				},
			};

			const mockResponse = { message: 'Success' };
			mockGrpcInstance.invoke.mockReturnValue(mockResponse);

			const result = controller.handleRevenueCatEvent(mockEvent);

			expect(mockGrpcInstance.invoke).toHaveBeenCalledWith('handleSubscriptionCreated', {
				clerkUserId: 'test-user-id',
				data: {
					eventId: 'test-event-id',
					productId: 'test-product-id',
					transactionId: 'test-transaction-id',
				},
				providerId: 'test-transaction-id',
			});
			expect(result).toEqual(mockResponse);
		});

		it('should handle INITIAL_PURCHASE event without app_user_id', () => {
			const mockEvent = {
				event: {
					id: 'test-event-id',
					product_id: 'test-product-id',
					transaction_id: 'test-transaction-id',
					type: 'INITIAL_PURCHASE',
				},
			};

			const result = controller.handleRevenueCatEvent(mockEvent);

			expect(mockGrpcInstance.invoke).not.toHaveBeenCalled();
			expect(result).toEqual({ success: true });
		});

		it('should handle unknown event type', () => {
			const mockEvent = {
				event: {
					type: 'UNKNOWN_EVENT',
				},
			};

			const result = controller.handleRevenueCatEvent(mockEvent);

			expect(mockGrpcInstance.invoke).not.toHaveBeenCalled();
			expect(result).toEqual({ success: true });
		});
	});
});
