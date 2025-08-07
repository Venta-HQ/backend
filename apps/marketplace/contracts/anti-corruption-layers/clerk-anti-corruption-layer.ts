import { BaseAntiCorruptionLayer } from '@app/nest/modules/contracts';
import { Injectable } from '@nestjs/common';

/**
 * Anti-Corruption Layer for Clerk Integration
 *
 * Protects the Marketplace domain from Clerk's external API changes
 * and translates Clerk data to marketplace domain format
 */
@Injectable()
export class ClerkAntiCorruptionLayer extends BaseAntiCorruptionLayer {
	constructor() {
		super('ClerkAntiCorruptionLayer');
	}

	getExternalService(): string {
		return 'clerk';
	}

	getDomain(): string {
		return 'marketplace';
	}

	validateExternalData(data: any): boolean {
		return this.validateExternalUser(data);
	}

	validateMarketplaceData(data: any): boolean {
		return this.validateMarketplaceUser(data);
	}

	// ============================================================================
	// Clerk → Marketplace Translation
	// ============================================================================

	/**
	 * Translate Clerk user data to marketplace user format
	 */
	toMarketplaceUser(clerkUser: any) {
		this.logTranslationStart('toMarketplaceUser', { clerkUserId: clerkUser?.id });

		try {
			if (!this.validateExternalData(clerkUser)) {
				throw this.createValidationError('Invalid Clerk user data', { clerkUser });
			}

			const result = {
				clerkId: clerkUser.id,
				email: this.extractEmail(clerkUser),
				firstName: this.extractFirstName(clerkUser),
				lastName: this.extractLastName(clerkUser),
				metadata: this.extractMetadata(clerkUser),
				createdAt: this.extractCreatedAt(clerkUser),
				updatedAt: this.extractUpdatedAt(clerkUser),
			};

			this.logTranslationSuccess('toMarketplaceUser', result);
			return result;
		} catch (error) {
			this.logTranslationError('toMarketplaceUser', error, { clerkUser });
			throw error;
		}
	}

	/**
	 * Translate Clerk user update to marketplace format
	 */
	toMarketplaceUserUpdate(clerkUser: any, previousUser?: any) {
		this.logTranslationStart('toMarketplaceUserUpdate', { clerkUserId: clerkUser?.id });

		try {
			if (!this.validateExternalData(clerkUser)) {
				throw this.createValidationError('Invalid Clerk user data', { clerkUser });
			}

			// Extract changes by comparing with previous user
			const changes: Record<string, any> = {};

			if (previousUser) {
				if (this.extractEmail(clerkUser) !== this.extractEmail(previousUser)) {
					changes.email = this.extractEmail(clerkUser);
				}

				if (this.extractFirstName(clerkUser) !== this.extractFirstName(previousUser)) {
					changes.firstName = this.extractFirstName(clerkUser);
				}

				if (this.extractLastName(clerkUser) !== this.extractLastName(previousUser)) {
					changes.lastName = this.extractLastName(clerkUser);
				}

				// Check for metadata changes
				const currentMetadata = this.extractMetadata(clerkUser);
				const previousMetadata = this.extractMetadata(previousUser);
				if (JSON.stringify(currentMetadata) !== JSON.stringify(previousMetadata)) {
					changes.metadata = currentMetadata;
				}
			} else {
				// New user - include all fields
				changes.email = this.extractEmail(clerkUser);
				changes.firstName = this.extractFirstName(clerkUser);
				changes.lastName = this.extractLastName(clerkUser);
				changes.metadata = this.extractMetadata(clerkUser);
			}

			const result = {
				clerkId: clerkUser.id,
				changes,
				updatedAt: this.extractUpdatedAt(clerkUser),
			};

			this.logTranslationSuccess('toMarketplaceUserUpdate', result);
			return result;
		} catch (error) {
			this.logTranslationError('toMarketplaceUserUpdate', error, { clerkUser, previousUser });
			throw error;
		}
	}

	/**
	 * Translate Clerk user deletion to marketplace format
	 */
	toMarketplaceUserDeletion(clerkUserId: string) {
		this.logTranslationStart('toMarketplaceUserDeletion', { clerkUserId });

		try {
			if (!this.validateExternalUserId(clerkUserId)) {
				throw this.createValidationError('Invalid Clerk user ID', { clerkUserId });
			}

			const result = {
				clerkId: clerkUserId,
				deletedAt: new Date().toISOString(),
			};

			this.logTranslationSuccess('toMarketplaceUserDeletion', result);
			return result;
		} catch (error) {
			this.logTranslationError('toMarketplaceUserDeletion', error, { clerkUserId });
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
		this.logger.debug('Translating marketplace user to Clerk format', {
			email: marketplaceUser.email,
		});

		try {
			// Validate marketplace user data
			if (!this.validateMarketplaceUser(marketplaceUser)) {
				throw new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_USER_DATA, 'Invalid marketplace user data', {
					marketplaceUser,
				});
			}

			// Translate to Clerk format
			const clerkUser = {
				emailAddress: [marketplaceUser.email],
				firstName: marketplaceUser.firstName || '',
				lastName: marketplaceUser.lastName || '',
				publicMetadata: marketplaceUser.metadata || {},
			};

			this.logger.debug('Successfully translated marketplace user to Clerk format', {
				email: marketplaceUser.email,
			});

			return clerkUser;
		} catch (error) {
			this.logger.error('Failed to translate marketplace user to Clerk format', error.stack, {
				marketplaceUser,
				error,
			});
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
		this.logger.debug('Translating marketplace user update to Clerk format', {
			marketplaceUserId,
			updatedFields: Object.keys(updates),
		});

		try {
			// Validate marketplace user update data
			if (!this.validateMarketplaceUserUpdate(updates)) {
				throw new AppError(
					ErrorType.VALIDATION,
					ErrorCodes.INVALID_USER_UPDATE_DATA,
					'Invalid marketplace user update data',
					{ updates },
				);
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

			this.logger.debug('Successfully translated marketplace user update to Clerk format', {
				marketplaceUserId,
				clerkUpdateFields: Object.keys(clerkUpdate),
			});

			return clerkUpdate;
		} catch (error) {
			this.logger.error('Failed to translate marketplace user update to Clerk format', error.stack, {
				marketplaceUserId,
				updates,
				error,
			});
			throw error;
		}
	}
}
