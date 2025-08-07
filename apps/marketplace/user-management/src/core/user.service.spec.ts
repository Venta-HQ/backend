import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserDomainError } from '@app/nest/errors/domain-errors';
import { UserService } from './user.service';

describe('UserService', () => {
	let service: UserService;
	let mockPrisma: any;
	let mockEventService: any;

	beforeEach(() => {
		mockPrisma = {
			db: {
				user: {
					create: vi.fn(),
					delete: vi.fn(),
					findFirst: vi.fn(),
					findUnique: vi.fn(),
					update: vi.fn(),
				},
			},
		};

		mockEventService = {
			emit: vi.fn(),
		};

		service = new UserService(mockPrisma, mockEventService);
	});

	describe('updateUserLocation', () => {
		const userId = 'user-123';
		const location = { lat: 40.7128, long: -74.006 };

		it('should update user location successfully', async () => {
			// Mock user exists validation
			mockPrisma.db.user.findFirst.mockResolvedValue({ clerkId: 'clerk-123', id: userId });

			const mockUser = { id: userId, lat: location.lat, long: location.long };
			mockPrisma.db.user.update.mockResolvedValue(mockUser);

			const result = await service.updateUserLocation(userId, location);

			expect(mockPrisma.db.user.findFirst).toHaveBeenCalledWith({
				where: {
					OR: [{ id: userId }, { clerkId: userId }],
				},
			});
			expect(mockPrisma.db.user.update).toHaveBeenCalledWith({
				data: {
					lat: location.lat,
					long: location.long,
				},
				where: {
					id: userId,
				},
			});
			expect(result).toEqual(mockUser);
		});

		it('should handle database errors gracefully', async () => {
			// Mock user exists validation
			mockPrisma.db.user.findFirst.mockResolvedValue({ clerkId: 'clerk-123', id: userId });

			const dbError = new Error('Database connection failed');
			mockPrisma.db.user.update.mockRejectedValue(dbError);

			await expect(service.updateUserLocation(userId, location)).rejects.toThrow(UserDomainError);
		});

		it('should throw error when user does not exist', async () => {
			mockPrisma.db.user.findFirst.mockResolvedValue(null);

			await expect(service.updateUserLocation(userId, location)).rejects.toThrow(UserDomainError);
		});

		it('should throw error for invalid latitude', async () => {
			const invalidLocation = { lat: 100, long: -74.006 }; // Invalid latitude > 90
			mockPrisma.db.user.findFirst.mockResolvedValue({ clerkId: 'clerk-123', id: userId });

			await expect(service.updateUserLocation(userId, invalidLocation)).rejects.toThrow(UserDomainError);
		});

		it('should throw error for invalid longitude', async () => {
			const invalidLocation = { lat: 40.7128, long: 200 }; // Invalid longitude > 180
			mockPrisma.db.user.findFirst.mockResolvedValue({ clerkId: 'clerk-123', id: userId });

			await expect(service.updateUserLocation(userId, invalidLocation)).rejects.toThrow(UserDomainError);
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

			await expect(service.getUserById(userId)).rejects.toThrow(UserDomainError);
		});
	});

	describe('createUserProfile', () => {
		const clerkId = 'clerk-123';

		it('should create user profile successfully', async () => {
			// Mock user does not exist validation
			mockPrisma.db.user.findUnique.mockResolvedValue(null);

			const mockUser = { clerkId, id: 'user-123' };
			mockPrisma.db.user.create.mockResolvedValue(mockUser);

			const result = await service.createUserProfile(clerkId);

			expect(mockPrisma.db.user.findUnique).toHaveBeenCalledWith({
				where: { clerkId },
			});
			expect(mockPrisma.db.user.create).toHaveBeenCalledWith({
				data: { clerkId },
			});
			expect(result).toEqual(mockUser);
		});

		it('should throw error when user already exists', async () => {
			mockPrisma.db.user.findUnique.mockResolvedValue({ clerkId, id: 'user-123' });

			await expect(service.createUserProfile(clerkId)).rejects.toThrow(UserDomainError);
		});
	});

	describe('deleteUserProfile', () => {
		const clerkId = 'clerk-123';

		it('should delete user profile successfully', async () => {
			// Mock user exists validation
			mockPrisma.db.user.findFirst.mockResolvedValue({ clerkId, id: 'user-123' });

			mockPrisma.db.user.delete.mockResolvedValue({ clerkId, id: 'user-123' });

			await service.deleteUserProfile(clerkId);

			expect(mockPrisma.db.user.findFirst).toHaveBeenCalledWith({
				where: {
					OR: [{ id: clerkId }, { clerkId }],
				},
			});
			expect(mockPrisma.db.user.delete).toHaveBeenCalledWith({
				where: { clerkId },
			});
		});

		it('should throw error when user does not exist', async () => {
			mockPrisma.db.user.findFirst.mockResolvedValue(null);

			await expect(service.deleteUserProfile(clerkId)).rejects.toThrow(UserDomainError);
		});
	});
});
