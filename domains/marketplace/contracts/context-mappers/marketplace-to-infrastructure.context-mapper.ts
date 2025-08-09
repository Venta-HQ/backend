import { Infrastructure } from '@domains/infrastructure/contracts/types/context-mapping.types';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Marketplace } from '../types/context-mapping.types';

/**
 * Maps vendor creation data from marketplace domain to infrastructure domain
 */
export function toInfrastructureVendorCreate(
	data: Marketplace.Core.VendorCreateData,
): Infrastructure.Contracts.VendorCreateRequest {
	if (!data.userId) {
		throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
			field: 'userId',
			message: 'Required field is missing',
		});
	}

	return {
		name: data.name,
		description: data.description,
		email: data.email,
		phone: data.phone,
		website: data.website,
		imageUrl: data.imageUrl,
		userId: data.userId,
	};
}

/**
 * Maps vendor update data from marketplace domain to infrastructure domain
 */
export function toInfrastructureVendorUpdate(
	data: Marketplace.Core.VendorUpdateData,
): Infrastructure.Contracts.VendorUpdateRequest {
	if (!data.id || !data.userId) {
		throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
			field: !data.id ? 'id' : 'userId',
			message: 'Required field is missing',
		});
	}

	return {
		id: data.id,
		name: data.name,
		description: data.description,
		email: data.email,
		phone: data.phone,
		website: data.website,
		imageUrl: data.imageUrl,
		userId: data.userId,
	};
}

/**
 * Maps file upload data from marketplace domain to infrastructure domain
 */
export function toInfrastructureFileUpload(data: {
	userId: string;
	file: Express.Multer.File;
}): Infrastructure.Contracts.FileUploadRequest {
	if (!data.userId || !data.file) {
		throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
			field: !data.userId ? 'userId' : 'file',
			message: 'Required field is missing',
		});
	}

	return {
		userId: data.userId,
		file: data.file,
	};
}

/**
 * Maps user data from marketplace domain to infrastructure domain
 */
export function toInfrastructureUserRequest(data: { userId: string }): Infrastructure.Contracts.UserRequest {
	if (!data.userId) {
		throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
			field: 'userId',
			message: 'Required field is missing',
		});
	}

	return {
		userId: data.userId,
	};
}
