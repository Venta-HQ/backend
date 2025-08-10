import { AppError, ErrorCodes } from '@venta/nest/errors';
// gRPC types (wire format) - directly from proto
import type {
	CreateSubscriptionData,
	UserIdentityData,
	UserVendorData,
} from '@venta/proto/marketplace/user-management';
// Domain types (what gRPC maps to)
import type { SubscriptionCreate, UserIdentity, UserVendorQuery } from '../types/domain';

// ============================================================================
// USER ACL - Bidirectional gRPC ↔ Domain transformation
// ============================================================================

/**
 * User Identity ACL
 * Bidirectional validation and transformation for user identity operations
 */
export class UserIdentityACL {
	// gRPC → Domain (inbound)
	static validate(grpc: UserIdentityData): void {
		if (!grpc.id?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'id',
				message: 'User ID is required',
			});
		}
	}

	static toDomain(grpc: UserIdentityData): UserIdentity {
		this.validate(grpc);

		return {
			id: grpc.id,
		};
	}

	// Domain → gRPC (outbound)
	static validateDomain(domain: UserIdentity): void {
		if (!domain.id?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'id',
				message: 'User ID is required',
			});
		}
	}

	static toGrpc(domain: UserIdentity): UserIdentityData {
		this.validateDomain(domain);

		return {
			id: domain.id,
		};
	}
}

/**
 * Subscription Create ACL
 * Bidirectional validation and transformation for subscription operations
 */
export class SubscriptionCreateACL {
	// gRPC → Domain (inbound)
	static validate(grpc: CreateSubscriptionData): void {
		if (!grpc.clerkUserId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'clerkUserId',
				message: 'Clerk User ID is required',
			});
		}
		if (!grpc.providerId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'providerId',
				message: 'Provider ID is required',
			});
		}
	}

	static toDomain(grpc: CreateSubscriptionData): SubscriptionCreate {
		this.validate(grpc);

		return {
			userId: grpc.clerkUserId, // Map clerkUserId to userId
			providerId: grpc.providerId,
			data: grpc.data,
		};
	}

	// Domain → gRPC (outbound)
	static validateDomain(domain: SubscriptionCreate): void {
		if (!domain.userId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'userId',
				message: 'User ID is required',
			});
		}
		if (!domain.providerId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'providerId',
				message: 'Provider ID is required',
			});
		}
	}

	static toGrpc(domain: SubscriptionCreate): CreateSubscriptionData {
		this.validateDomain(domain);

		return {
			clerkUserId: domain.userId, // Map userId back to clerkUserId
			providerId: domain.providerId,
			data: domain.data,
		};
	}
}

/**
 * User Vendor Query ACL
 * Bidirectional validation and transformation for user vendor query operations
 */
export class UserVendorQueryACL {
	// gRPC → Domain (inbound)
	static validate(grpc: UserVendorData): void {
		if (!grpc.userId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'userId',
				message: 'User ID is required',
			});
		}
	}

	static toDomain(grpc: UserVendorData): UserVendorQuery {
		this.validate(grpc);

		return {
			userId: grpc.userId,
		};
	}

	// Domain → gRPC (outbound)
	static validateDomain(domain: UserVendorQuery): void {
		if (!domain.userId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'userId',
				message: 'User ID is required',
			});
		}
	}

	static toGrpc(domain: UserVendorQuery): UserVendorData {
		this.validateDomain(domain);

		return {
			userId: domain.userId,
		};
	}
}
