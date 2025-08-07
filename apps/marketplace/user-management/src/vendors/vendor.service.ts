import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import { PrismaService } from '@app/nest/modules';
import { Injectable, Logger } from '@nestjs/common';

interface UserVendorSummary {
	id: string;
	name: string;
}

interface UserVendorRelationship {
	userId: string;
	vendorId: string;
}

@Injectable()
export class VendorService {
	private readonly logger = new Logger(VendorService.name);

	constructor(private prisma: PrismaService) {}

	/**
	 * Get all vendors owned by a user
	 * Domain method for user-vendor relationship management
	 */
	async getUserVendors(userId: string): Promise<UserVendorSummary[]> {
		this.logger.log('Getting user vendor relationships', { userId });

		try {
			const vendors = await this.prisma.db.vendor.findMany({
				select: {
					id: true,
					name: true,
				},
				where: {
					owner: {
						id: userId,
					},
				},
			});

			this.logger.log('User vendor relationships retrieved successfully', {
				userId,
				vendorCount: vendors.length,
			});

			return vendors;
		} catch (error) {
			this.logger.error('Failed to get user vendor relationships', { error, userId });
			throw new AppError(
				ErrorType.INTERNAL,
				ErrorCodes.DATABASE_ERROR,
				'Failed to retrieve user vendor relationships',
				{
					operation: 'get_user_vendors',
					userId,
				},
			);
		}
	}

	/**
	 * Check if user owns a specific vendor
	 * Domain method for vendor ownership validation
	 */
	async validateVendorOwnership(relationship: UserVendorRelationship): Promise<boolean> {
		this.logger.log('Validating vendor ownership', {
			userId: relationship.userId,
			vendorId: relationship.vendorId,
		});

		try {
			const vendor = await this.prisma.db.vendor.findFirst({
				where: {
					id: relationship.vendorId,
					ownerId: relationship.userId,
				},
			});

			const isOwner = !!vendor;

			this.logger.log('Vendor ownership validation completed', {
				isOwner,
				userId: relationship.userId,
				vendorId: relationship.vendorId,
			});

			return isOwner;
		} catch (error) {
			this.logger.error('Failed to validate vendor ownership', {
				error,
				userId: relationship.userId,
				vendorId: relationship.vendorId,
			});
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to validate vendor ownership', {
				operation: 'validate_vendor_ownership',
				userId: relationship.userId,
				vendorId: relationship.vendorId,
			});
		}
	}
}
