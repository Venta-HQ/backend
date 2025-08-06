import { IntegrationType } from '@prisma/client';
import { clearMocks, data, mockPrisma } from '../../../../test/helpers/test-utils';
import { ClerkService } from './clerk.service';

describe('ClerkService', () => {
	let service: ClerkService;
	let prisma: any;

	beforeEach(() => {
		prisma = mockPrisma();
		service = new ClerkService(prisma);
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
			prisma.db.user.create.mockResolvedValue(expectedUser);

			const result = await service.handleUserCreated(clerkId);

			expect(result).toEqual(expectedUser);
			expect(prisma.db.user.create).toHaveBeenCalledWith(expectedCall);
		});

		it('should handle database errors gracefully', async () => {
			const dbError = new Error('Database connection failed');
			prisma.db.user.create.mockRejectedValue(dbError);

			await expect(service.handleUserCreated(clerkId)).rejects.toThrow('Database connection failed');
			expect(prisma.db.user.create).toHaveBeenCalledWith(expectedCall);
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
			prisma.db.user.findFirst.mockResolvedValue(existingUser);
			prisma.db.user.deleteMany.mockResolvedValue({ count: 1 });

			await service.handleUserDeleted(clerkId);

			expect(prisma.db.user.findFirst).toHaveBeenCalledWith(findFirstCall);
			expect(prisma.db.user.deleteMany).toHaveBeenCalledWith(deleteManyCall);
		});

		it('should handle deletion when user does not exist', async () => {
			prisma.db.user.findFirst.mockResolvedValue(null);
			prisma.db.user.deleteMany.mockResolvedValue({ count: 0 });

			await service.handleUserDeleted(clerkId);

			expect(prisma.db.user.findFirst).toHaveBeenCalledWith(findFirstCall);
			expect(prisma.db.user.deleteMany).toHaveBeenCalledWith(deleteManyCall);
		});

		it('should handle database errors during deletion', async () => {
			const dbError = new Error('Database connection failed');
			prisma.db.user.findFirst.mockRejectedValue(dbError);

			await expect(service.handleUserDeleted(clerkId)).rejects.toThrow('Database connection failed');
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

			await expect(service.createIntegration(integrationData)).rejects.toThrow('Database connection failed');
			expect(prisma.db.integration.create).toHaveBeenCalledWith(expectedCall);
		});
	});

	describe('deleteIntegration', () => {
		const integrationData = {
			providerId: 'clerk_user_123',
		};
		const expectedCall = {
			where: {
				providerId: 'clerk_user_123',
				type: IntegrationType.Clerk,
			},
		};

		it('should delete integration successfully', async () => {
			prisma.db.integration.deleteMany.mockResolvedValue({ count: 1 });

			await service.deleteIntegration(integrationData);

			expect(prisma.db.integration.deleteMany).toHaveBeenCalledWith(expectedCall);
		});

		it('should handle database errors during integration deletion', async () => {
			const dbError = new Error('Database connection failed');
			prisma.db.integration.deleteMany.mockRejectedValue(dbError);

			await expect(service.deleteIntegration(integrationData)).rejects.toThrow('Database connection failed');
			expect(prisma.db.integration.deleteMany).toHaveBeenCalledWith(expectedCall);
		});

		it('should handle deletion when integration does not exist', async () => {
			prisma.db.integration.deleteMany.mockResolvedValue({ count: 0 });

			await service.deleteIntegration(integrationData);

			expect(prisma.db.integration.deleteMany).toHaveBeenCalledWith(expectedCall);
		});
	});
});
