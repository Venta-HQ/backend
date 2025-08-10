import { AppError, ErrorCodes } from '@venta/nest/errors';

/**
 * User HTTP ACL
 * Handles validation and transformation for user-related HTTP requests
 */

/**
 * User Vendor Request ACL
 * Validates and transforms requests for user vendor queries
 */
export class UserVendorRequestACL {
	// HTTP → gRPC (inbound)
	static validate(request: any): void {
		if (!request.userId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'userId',
				message: 'User ID is required',
			});
		}
		if (!request.ne?.lat || !request.ne?.lng) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'ne',
				message: 'Northeast coordinates (lat, lng) are required',
			});
		}
		if (!request.sw?.lat || !request.sw?.lng) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'sw',
				message: 'Southwest coordinates (lat, lng) are required',
			});
		}
	}

	static toGrpc(request: any): {
		userId: string;
		ne: { lat: number; long: number };
		sw: { lat: number; long: number };
	} {
		this.validate(request);

		return {
			userId: request.userId,
			ne: {
				lat: request.ne.lat,
				long: request.ne.lng, // Convert lng to long for gRPC
			},
			sw: {
				lat: request.sw.lat,
				long: request.sw.lng, // Convert lng to long for gRPC
			},
		};
	}
}
