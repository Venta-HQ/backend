import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
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

interface UserRegistrationData {
	clerkId: string;
	source?: 'clerk_webhook' | 'manual' | 'admin';
}

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);

	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Register a new user in the marketplace
	 * Domain method for user registration with business logic
	 */
	async registerUser(registrationData: UserRegistrationData): Promise<UserProfile> {
		this.logger.log('Starting user registration process', {
			clerkId: registrationData.clerkId,
			source: registrationData.source || 'unknown',
		});

		try {
			const user = await this.prisma.db.user.create({
				data: {
					clerkId: registrationData.clerkId,
				},
			});

			this.logger.log('User registration completed successfully', {
				clerkId: registrationData.clerkId,
				source: registrationData.source,
				userId: user.id,
			});

			return user;
		} catch (error) {
			this.logger.error('Failed to register user', {
				clerkId: registrationData.clerkId,
				error,
				source: registrationData.source,
			});
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to register user', {
				clerkId: registrationData.clerkId,
				operation: 'register_user',
				source: registrationData.source,
			});
		}
	}

	/**
	 * Get user profile by ID
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
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to retrieve user profile', {
				operation: 'get_user_by_id',
				userId,
			});
		}
	}

	/**
	 * Update user location from location service events
	 * This method is called when the location service publishes a location.user_location_updated event
	 * It doesn't require user authorization since it's a system-level operation
	 */
	async updateUserLocation(userId: string, location: UserLocationData): Promise<UserProfile> {
		this.logger.log('Updating user location from location service', { location, userId });

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
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to update user location', {
				operation: 'update_user_location',
				userId,
			});
		}
	}

	/**
	 * Create user profile (legacy method - use registerUser for new registrations)
	 */
	async createUserProfile(clerkId: string): Promise<UserProfile> {
		this.logger.log('Creating new user profile', { clerkId });

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
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to create user profile', {
				clerkId,
				operation: 'create_user_profile',
			});
		}
	}

	/**
	 * Delete user profile and all associated data
	 * Domain method for user deletion with cleanup
	 */
	async deleteUserProfile(clerkId: string): Promise<void> {
		this.logger.log('Starting user profile deletion process', { clerkId });

		try {
			// Delete user and all associated data (cascade)
			await this.prisma.db.user.deleteMany({
				where: { clerkId },
			});

			this.logger.log('User profile and associated data deleted successfully', { clerkId });
		} catch (error) {
			this.logger.error('Failed to delete user profile', { clerkId, error });
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to delete user profile', {
				clerkId,
				operation: 'delete_user_profile',
			});
		}
	}
}
