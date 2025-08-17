// Validation utilities
import { validateCoordinates, validateRequiredString } from '../schemas/validation.utils';

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
		validateRequiredString(request.userId, 'userId');
		validateCoordinates(request.ne, 'ne');
		validateCoordinates(request.sw, 'sw');
	}

	static toGrpc(request: any): {
		userId: string;
		ne: { lat: number; lng: number };
		sw: { lat: number; lng: number };
	} {
		this.validate(request);

		const ne = validateCoordinates(request.ne, 'ne');
		const sw = validateCoordinates(request.sw, 'sw');

		return {
			userId: request.userId,
			ne: {
				lat: ne.lat,
				lng: ne.lng,
			},
			sw: {
				lat: sw.lat,
				lng: sw.lng,
			},
		};
	}
}
