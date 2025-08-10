import { AppError, ErrorCodes } from '@venta/nest/errors';
import type { UserIdentityData } from '@venta/proto/marketplace/user-management';
import type { UserIdentity } from '../types/domain';

/**
 * Authentication ACL
 *
 * Handles transformation between authentication gRPC data and internal domain types.
 * This processes authentication data that has already been processed through HTTP API gateway.
 */
export class UserIdentityACL {
	/**
	 * Validate user identity data from gRPC
	 */
	static validate(grpc: UserIdentityData): void {
		if (!grpc.id?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'id',
				message: 'User ID is required',
			});
		}
	}

	/**
	 * Transform authentication gRPC data to internal domain user identity type
	 */
	static toDomain(grpc: UserIdentityData): UserIdentity {
		this.validate(grpc);

		return {
			id: grpc.id,
		};
	}

	/**
	 * Validate domain user identity data
	 */
	static validateDomain(domain: UserIdentity): void {
		if (!domain.id?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'id',
				message: 'User ID is required',
			});
		}
	}

	/**
	 * Transform internal domain user identity to gRPC format
	 */
	static toGrpc(domain: UserIdentity): UserIdentityData {
		this.validateDomain(domain);

		return {
			id: domain.id,
		};
	}
}
