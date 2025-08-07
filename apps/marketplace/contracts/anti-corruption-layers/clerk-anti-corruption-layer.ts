import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import { TransformationUtils } from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Anti-Corruption Layer for Clerk Integration
 *
 * Protects the Marketplace domain from Clerk's external API changes
 * and translates Clerk data to marketplace domain format
 */
@Injectable()
export class ClerkAntiCorruptionLayer {
	private readonly logger = new Logger('ClerkAntiCorruptionLayer');

	/**
	 * Validate Clerk user data
	 */
	private validateClerkUser(data: any): boolean {
		return data && data.id && typeof data.id === 'string';
	}

	/**
	 * Validate marketplace user data
	 */
	private validateMarketplaceUser(data: any): boolean {
		return data && data.email && typeof data.email === 'string';
	}

	// ============================================================================
	// Clerk → Marketplace Translation
	// ============================================================================

	/**
	 * Translate Clerk user data to marketplace user format
	 */
	toMarketplaceUser(clerkUser: any) {
		try {
			if (!this.validateClerkUser(clerkUser)) {
				throw new Error('Invalid Clerk user data');
			}

			const result = {
				clerkId: clerkUser.id,
				email: TransformationUtils.extractEmail(clerkUser),
				firstName: TransformationUtils.extractString(clerkUser, ['firstName']),
				lastName: TransformationUtils.extractString(clerkUser, ['lastName']),
				metadata: TransformationUtils.extractMetadata(clerkUser),
				createdAt: TransformationUtils.extractCreatedAt(clerkUser),
				updatedAt: TransformationUtils.extractUpdatedAt(clerkUser),
			};

			return result;
		} catch (error) {
			this.logger.error('Failed to translate Clerk user', error);
			throw error;
		}
	}

	/**
	 * Translate Clerk user update to marketplace format
	 */
	toMarketplaceUserUpdate(clerkUser: any, previousUser?: any) {
		try {
			if (!this.validateClerkUser(clerkUser)) {
				throw new Error('Invalid Clerk user data');
			}

			// Extract changes by comparing with previous user
			const changes: Record<string, any> = {};

			if (previousUser) {
				const currentEmail = TransformationUtils.extractEmail(clerkUser);
				const previousEmail = TransformationUtils.extractEmail(previousUser);
				if (currentEmail !== previousEmail) {
					changes.email = currentEmail;
				}

				const currentFirstName = TransformationUtils.extractString(clerkUser, ['firstName']);
				const previousFirstName = TransformationUtils.extractString(previousUser, ['firstName']);
				if (currentFirstName !== previousFirstName) {
					changes.firstName = currentFirstName;
				}

				const currentLastName = TransformationUtils.extractString(clerkUser, ['lastName']);
				const previousLastName = TransformationUtils.extractString(previousUser, ['lastName']);
				if (currentLastName !== previousLastName) {
					changes.lastName = currentLastName;
				}

				// Check for metadata changes
				const currentMetadata = TransformationUtils.extractMetadata(clerkUser);
				const previousMetadata = TransformationUtils.extractMetadata(previousUser);
				if (JSON.stringify(currentMetadata) !== JSON.stringify(previousMetadata)) {
					changes.metadata = currentMetadata;
				}
			} else {
				// New user - include all fields
				changes.email = TransformationUtils.extractEmail(clerkUser);
				changes.firstName = TransformationUtils.extractString(clerkUser, ['firstName']);
				changes.lastName = TransformationUtils.extractString(clerkUser, ['lastName']);
				changes.metadata = TransformationUtils.extractMetadata(clerkUser);
			}

			const result = {
				clerkId: clerkUser.id,
				changes,
				updatedAt: TransformationUtils.extractUpdatedAt(clerkUser),
			};

			return result;
		} catch (error) {
			this.logger.error('Failed to translate Clerk user update', error);
			throw error;
		}
	}

	/**
	 * Translate Clerk user deletion to marketplace format
	 */
	toMarketplaceUserDeletion(clerkUserId: string) {
		try {
			if (!clerkUserId || typeof clerkUserId !== 'string') {
				throw new Error('Invalid Clerk user ID');
			}

			const result = {
				clerkId: clerkUserId,
				deletedAt: new Date().toISOString(),
			};

			return result;
		} catch (error) {
			this.logger.error('Failed to translate Clerk user deletion', error);
			throw error;
		}
	}

	// ============================================================================
	// Marketplace → Clerk Translation
	// ============================================================================

	/**
	 * Translate marketplace user to Clerk format for API calls
	 */
	toClerkUser(marketplaceUser: {
		email: string;
		firstName?: string;
		lastName?: string;
		metadata?: Record<string, any>;
	}) {
		try {
			// Validate marketplace user data
			if (!this.validateMarketplaceUser(marketplaceUser)) {
				throw new Error('Invalid marketplace user data');
			}

			// Translate to Clerk format
			const clerkUser = {
				emailAddress: [marketplaceUser.email],
				firstName: marketplaceUser.firstName || '',
				lastName: marketplaceUser.lastName || '',
				publicMetadata: marketplaceUser.metadata || {},
			};

			return clerkUser;
		} catch (error) {
			this.logger.error('Failed to translate marketplace user to Clerk format', error);
			throw error;
		}
	}

	/**
	 * Translate marketplace user update to Clerk format
	 */
	toClerkUserUpdate(
		marketplaceUserId: string,
		updates: {
			email?: string;
			firstName?: string;
			lastName?: string;
			metadata?: Record<string, any>;
		},
	) {
		try {
			// Validate marketplace user update data
			if (!updates || Object.keys(updates).length === 0) {
				throw new Error('Invalid marketplace user update data');
			}

			// Translate to Clerk format
			const clerkUpdate: Record<string, any> = {};

			if (updates.email) {
				clerkUpdate.emailAddress = [updates.email];
			}

			if (updates.firstName !== undefined) {
				clerkUpdate.firstName = updates.firstName;
			}

			if (updates.lastName !== undefined) {
				clerkUpdate.lastName = updates.lastName;
			}

			if (updates.metadata) {
				clerkUpdate.publicMetadata = updates.metadata;
			}

			return clerkUpdate;
		} catch (error) {
			this.logger.error('Failed to translate marketplace user update to Clerk format', error);
			throw error;
		}
	}
}
