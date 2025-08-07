import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@app/nest/errors';
import { UserService } from './user.service';

describe('UserService', () => {
	let service: UserService;
	let mockPrisma: any;
	let mockEventService: any;

	beforeEach(() => {
		mockPrisma = {
			db: {
				user: {
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
}); 