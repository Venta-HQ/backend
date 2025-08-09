import { clearMocks, data, errors, mockPrisma } from '@test/helpers/test-utils';
import { RevenueCatAntiCorruptionLayer } from '@venta/domains/marketplace/contracts/anti-corruption-layers/revenuecat.acl';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionService', () => {
	let service: SubscriptionService;
	let prisma: any;
	let mockRevenueCatACL: any;

	beforeEach(() => {
		prisma = mockPrisma();
		mockRevenueCatACL = {
			validateSubscriptionActivationData: vi.fn(),
		};
		service = new SubscriptionService(prisma, mockRevenueCatACL);
	});

	afterEach(() => {
		clearMocks();
	});

	describe('activateSubscription', () => {
		it('should activate subscription successfully with anti-corruption layer', async () => {
			const activationData = {
				clerkUserId: 'clerk_user_123',
				providerId: 'premium_monthly',
				subscriptionData: {
					eventId: 'event_123',
					productId: 'premium_monthly',
					transactionId: 'txn_456',
				},
			};

			const validatedData = {
				clerkUserId: 'clerk_user_123',
				providerId: 'premium_monthly',
				subscriptionData: {
					eventId: 'event_123',
					productId: 'premium_monthly',
					transactionId: 'txn_456',
				},
			};

			mockRevenueCatACL.validateSubscriptionActivationData.mockReturnValue(validatedData);
			prisma.db.integration.create.mockResolvedValue({ id: 'integration_123' });
			prisma.db.userSubscription.create.mockResolvedValue({ id: 'subscription_123' });

			await service.activateSubscription(activationData);

			expect(mockRevenueCatACL.validateSubscriptionActivationData).toHaveBeenCalledWith(activationData);
			expect(prisma.db.integration.create).toHaveBeenCalled();
			expect(prisma.db.userSubscription.create).toHaveBeenCalled();
		});
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
				providerId: 'premium_monthly',
				type: 'RevenueCat',
				userId: 'user_123',
			});

			prisma.db.integration.create.mockResolvedValue(expectedIntegration);

			await service.createIntegration(integrationData);

			expect(prisma.db.integration.create).toHaveBeenCalledWith({
				data: {
					data: integrationData.data,
					providerId: integrationData.providerId,
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

			await expect(service.createIntegration(integrationData)).rejects.toThrow('Failed to create integration record');
			expect(prisma.db.integration.create).toHaveBeenCalledWith({
				data: {
					data: integrationData.data,
					providerId: integrationData.providerId,
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
				createdAt: new Date().toISOString(),
				id: 'subscription_123',
				status: 'Active',
				updatedAt: new Date().toISOString(),
				userId: 'user_123',
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

			await expect(service.createUserSubscription(subscriptionData)).rejects.toThrow(
				'Failed to create user subscription record',
			);
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

			prisma.db.user.create.mockResolvedValue(expectedUser);

			await service.handleUserCreated(clerkId);

			expect(prisma.db.user.create).toHaveBeenCalledWith({
				data: {
					clerkId: 'clerk_user_123',
				},
			});
		});

		it('should not create user when user already exists', async () => {
			const clerkId = 'clerk_user_123';

			// Mock the unique constraint violation error
			const uniqueConstraintError = new Error('Unique constraint failed');
			(uniqueConstraintError as any).code = 'P2002';
			prisma.db.user.create.mockRejectedValue(uniqueConstraintError);

			await expect(service.handleUserCreated(clerkId)).rejects.toThrow(
				'Failed to create user from external auth provider',
			);
			expect(prisma.db.user.create).toHaveBeenCalledWith({
				data: {
					clerkId: 'clerk_user_123',
				},
			});
		});

		it('should handle database errors during user creation', async () => {
			const clerkId = 'clerk_user_123';
			const dbError = errors.database('Database connection failed');

			prisma.db.user.create.mockRejectedValue(dbError);

			await expect(service.handleUserCreated(clerkId)).rejects.toThrow(
				'Failed to create user from external auth provider',
			);
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

			await expect(service.handleUserDeleted(clerkId)).rejects.toThrow(
				'Failed to delete user from external auth provider',
			);
			expect(prisma.db.user.deleteMany).toHaveBeenCalledWith({
				where: {
					clerkId: 'clerk_user_123',
				},
			});
		});
	});
});
