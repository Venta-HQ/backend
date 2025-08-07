import { Injectable } from '@nestjs/common';
import { BaseAntiCorruptionLayer } from '@app/nest/modules/contracts';

/**
 * Anti-Corruption Layer for Vendor Management ↔ Clerk Integration
 *
 * Protects the Vendor Management domain from Clerk's external API changes
 * and translates Clerk data to vendor management domain format
 */
@Injectable()
export class VendorClerkAntiCorruptionLayer extends BaseAntiCorruptionLayer {
	constructor() {
		super('VendorClerkAntiCorruptionLayer');
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
	 * Translate Clerk user data to marketplace vendor format
	 */
	toMarketplaceVendor(clerkUser: any) {
		this.logTranslationStart('toMarketplaceVendor', { clerkUserId: clerkUser?.id });

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
				// Vendor-specific fields
				vendorType: this.extractVendorType(clerkUser),
				businessName: this.extractBusinessName(clerkUser),
				verificationStatus: this.extractVerificationStatus(clerkUser),
			};

			this.logTranslationSuccess('toMarketplaceVendor', result);
			return result;
		} catch (error) {
			this.logTranslationError('toMarketplaceVendor', error, { clerkUser });
			throw error;
		}
	}

	/**
	 * Translate Clerk user update to marketplace vendor format
	 */
	toMarketplaceVendorUpdate(clerkUser: any, previousUser?: any) {
		this.logTranslationStart('toMarketplaceVendorUpdate', { clerkUserId: clerkUser?.id });

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

				if (this.extractBusinessName(clerkUser) !== this.extractBusinessName(previousUser)) {
					changes.businessName = this.extractBusinessName(clerkUser);
				}

				// Check for metadata changes
				const currentMetadata = this.extractMetadata(clerkUser);
				const previousMetadata = this.extractMetadata(previousUser);
				if (JSON.stringify(currentMetadata) !== JSON.stringify(previousMetadata)) {
					changes.metadata = currentMetadata;
				}
			} else {
				// New vendor - include all fields
				changes.email = this.extractEmail(clerkUser);
				changes.firstName = this.extractFirstName(clerkUser);
				changes.lastName = this.extractLastName(clerkUser);
				changes.businessName = this.extractBusinessName(clerkUser);
				changes.metadata = this.extractMetadata(clerkUser);
			}

			const result = {
				clerkId: clerkUser.id,
				changes,
				updatedAt: this.extractUpdatedAt(clerkUser),
			};

			this.logTranslationSuccess('toMarketplaceVendorUpdate', result);
			return result;
		} catch (error) {
			this.logTranslationError('toMarketplaceVendorUpdate', error, { clerkUser, previousUser });
			throw error;
		}
	}

	/**
	 * Translate Clerk user deletion to marketplace vendor format
	 */
	toMarketplaceVendorDeletion(clerkUserId: string) {
		this.logTranslationStart('toMarketplaceVendorDeletion', { clerkUserId });

		try {
			if (!this.validateExternalUserId(clerkUserId)) {
				throw this.createValidationError('Invalid Clerk user ID', { clerkUserId });
			}

			const result = {
				clerkId: clerkUserId,
				deletedAt: new Date().toISOString(),
			};

			this.logTranslationSuccess('toMarketplaceVendorDeletion', result);
			return result;
		} catch (error) {
			this.logTranslationError('toMarketplaceVendorDeletion', error, { clerkUserId });
			throw error;
		}
	}

	// ============================================================================
	// Marketplace → Clerk Translation
	// ============================================================================

	/**
	 * Translate marketplace vendor to Clerk format for API calls
	 */
	toClerkVendor(marketplaceVendor: {
		email: string;
		firstName?: string;
		lastName?: string;
		businessName?: string;
		metadata?: Record<string, any>;
	}) {
		this.logTranslationStart('toClerkVendor', { email: marketplaceVendor.email });

		try {
			if (!this.validateMarketplaceData(marketplaceVendor)) {
				throw this.createValidationError('Invalid marketplace vendor data', { marketplaceVendor });
			}

			const result = {
				emailAddress: [marketplaceVendor.email],
				firstName: marketplaceVendor.firstName || '',
				lastName: marketplaceVendor.lastName || '',
				publicMetadata: {
					...marketplaceVendor.metadata,
					businessName: marketplaceVendor.businessName,
					vendorType: 'business',
				},
			};

			this.logTranslationSuccess('toClerkVendor', result);
			return result;
		} catch (error) {
			this.logTranslationError('toClerkVendor', error, { marketplaceVendor });
			throw error;
		}
	}

	/**
	 * Translate marketplace vendor update to Clerk format
	 */
	toClerkVendorUpdate(
		marketplaceVendorId: string,
		updates: {
			email?: string;
			firstName?: string;
			lastName?: string;
			businessName?: string;
			metadata?: Record<string, any>;
		},
	) {
		this.logTranslationStart('toClerkVendorUpdate', { marketplaceVendorId, updates });

		try {
			const result: Record<string, any> = {};

			if (updates.email) {
				result.emailAddress = [updates.email];
			}

			if (updates.firstName !== undefined) {
				result.firstName = updates.firstName;
			}

			if (updates.lastName !== undefined) {
				result.lastName = updates.lastName;
			}

			if (updates.businessName !== undefined || updates.metadata) {
				result.publicMetadata = {
					...(updates.metadata || {}),
					...(updates.businessName && { businessName: updates.businessName }),
				};
			}

			this.logTranslationSuccess('toClerkVendorUpdate', result);
			return result;
		} catch (error) {
			this.logTranslationError('toClerkVendorUpdate', error, { marketplaceVendorId, updates });
			throw error;
		}
	}

	// ============================================================================
	// Vendor-Specific Data Extraction Methods
	// ============================================================================

	/**
	 * Extract vendor type from Clerk user data
	 */
	private extractVendorType(clerkUser: any): string {
		return clerkUser.publicMetadata?.vendorType || 'business';
	}

	/**
	 * Extract business name from Clerk user data
	 */
	private extractBusinessName(clerkUser: any): string {
		return clerkUser.publicMetadata?.businessName || '';
	}

	/**
	 * Extract verification status from Clerk user data
	 */
	private extractVerificationStatus(clerkUser: any): string {
		return clerkUser.publicMetadata?.verificationStatus || 'pending';
	}
} 