import { UserDomainError, UserDomainErrorCodes } from '@app/nest/errors';
import { PrismaService } from '@app/nest/modules';
import { Injectable, Logger } from '@nestjs/common';

interface UserLocationData {
	lat: number;
	long: number;
}

interface UserProfile {
	clerkId: string;
	createdAt: Date;
	id: string;
	lat?: number;
	long?: number;
	updatedAt: Date;
}

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);

	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Get user profile by ID with domain validation
	 */
	async getUserById(userId: string): Promise<UserProfile | null> {
		this.logger.log('Getting user profile', { userId });

		try {
			const user = await this.prisma.db.user.findUnique({
				where: { id: userId },
			});

			if (!user) {
				this.logger.log('User not found', { userId });
				return null;
			}

			this.logger.log('User profile retrieved successfully', { userId });
			return user;
		} catch (error) {
			this.logger.error('Failed to get user profile', { error, userId });
			throw new UserDomainError(UserDomainErrorCodes.DATABASE_ERROR, 'Failed to retrieve user profile', {
				operation: 'get_user_by_id',
				userId,
			});
		}
	}

	/**
	 * Update user location from location service events
	 * This method is called when the location service publishes a user.location.updated event
	 * It doesn't require user authorization since it's a system-level operation
	 */
	async updateUserLocation(userId: string, location: UserLocationData): Promise<UserProfile> {
		this.logger.log('Updating user location from location service', { location, userId });

		// Domain validation
		await this.validateUserExists(userId);
		await this.validateLocationData(location);

		try {
			// Update user location in database
			const user = await this.prisma.db.user.update({
				data: {
					lat: location.lat,
					long: location.long,
				},
				where: {
					id: userId,
				},
			});

			this.logger.log('User location updated successfully', {
				location: `${location.lat}, ${location.long}`,
				userId,
			});

			return user;
		} catch (error) {
			this.logger.error('Failed to update user location in database', { error, userId });
			throw new UserDomainError(UserDomainErrorCodes.DATABASE_ERROR, 'Failed to update user location', {
				operation: 'update_user_location',
				userId,
			});
		}
	}

	/**
	 * Create user profile with domain validation
	 */
	async createUserProfile(clerkId: string): Promise<UserProfile> {
		this.logger.log('Creating new user profile', { clerkId });

		// Domain validation
		await this.validateUserDoesNotExist(clerkId);

		try {
			const user = await this.prisma.db.user.create({
				data: {
					clerkId,
				},
			});

			this.logger.log('User profile created successfully', { clerkId, userId: user.id });

			return user;
		} catch (error) {
			this.logger.error('Failed to create user profile', { clerkId, error });
			throw new UserDomainError(UserDomainErrorCodes.DATABASE_ERROR, 'Failed to create user profile', {
				clerkId,
				operation: 'create_user_profile',
			});
		}
	}

	/**
	 * Delete user profile with domain validation
	 */
	async deleteUserProfile(clerkId: string): Promise<void> {
		this.logger.log('Deleting user profile', { clerkId });

		// Domain validation
		await this.validateUserExists(clerkId);

		try {
			await this.prisma.db.user.delete({
				where: { clerkId },
			});

			this.logger.log('User profile deleted successfully', { clerkId });
		} catch (error) {
			this.logger.error('Failed to delete user profile', { clerkId, error });
			throw new UserDomainError(UserDomainErrorCodes.DATABASE_ERROR, 'Failed to delete user profile', {
				clerkId,
				operation: 'delete_user_profile',
			});
		}
	}

	/**
	 * Validate that user exists
	 */
	private async validateUserExists(identifier: string): Promise<void> {
		const user = await this.prisma.db.user.findFirst({
			where: {
				OR: [{ id: identifier }, { clerkId: identifier }],
			},
		});

		if (!user) {
			throw new UserDomainError(UserDomainErrorCodes.USER_NOT_FOUND, 'User not found', {
				identifier,
			});
		}
	}

	/**
	 * Validate that user does not exist (for creation)
	 */
	private async validateUserDoesNotExist(clerkId: string): Promise<void> {
		const existingUser = await this.prisma.db.user.findUnique({
			where: { clerkId },
		});

		if (existingUser) {
			throw new UserDomainError(UserDomainErrorCodes.USER_ALREADY_EXISTS, 'User already exists', {
				clerkId,
			});
		}
	}

	/**
	 * Validate location data according to domain rules
	 */
	private async validateLocationData(location: UserLocationData): Promise<void> {
		if (location.lat < -90 || location.lat > 90) {
			throw new UserDomainError(UserDomainErrorCodes.INVALID_LOCATION, 'Invalid latitude value', {
				lat: location.lat,
			});
		}

		if (location.long < -180 || location.long > 180) {
			throw new UserDomainError(UserDomainErrorCodes.INVALID_LOCATION, 'Invalid longitude value', {
				long: location.long,
			});
		}
	}
}
