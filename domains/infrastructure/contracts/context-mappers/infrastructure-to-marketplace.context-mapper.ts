import { Marketplace } from '@domains/marketplace/contracts/types/context-mapping.types';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { CreateVendorData, UpdateVendorData } from '../types/vendor/vendor.types';

/**
 * Maps vendor creation data from infrastructure domain to marketplace domain
 */
export function toMarketplaceVendorCreate(
	data: CreateVendorData & { userId: string },
): Marketplace.Core.VendorCreateData {
	if (!data.name || !data.userId) {
		throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
			field: !data.name ? 'name' : 'userId',
			message: 'Required field is missing',
		});
	}

	return {
		name: data.name,
		description: data.description || '',
		email: data.email || '',
		phone: data.phone || '',
		website: data.website || '',
		imageUrl: data.imageUrl || '',
		userId: data.userId,
	};
}

/**
 * Maps vendor update data from infrastructure domain to marketplace domain
 */
export function toMarketplaceVendorUpdate(
	data: UpdateVendorData & { id: string; userId: string },
): Marketplace.Core.VendorUpdateData {
	if (!data.id || !data.userId) {
		throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
			field: !data.id ? 'id' : 'userId',
			message: 'Required field is missing',
		});
	}

	return {
		id: data.id,
		name: data.name || '',
		description: data.description || '',
		email: data.email || '',
		phone: data.phone || '',
		website: data.website || '',
		imageUrl: data.imageUrl || '',
		userId: data.userId,
	};
}

/**
 * Maps user vendor request from infrastructure domain to marketplace domain
 */
export function toGrpcUserVendorRequest(userId: string): Marketplace.Core.UserVendorRequest {
	if (!userId) {
		throw AppError.validation(ErrorCodes.ERR_MISSING_REQUIRED_FIELD, {
			field: 'userId',
			message: 'User ID is required',
		});
	}

	return {
		userId,
	};
}
