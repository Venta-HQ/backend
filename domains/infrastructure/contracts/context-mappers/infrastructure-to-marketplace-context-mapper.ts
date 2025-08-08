import { AppError, ErrorCodes } from '@app/nest/errors';
import { Marketplace } from '@domains/marketplace/contracts/types/context-mapping.types';
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
