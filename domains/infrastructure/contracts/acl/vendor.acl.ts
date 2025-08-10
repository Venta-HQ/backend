import { AppError, ErrorCodes } from '@venta/nest/errors';

/**
 * Vendor HTTP ACL
 * Handles validation and transformation for vendor-related HTTP requests
 */

// Domain types
export interface VendorCreateRequest {
	name: string;
	email: string;
	description?: string;
	phone?: string;
	website?: string;
	userId: string;
	coordinates: {
		lat: number;
		lng: number;
	};
}

/**
 * Vendor Create Request ACL
 * Validates and transforms vendor creation requests
 */
export class VendorCreateRequestACL {
	// HTTP → gRPC (inbound)
	static validate(request: any): void {
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
		if (!request.coordinates?.lat || !request.coordinates?.lng) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'coordinates',
				message: 'Valid coordinates (lat, lng) are required',
			});
		}
	}

	static toGrpc(request: any): {
		name: string;
		email: string;
		description?: string;
		phone?: string;
		website?: string;
		userId: string;
		coordinates: { lat: number; long: number };
	} {
		this.validate(request);

		return {
			name: request.name,
			email: request.email,
			description: request.description,
			phone: request.phone,
			website: request.website,
			userId: request.userId,
			coordinates: {
				lat: request.coordinates.lat,
				long: request.coordinates.lng, // Convert lng to long for gRPC
			},
		};
	}
}
