import { VendorCreateData, VendorUpdateData } from '@venta/proto/marketplace/vendor-management';
// Validation utilities
import { validateEmail, validateRequiredString } from '../schemas/validation.utils';
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
		validateRequiredString(request.name, 'name');
		validateEmail(request.email, 'email');
	}

	static toGrpc(request: VendorCreateRequest): VendorCreateData {
		this.validate(request);

		return {
			name: request.name,
			email: request.email,
			description: request.description,
			phone: request.phone,
			website: request.website,
			profileImage: request.profileImage,
		};
	}
}

export class VendorUpdateRequestACL {
	static validate(request: VendorUpdateRequest): void {
		validateRequiredString(request.id, 'id');
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
			profileImage: request.profileImage,
		};
	}
}
