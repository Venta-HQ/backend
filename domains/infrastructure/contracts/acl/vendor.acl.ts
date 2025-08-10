import { AppError, ErrorCodes } from '@venta/nest/errors';
import { VendorCreateData, VendorUpdateData } from '@venta/proto/marketplace/vendor-management';
import { VendorCreateRequest, VendorUpdateRequest } from '../types/domain';

/**
 * Vendor HTTP ACL
 * Handles validation and transformation for vendor-related HTTP requests
 */

/**
 * Vendor Create Request ACL
 * Validates and transforms vendor creation requests
 */
export class VendorCreateRequestACL {
	// HTTP → gRPC (inbound)
	static validate(request: VendorCreateRequest): void {
		if (!request.name?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'name',
				message: 'Vendor name is required',
			});
		}
		if (!request.email?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'email',
				message: 'Email is required',
			});
		}
		if (!request.userId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'userId',
				message: 'User ID is required',
			});
		}
		if (!request.imageUrl?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'imageUrl',
				message: 'Image URL is required',
			});
		}
	}

	static toGrpc(request: VendorCreateRequest): VendorCreateData {
		this.validate(request);

		return {
			name: request.name,
			email: request.email,
			description: request.description,
			phone: request.phone,
			website: request.website,
			profileImage: request.imageUrl,
		};
	}
}

export class VendorUpdateRequestACL {
	static validate(request: VendorUpdateRequest): void {
		if (!request.id?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'id',
				message: 'Vendor ID is required',
			});
		}
	}

	static toGrpc(request: VendorUpdateRequest): VendorUpdateData {
		this.validate(request);

		return {
			id: request.id,
			name: request.name,
			email: request.email,
			description: request.description,
			phone: request.phone,
			website: request.website,
			imageUrl: request.imageUrl,
		};
	}
}
