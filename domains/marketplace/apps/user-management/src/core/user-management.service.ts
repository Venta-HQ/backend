import { Injectable, Logger } from '@nestjs/common';
import { User as PrismaUser, UserSubscription as PrismaUserSubscription } from '@prisma/client';
// Import specific domain types instead of namespace
import type {
	SubscriptionCreate,
	UserLocationUpdate,
	UserRegistrationRequest,
} from '@venta/domains/marketplace/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { PrismaService } from '@venta/nest/modules';

// Removed SubscriptionService dependency - handling subscriptions directly

/**
 * Service for managing user profiles and operations
 */
@Injectable()
export class UserManagementService {
	private readonly logger = new Logger(UserManagementService.name);

	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Register a new user in the marketplace
	 */
	async registerUser(request: UserRegistrationRequest): Promise<{ id: string; clerkId: string }> {
		this.logger.debug('Processing user registration', {
			clerkId: request.clerkId,
			source: request.source,
		});

		try {
			// Create user in database
			const user = await this.prisma.db.user.create({
				data: {
					clerkId: request.clerkId,
					lat: null,
					long: null,
				},
				include: {
					subscription: true,
				},
			});

			// Convert to domain model
			return this.toDomainUser(user);
		} catch (error) {
			this.logger.error('Failed to register user', {
				clerkId: request.clerkId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'create_user',
				clerkId: request.clerkId,
				source: request.source,
			});
		}
	}

	/**
	 * Get user profile by ID
	 */
	async getUserById(userId: string): Promise<Marketplace.Core.User | null> {
		this.logger.debug('Retrieving user profile', { userId });

		try {
			const user = await this.prisma.db.user.findUnique({
				where: { id: userId },
				include: {
					subscription: true,
				},
			});

			if (!user) {
				return null;
			}

			// Convert to domain model
			return this.toDomainUser(user);
		} catch (error) {
			this.logger.error('Failed to get user profile', {
				userId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'get_user_by_id',
				userId,
			});
		}
	}

	/**
	 * Update user location
	 */
	async updateUserLocation(request: UserLocationUpdate): Promise<{ id: string; lat: number; lng: number }> {
		this.logger.debug('Processing user location update', {
			userId: request.userId,
			location: request.location,
		});

		try {
			// Expect validated location data from controller
			const locationData = {
				lat: request.location.lat,
				lng: request.location.lng, // Note: using 'lng' which is the correct DB field
			};

			// Update user location
			const user = await this.prisma.db.user.update({
				where: { id: request.userId },
				data: {
					lat: locationData.lat,
					long: locationData.long,
				},
				include: {
					subscription: true,
				},
			});

			// Convert to domain model
			return this.toDomainUser(user, {
				lat: user.lat || 0,
				long: user.long || 0,
				userId: user.id,
				updatedAt: user.updatedAt.toISOString(),
			});
		} catch (error) {
			this.logger.error('Failed to update user location', {
				userId: request.userId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'update_user_location',
				userId: request.userId,
			});
		}
	}

	/**
	 * Delete user profile
	 */
	async deleteUserProfile(clerkId: string): Promise<void> {
		this.logger.debug('Processing user deletion', { clerkId });

		try {
			// Delete user and all associated data (cascade)
			await this.prisma.db.user.deleteMany({
				where: { clerkId },
			});

			this.logger.debug('User deleted successfully', { clerkId });
		} catch (error) {
			this.logger.error('Failed to delete user', {
				clerkId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'delete_user',
				clerkId,
			});
		}
	}

	/**
	 * Delete user by ID
	 */
	async deleteUser(userId: string): Promise<void> {
		this.logger.debug('Processing user deletion', { userId });

		try {
			// Delete user and all associated data (cascade)
			await this.prisma.db.user.deleteMany({
				where: { id: userId },
			});

			this.logger.debug('User deleted successfully', { userId });
		} catch (error) {
			this.logger.error('Failed to delete user', {
				userId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'delete_user',
				userId,
			});
		}
	}

	/**
	 * Create subscription
	 */
	async createSubscription(subscriptionData: SubscriptionCreate): Promise<void> {
		this.logger.debug('Creating subscription', {
			userId: subscriptionData.userId,
			providerId: subscriptionData.providerId,
		});

		try {
			// Create subscription directly in this service
			await this.prisma.db.userSubscription.create({
				data: {
					status: 'active',
					provider: 'revenuecat',
					externalId: subscriptionData.data.transactionId,
					productId: subscriptionData.data.productId,
					startDate: new Date().toISOString(),
					user: {
						connect: {
							id: subscriptionData.userId,
						},
					},
				},
			});

			this.logger.debug('Subscription created successfully', {
				userId: subscriptionData.userId,
				providerId: subscriptionData.providerId,
			});
		} catch (error) {
			this.logger.error('Failed to create subscription', {
				userId: subscriptionData.userId,
				error: error.message,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'create_subscription',
				userId: subscriptionData.userId,
			});
		}
	}

	/**
	 * Get vendors associated with a user by user ID
	 */
	async getUserVendors(userId: string): Promise<PrismaUser[]> {
		this.logger.debug('Getting vendors for user', { userId });
		try {
			const vendors = await this.prisma.db.user.findMany({
				where: {
					id: userId,
				},
				include: {
					vendors: true,
				},
			});
			this.logger.debug('Vendors retrieved successfully for user', { userId });
			return vendors;
		} catch (error) {
			this.logger.error('Failed to get vendors for user', { error: error.message, userId });
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'get_user_vendors',
				userId,
			});
		}
	}

	/**
	 * Convert Prisma user to domain user
	 */
	private toDomainUser(
		user: PrismaUser & { subscription?: PrismaUserSubscription | null },
		location?: { lat: number; lng: number; userId: string; updatedAt: string },
	): {
		id: string;
		email: string | null;
		firstName?: string;
		lastName?: string;
		createdAt: string;
		updatedAt: string;
		isActive: boolean;
		subscription?: {
			id: string;
			userId: string;
			status: 'active' | 'cancelled' | 'expired';
			provider: 'revenuecat';
			externalId: string;
			productId: string;
			startDate: string;
			endDate?: string;
		};
		location?: { lat: number; lng: number; userId: string; updatedAt: string };
	} {
		return {
			id: user.id,
			email: user.email,
			firstName: user.firstName || undefined,
			lastName: user.lastName || undefined,
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
			isActive: user.isActive,
			subscription: user.subscription
				? {
						id: user.subscription.id,
						userId: user.subscription.userId,
						status: user.subscription.status.toLowerCase() as 'active' | 'cancelled' | 'expired',
						provider: user.subscription.provider.toLowerCase() as 'revenuecat',
						externalId: user.subscription.externalId,
						productId: user.subscription.productId,
						startDate: user.subscription.startDate.toISOString(),
						endDate: user.subscription.endDate?.toISOString(),
					}
				: undefined,
			location,
		};
	}
}
