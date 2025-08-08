import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@app/nest/errors';
import { MarketplaceToCommunicationContextMapper } from '../../../../contracts/context-mappers/marketplace-to-communication-context-mapper';
import { MarketplaceToInfrastructureContextMapper } from '../../../../contracts/context-mappers/marketplace-to-infrastructure-context-mapper';
import { MarketplaceToLocationContextMapper } from '../../../../contracts/context-mappers/marketplace-to-location-context-mapper';
import { UserService } from './user.service';

describe('UserService', () => {
	let service: UserService;
	let mockPrisma: any;
	let mockLocationContextMapper: any;
	let mockCommunicationContextMapper: any;
	let mockInfrastructureContextMapper: any;

	beforeEach(() => {
		mockPrisma = {
			db: {
				user: {
					create: vi.fn(),
					deleteMany: vi.fn(),
					findUnique: vi.fn(),
					update: vi.fn(),
				},
			},
		};

		mockLocationContextMapper = {
			toLocationServicesUserUpdate: vi.fn(),
		};

		mockCommunicationContextMapper = {
			toCommunicationUserCreated: vi.fn(),
		};

		mockInfrastructureContextMapper = {
			toInfrastructureEvent: vi.fn(),
		};

		service = new UserService(
			mockPrisma,
			mockLocationContextMapper,
			mockCommunicationContextMapper,
			mockInfrastructureContextMapper,
		);
	});

	describe('updateUserLocation', () => {
		const userId = 'user-123';
		const location = { lat: 40.7128, long: -74.006 };

		it('should update user location successfully with context mapper', async () => {
			const mockLocationServicesData = {
				entityId: userId,
				coordinates: { latitude: location.lat, longitude: location.long },
				trackingStatus: 'active',
				accuracy: 5.0,
				lastUpdateTime: new Date().toISOString(),
				source: 'marketplace',
			};
			const mockUser = { id: userId, lat: location.lat, long: location.long };

			mockLocationContextMapper.toLocationServicesUserUpdate.mockReturnValue(mockLocationServicesData);
			mockPrisma.db.user.update.mockResolvedValue(mockUser);

			const result = await service.updateUserLocation(userId, location);

			expect(mockLocationContextMapper.toLocationServicesUserUpdate).toHaveBeenCalledWith(userId, {
				lat: location.lat,
				lng: location.long,
			});
			expect(mockPrisma.db.user.update).toHaveBeenCalledWith({
				data: {
					lat: mockLocationServicesData.coordinates.latitude,
					long: mockLocationServicesData.coordinates.longitude,
				},
				where: {
					id: userId,
				},
			});
			expect(result).toEqual(mockUser);
		});

		it('should handle database errors gracefully', async () => {
			const mockLocationServicesData = {
				entityId: userId,
				coordinates: { latitude: location.lat, longitude: location.long },
				trackingStatus: 'active',
				accuracy: 5.0,
				lastUpdateTime: new Date().toISOString(),
				source: 'marketplace',
			};
			const dbError = new Error('Database connection failed');

			mockLocationContextMapper.toLocationServicesUserUpdate.mockReturnValue(mockLocationServicesData);
			mockPrisma.db.user.update.mockRejectedValue(dbError);

			await expect(service.updateUserLocation(userId, location)).rejects.toThrow(AppError);
		});
	});

	describe('getUserById', () => {
		const userId = 'user-123';

		it('should return user when found', async () => {
			const mockUser = { clerkId: 'clerk-123', id: userId };
			mockPrisma.db.user.findUnique.mockResolvedValue(mockUser);

			const result = await service.getUserById(userId);

			expect(mockPrisma.db.user.findUnique).toHaveBeenCalledWith({
				where: { id: userId },
			});
			expect(result).toEqual(mockUser);
		});

		it('should return null when user not found', async () => {
			mockPrisma.db.user.findUnique.mockResolvedValue(null);

			const result = await service.getUserById(userId);

			expect(result).toBeNull();
		});

		it('should handle database errors', async () => {
			const dbError = new Error('Database connection failed');
			mockPrisma.db.user.findUnique.mockRejectedValue(dbError);

			await expect(service.getUserById(userId)).rejects.toThrow(AppError);
		});
	});

	describe('createUserProfile', () => {
		const clerkId = 'clerk-123';

		it('should create user profile successfully', async () => {
			const mockUser = { clerkId, id: 'user-123' };
			mockPrisma.db.user.create.mockResolvedValue(mockUser);

			const result = await service.createUserProfile(clerkId);

			expect(mockPrisma.db.user.create).toHaveBeenCalledWith({
				data: { clerkId },
			});
			expect(result).toEqual(mockUser);
		});

		it('should handle database errors', async () => {
			const dbError = new Error('Database connection failed');
			mockPrisma.db.user.create.mockRejectedValue(dbError);

			await expect(service.createUserProfile(clerkId)).rejects.toThrow(AppError);
		});
	});

	describe('deleteUserProfile', () => {
		const clerkId = 'clerk-123';

		it('should delete user profile successfully', async () => {
			mockPrisma.db.user.deleteMany.mockResolvedValue({ count: 1 });

			await service.deleteUserProfile(clerkId);

			expect(mockPrisma.db.user.deleteMany).toHaveBeenCalledWith({
				where: { clerkId },
			});
		});

		it('should handle database errors', async () => {
			const dbError = new Error('Database connection failed');
			mockPrisma.db.user.deleteMany.mockRejectedValue(dbError);

			await expect(service.deleteUserProfile(clerkId)).rejects.toThrow(AppError);
		});
	});
});
