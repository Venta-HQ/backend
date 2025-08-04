import { Logger } from '@nestjs/common';
import { IntegrationType } from '@prisma/client';
import { clearMocks, data, errors, mockEvents, mockPrisma } from '../../../../test/helpers/test-utils';
import { ClerkService } from './clerk.service';

describe('ClerkService', () => {
	let service: ClerkService;
	let prisma: any;
	let events: any;

	beforeEach(() => {
		prisma = mockPrisma();
		events = mockEvents();
		service = new ClerkService(prisma, events);
	});

	afterEach(() => {
		clearMocks();
	});

	describe('handleUserCreated', () => {
		it('should create user and emit event successfully', async () => {
			const clerkId = 'clerk_user_123';
			const expectedUser = data.user({ clerkId });

			prisma.db.user.create.mockResolvedValue(expectedUser);
			events.publishEvent.mockResolvedValue(undefined);

			const result = await service.handleUserCreated(clerkId);

			expect(result).toEqual(expectedUser);
			expect(prisma.db.user.create).toHaveBeenCalledWith({
				data: {
					clerkId: 'clerk_user_123',
				},
				select: { clerkId: true, id: true },
			});
			expect(events.publishEvent).toHaveBeenCalledWith('user.created', {
				clerkId: 'clerk_user_123',
				timestamp: expect.any(String),
				userId: expectedUser.id,
			});
		});

		it('should handle database errors gracefully', async () => {
			const clerkId = 'clerk_user_123';
			const dbError = errors.database('Database connection failed');
			prisma.db.user.create.mockRejectedValue(dbError);

			await expect(service.handleUserCreated(clerkId)).rejects.toThrow('Database connection failed');
			expect(prisma.db.user.create).toHaveBeenCalledWith({
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
			const existingUser = data.user({ clerkId });

			prisma.db.user.findFirst.mockResolvedValue(existingUser);
			prisma.db.user.deleteMany.mockResolvedValue({ count: 1 });
			events.publishEvent.mockResolvedValue(undefined);

			await service.handleUserDeleted(clerkId);

			expect(prisma.db.user.findFirst).toHaveBeenCalledWith({
				select: { clerkId: true, id: true },
				where: { clerkId: 'clerk_user_123' },
			});
			expect(prisma.db.user.deleteMany).toHaveBeenCalledWith({
				where: {
					clerkId: 'clerk_user_123',
				},
			});
			expect(events.publishEvent).toHaveBeenCalledWith('user.deleted', {
				clerkId: 'clerk_user_123',
				timestamp: expect.any(String),
				userId: existingUser.id,
			});
		});

		it('should handle deletion when user does not exist', async () => {
			const clerkId = 'non_existent_user';

			prisma.db.user.findFirst.mockResolvedValue(null);
			prisma.db.user.deleteMany.mockResolvedValue({ count: 0 });

			await service.handleUserDeleted(clerkId);

			expect(prisma.db.user.findFirst).toHaveBeenCalledWith({
				select: { clerkId: true, id: true },
				where: { clerkId: 'non_existent_user' },
			});
			expect(prisma.db.user.deleteMany).toHaveBeenCalledWith({
				where: {
					clerkId: 'non_existent_user',
				},
			});
			expect(events.publishEvent).not.toHaveBeenCalled();
		});

		it('should handle database errors during deletion', async () => {
			const clerkId = 'clerk_user_123';
			const dbError = errors.database('Database connection failed');
			prisma.db.user.findFirst.mockRejectedValue(dbError);

			await expect(service.handleUserDeleted(clerkId)).rejects.toThrow('Database connection failed');
			expect(prisma.db.user.findFirst).toHaveBeenCalledWith({
				select: { clerkId: true, id: true },
				where: { clerkId: 'clerk_user_123' },
			});
		});
	});

	describe('createIntegration', () => {
		it('should create integration successfully', async () => {
			const integrationData = {
				providerId: 'clerk_user_123',
				userId: 'user_123',
			};
			const expectedIntegration = data.integration(integrationData);

			prisma.db.integration.create.mockResolvedValue(expectedIntegration);

			await service.createIntegration(integrationData);

			expect(prisma.db.integration.create).toHaveBeenCalledWith({
				data: {
					config: { data: null, providerId: 'clerk_user_123' },
					type: IntegrationType.Clerk,
					userId: 'user_123',
				},
			});
		});

		it('should handle database errors during integration creation', async () => {
			const integrationData = {
				providerId: 'clerk_user_123',
				userId: 'user_123',
			};
			const dbError = errors.database('Database connection failed');
			prisma.db.integration.create.mockRejectedValue(dbError);

			await expect(service.createIntegration(integrationData)).rejects.toThrow('Database connection failed');
			expect(prisma.db.integration.create).toHaveBeenCalledWith({
				data: {
					config: { data: null, providerId: 'clerk_user_123' },
					type: IntegrationType.Clerk,
					userId: 'user_123',
				},
			});
		});
	});

	describe('deleteIntegration', () => {
		it('should delete integration successfully', async () => {
			const integrationData = {
				providerId: 'clerk_user_123',
			};

			prisma.db.integration.deleteMany.mockResolvedValue({ count: 1 });

			await service.deleteIntegration(integrationData);

			expect(prisma.db.integration.deleteMany).toHaveBeenCalledWith({
				where: {
					config: {
						equals: 'clerk_user_123',
						path: ['providerId'],
					},
					type: IntegrationType.Clerk,
				},
			});
		});

		it('should handle database errors during integration deletion', async () => {
			const integrationData = {
				providerId: 'clerk_user_123',
			};
			const dbError = errors.database('Database connection failed');
			prisma.db.integration.deleteMany.mockRejectedValue(dbError);

			await expect(service.deleteIntegration(integrationData)).rejects.toThrow('Database connection failed');
			expect(prisma.db.integration.deleteMany).toHaveBeenCalledWith({
				where: {
					config: {
						equals: 'clerk_user_123',
						path: ['providerId'],
					},
					type: IntegrationType.Clerk,
				},
			});
		});

		it('should handle deletion when integration does not exist', async () => {
			const integrationData = {
				providerId: 'non_existent_integration',
			};

			prisma.db.integration.deleteMany.mockResolvedValue({ count: 0 });

			await service.deleteIntegration(integrationData);

			expect(prisma.db.integration.deleteMany).toHaveBeenCalledWith({
				where: {
					config: {
						equals: 'non_existent_integration',
						path: ['providerId'],
					},
					type: IntegrationType.Clerk,
				},
			});
		});
	});
});
