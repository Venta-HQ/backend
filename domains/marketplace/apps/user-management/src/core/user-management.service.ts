import { AppError, ErrorCodes } from '@app/nest/errors';
import { PrismaService } from '@app/nest/modules';
import { ClerkAntiCorruptionLayer } from '@domains/marketplace/contracts/anti-corruption-layers/clerk.acl';
import * as MarketplaceToLocationContextMapper from '@domains/marketplace/contracts/context-mappers/marketplace-to-location.context-mapper';
import { Marketplace } from '@domains/marketplace/contracts/types/context-mapping.types';
import { Injectable, Logger } from '@nestjs/common';
import { User as PrismaUser, UserSubscription as PrismaUserSubscription } from '@prisma/client';

/**
 * Service for managing user profiles and operations
 */
@Injectable()
export class UserManagementService {
	private readonly logger = new Logger(UserManagementService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly clerkACL: ClerkAntiCorruptionLayer,
		// Mappers are pure functions; no DI field
	) {}

	/**
	 * Register a new user in the marketplace
	 */
	async registerUser(request: Marketplace.Contracts.UserRegistrationRequest): Promise<Marketplace.Core.User> {
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
	async updateUserLocation(request: Marketplace.Contracts.UserLocationUpdate): Promise<Marketplace.Core.User> {
		this.logger.debug('Processing user location update', {
			userId: request.userId,
			location: request.location,
		});

		try {
			// Convert to location services format
			const locationData = MarketplaceToLocationContextMapper.toLocationUserLocation({
				userId: request.userId,
				lat: request.location.lat,
				long: request.location.long,
				updatedAt: new Date().toISOString(),
			});

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

			// Emit event
			const event: Marketplace.Events.UserDeleted = {
				userId: clerkId,
				timestamp: new Date().toISOString(),
			};

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
	 * Convert Prisma user to domain user
	 */
	private toDomainUser(
		user: PrismaUser & { subscription?: PrismaUserSubscription | null },
		location?: Marketplace.Core.UserLocation,
	): Marketplace.Core.User {
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
