import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Anti-Corruption Layer for Clerk Integration
 *
 * Protects the Marketplace domain from Clerk's external API changes
 * and translates Clerk data to marketplace domain format
 */
@Injectable()
export class ClerkAntiCorruptionLayer {
	private readonly logger = new Logger(ClerkAntiCorruptionLayer.name);

	// ============================================================================
	// Clerk → Marketplace Translation
	// ============================================================================

	/**
	 * Translate Clerk user data to marketplace user format
	 */
	toMarketplaceUser(clerkUser: any) {
		this.logger.debug('Translating Clerk user to marketplace format', {
			clerkUserId: clerkUser?.id,
		});

		try {
			// Validate Clerk user data
			if (!this.validateClerkUser(clerkUser)) {
				throw new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_EXTERNAL_USER_DATA, 'Invalid Clerk user data', {
					clerkUser,
				});
			}

			// Extract and translate user data
			const marketplaceUser = {
				clerkId: clerkUser.id,
				email: this.extractEmail(clerkUser),
				firstName: this.extractFirstName(clerkUser),
				lastName: this.extractLastName(clerkUser),
				metadata: this.extractMetadata(clerkUser),
				createdAt: this.extractCreatedAt(clerkUser),
				updatedAt: this.extractUpdatedAt(clerkUser),
			};

			this.logger.debug('Successfully translated Clerk user to marketplace format', {
				clerkUserId: clerkUser.id,
				email: marketplaceUser.email,
			});

			return marketplaceUser;
		} catch (error) {
			this.logger.error('Failed to translate Clerk user to marketplace format', error.stack, {
				clerkUser,
				error,
			});
			throw error;
		}
	}

	/**
	 * Translate Clerk user update to marketplace format
	 */
	toMarketplaceUserUpdate(clerkUser: any, previousUser?: any) {
		this.logger.debug('Translating Clerk user update to marketplace format', {
			clerkUserId: clerkUser?.id,
		});

		try {
			// Validate Clerk user data
			if (!this.validateClerkUser(clerkUser)) {
				throw new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_EXTERNAL_USER_DATA, 'Invalid Clerk user data', {
					clerkUser,
				});
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

			const update = {
				clerkId: clerkUser.id,
				changes,
				updatedAt: this.extractUpdatedAt(clerkUser),
			};

			this.logger.debug('Successfully translated Clerk user update to marketplace format', {
				clerkUserId: clerkUser.id,
				changedFields: Object.keys(changes),
			});

			return update;
		} catch (error) {
			this.logger.error('Failed to translate Clerk user update to marketplace format', error.stack, {
				clerkUser,
				previousUser,
				error,
			});
			throw error;
		}
	}

	/**
	 * Translate Clerk user deletion to marketplace format
	 */
	toMarketplaceUserDeletion(clerkUserId: string) {
		this.logger.debug('Translating Clerk user deletion to marketplace format', {
			clerkUserId,
		});

		try {
			// Validate Clerk user ID
			if (!this.validateClerkUserId(clerkUserId)) {
				throw new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_EXTERNAL_USER_ID, 'Invalid Clerk user ID', {
					clerkUserId,
				});
			}

			const deletion = {
				clerkId: clerkUserId,
				deletedAt: new Date().toISOString(),
			};

			this.logger.debug('Successfully translated Clerk user deletion to marketplace format', {
				clerkUserId,
			});

			return deletion;
		} catch (error) {
			this.logger.error('Failed to translate Clerk user deletion to marketplace format', error.stack, {
				clerkUserId,
				error,
			});
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

	// ============================================================================
	// Data Extraction Methods
	// ============================================================================

	/**
	 * Extract email from Clerk user data
	 */
	private extractEmail(clerkUser: any): string {
		// Handle different Clerk API versions and structures
		if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
			return clerkUser.emailAddresses[0].emailAddress;
		}

		if (clerkUser.email_addresses && clerkUser.email_addresses.length > 0) {
			return clerkUser.email_addresses[0].email_address;
		}

		if (clerkUser.primaryEmailAddress) {
			return clerkUser.primaryEmailAddress.emailAddress;
		}

		if (clerkUser.primary_email_address) {
			return clerkUser.primary_email_address.email_address;
		}

		if (clerkUser.email) {
			return clerkUser.email;
		}

		throw new AppError(
			ErrorType.VALIDATION,
			ErrorCodes.INVALID_EXTERNAL_USER_DATA,
			'Could not extract email from Clerk user data',
			{ clerkUser },
		);
	}

	/**
	 * Extract first name from Clerk user data
	 */
	private extractFirstName(clerkUser: any): string {
		return clerkUser.firstName || clerkUser.first_name || '';
	}

	/**
	 * Extract last name from Clerk user data
	 */
	private extractLastName(clerkUser: any): string {
		return clerkUser.lastName || clerkUser.last_name || '';
	}

	/**
	 * Extract metadata from Clerk user data
	 */
	private extractMetadata(clerkUser: any): Record<string, any> {
		return clerkUser.publicMetadata || clerkUser.public_metadata || {};
	}

	/**
	 * Extract created at timestamp from Clerk user data
	 */
	private extractCreatedAt(clerkUser: any): string {
		return clerkUser.createdAt || clerkUser.created_at || new Date().toISOString();
	}

	/**
	 * Extract updated at timestamp from Clerk user data
	 */
	private extractUpdatedAt(clerkUser: any): string {
		return clerkUser.updatedAt || clerkUser.updated_at || new Date().toISOString();
	}

	// ============================================================================
	// Validation Methods
	// ============================================================================

	/**
	 * Validate Clerk user data
	 */
	private validateClerkUser(clerkUser: any): boolean {
		const isValid = clerkUser && typeof clerkUser.id === 'string' && clerkUser.id.length > 0;

		if (!isValid) {
			this.logger.warn('Invalid Clerk user data', { clerkUser });
		}

		return isValid;
	}

	/**
	 * Validate Clerk user ID
	 */
	private validateClerkUserId(clerkUserId: string): boolean {
		const isValid = typeof clerkUserId === 'string' && clerkUserId.length > 0 && clerkUserId.startsWith('user_');

		if (!isValid) {
			this.logger.warn('Invalid Clerk user ID', { clerkUserId });
		}

		return isValid;
	}

	/**
	 * Validate marketplace user data
	 */
	private validateMarketplaceUser(marketplaceUser: {
		email: string;
		firstName?: string;
		lastName?: string;
		metadata?: Record<string, any>;
	}): boolean {
		const isValid =
			marketplaceUser &&
			typeof marketplaceUser.email === 'string' &&
			marketplaceUser.email.includes('@') &&
			(!marketplaceUser.firstName || typeof marketplaceUser.firstName === 'string') &&
			(!marketplaceUser.lastName || typeof marketplaceUser.lastName === 'string') &&
			(!marketplaceUser.metadata || typeof marketplaceUser.metadata === 'object');

		if (!isValid) {
			this.logger.warn('Invalid marketplace user data', { marketplaceUser });
		}

		return isValid;
	}

	/**
	 * Validate marketplace user update data
	 */
	private validateMarketplaceUserUpdate(updates: {
		email?: string;
		firstName?: string;
		lastName?: string;
		metadata?: Record<string, any>;
	}): boolean {
		const isValid =
			updates &&
			typeof updates === 'object' &&
			(!updates.email || (typeof updates.email === 'string' && updates.email.includes('@'))) &&
			(!updates.firstName || typeof updates.firstName === 'string') &&
			(!updates.lastName || typeof updates.lastName === 'string') &&
			(!updates.metadata || typeof updates.metadata === 'object');

		if (!isValid) {
			this.logger.warn('Invalid marketplace user update data', { updates });
		}

		return isValid;
	}
}
