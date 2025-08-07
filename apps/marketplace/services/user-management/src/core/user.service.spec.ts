import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@app/nest/errors';
import { UserService } from './user.service';

describe('UserService', () => {
	let service: UserService;
	let mockPrisma: any;

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

		service = new UserService(mockPrisma);
	});

	describe('updateUserLocation', () => {
		const userId = 'user-123';
		const location = { lat: 40.7128, long: -74.006 };

		it('should update user location successfully', async () => {
			const mockUser = { id: userId, lat: location.lat, long: location.long };
			mockPrisma.db.user.update.mockResolvedValue(mockUser);

			const result = await service.updateUserLocation(userId, location);

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
			const dbError = new Error('Database connection failed');
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
