import { IntegrationType } from '@prisma/client';
import { clearMocks, data, mockPrisma } from '@test/helpers/test-utils';
import { ClerkAntiCorruptionLayer } from '../../../../contracts/anti-corruption-layers/clerk-anti-corruption-layer';
import { AuthService } from './auth.service';

describe('AuthService', () => {
	let service: AuthService;
	let prisma: any;
	let mockClerkACL: any;

	beforeEach(() => {
		prisma = mockPrisma();
		mockClerkACL = {
			validateUserCreationData: vi.fn(),
			validateUserDeletionData: vi.fn(),
		};
		service = new AuthService(prisma, mockClerkACL);
	});

	afterEach(() => {
		clearMocks();
	});

	describe('handleUserCreated', () => {
		const clerkId = 'clerk_user_123';
		const expectedUser = data.user({ clerkId });
		const expectedCall = {
			data: {
				clerkId: 'clerk_user_123',
			},
			select: { clerkId: true, id: true },
		};

		it('should create user and emit event successfully', async () => {
			const validatedData = { clerkId: 'clerk_user_123' };
			mockClerkACL.validateUserCreationData.mockReturnValue(validatedData);
			prisma.db.user.count.mockResolvedValue(0);
			prisma.db.user.create.mockResolvedValue(expectedUser);

			const result = await service.handleUserCreated(clerkId);

			expect(mockClerkACL.validateUserCreationData).toHaveBeenCalledWith({ clerkId });
			expect(result).toEqual(expectedUser);
			expect(prisma.db.user.create).toHaveBeenCalledWith(expectedCall);
		});

		it('should handle database errors gracefully', async () => {
			const dbError = new Error('Database connection failed');
			prisma.db.user.count.mockRejectedValue(dbError);

			await expect(service.handleUserCreated(clerkId)).rejects.toThrow('Failed to handle user identity creation');
		});
	});

	describe('handleUserDeleted', () => {
		const clerkId = 'clerk_user_123';
		const existingUser = data.user({ clerkId });
		const findFirstCall = {
			select: { clerkId: true, id: true },
			where: { clerkId: 'clerk_user_123' },
		};
		const deleteManyCall = {
			where: {
				clerkId: 'clerk_user_123',
			},
		};

		it('should delete user and emit event when user exists', async () => {
			const validatedData = { clerkId: 'clerk_user_123' };
			mockClerkACL.validateUserDeletionData.mockReturnValue(validatedData);
			prisma.db.user.findFirst.mockResolvedValue(existingUser);
			prisma.db.user.deleteMany.mockResolvedValue({ count: 1 });

			await service.handleUserDeleted(clerkId);

			expect(mockClerkACL.validateUserDeletionData).toHaveBeenCalledWith({ clerkId });
			expect(prisma.db.user.findFirst).toHaveBeenCalledWith(findFirstCall);
			expect(prisma.db.user.deleteMany).toHaveBeenCalledWith(deleteManyCall);
		});

		it('should handle deletion when user does not exist', async () => {
			const validatedData = { clerkId: 'clerk_user_123' };
			mockClerkACL.validateUserDeletionData.mockReturnValue(validatedData);
			prisma.db.user.findFirst.mockResolvedValue(null);
			prisma.db.user.deleteMany.mockResolvedValue({ count: 0 });

			await service.handleUserDeleted(clerkId);

			expect(mockClerkACL.validateUserDeletionData).toHaveBeenCalledWith({ clerkId });
			expect(prisma.db.user.findFirst).toHaveBeenCalledWith(findFirstCall);
			expect(prisma.db.user.deleteMany).not.toHaveBeenCalled();
		});

		it('should handle database errors during deletion', async () => {
			const validatedData = { clerkId: 'clerk_user_123' };
			mockClerkACL.validateUserDeletionData.mockReturnValue(validatedData);
			const dbError = new Error('Database connection failed');
			prisma.db.user.findFirst.mockRejectedValue(dbError);

			await expect(service.handleUserDeleted(clerkId)).rejects.toThrow('Failed to handle user identity deletion');
			expect(mockClerkACL.validateUserDeletionData).toHaveBeenCalledWith({ clerkId });
			expect(prisma.db.user.findFirst).toHaveBeenCalledWith(findFirstCall);
		});
	});

	describe('createIntegration', () => {
		const integrationData = {
			clerkUserId: 'user_123',
			providerId: 'clerk_user_123',
		};
		const expectedIntegration = data.integration(integrationData);
		const expectedCall = {
			data: {
				data: null,
				providerId: 'clerk_user_123',
				type: IntegrationType.Clerk,
				user: {
					connect: {
						clerkId: 'user_123',
					},
				},
			},
		};

		it('should create integration successfully', async () => {
			prisma.db.integration.create.mockResolvedValue(expectedIntegration);

			await service.createIntegration(integrationData);

			expect(prisma.db.integration.create).toHaveBeenCalledWith(expectedCall);
		});

		it('should handle database errors during integration creation', async () => {
			const dbError = new Error('Database connection failed');
			prisma.db.integration.create.mockRejectedValue(dbError);

			await expect(service.createIntegration(integrationData)).rejects.toThrow(
				'Failed to create authentication integration record',
			);
			expect(prisma.db.integration.create).toHaveBeenCalledWith(expectedCall);
		});
	});

	describe('deleteIntegration', () => {
		const integrationData = {
			providerId: 'clerk_user_123',
		};
		const existingIntegration = data.integration(integrationData);
		const findFirstCall = {
			select: { id: true, userId: true },
			where: {
				providerId: 'clerk_user_123',
				type: IntegrationType.Clerk,
			},
		};
		const deleteManyCall = {
			where: {
				providerId: 'clerk_user_123',
				type: IntegrationType.Clerk,
			},
		};

		it('should delete integration successfully', async () => {
			prisma.db.integration.findFirst.mockResolvedValue(existingIntegration);
			prisma.db.integration.deleteMany.mockResolvedValue({ count: 1 });

			await service.deleteIntegration(integrationData);

			expect(prisma.db.integration.findFirst).toHaveBeenCalledWith(findFirstCall);
			expect(prisma.db.integration.deleteMany).toHaveBeenCalledWith(deleteManyCall);
		});

		it('should handle database errors during integration deletion', async () => {
			const dbError = new Error('Database connection failed');
			prisma.db.integration.findFirst.mockRejectedValue(dbError);

			await expect(service.deleteIntegration(integrationData)).rejects.toThrow(
				'Failed to delete authentication integration record',
			);
			expect(prisma.db.integration.findFirst).toHaveBeenCalledWith(findFirstCall);
		});
	});
});
