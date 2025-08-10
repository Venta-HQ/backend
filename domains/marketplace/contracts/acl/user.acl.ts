// gRPC types (wire format) - directly from proto
import type { CreateSubscriptionData, UserIdentityData } from '@venta/proto/marketplace/user-management';
// Validation utilities
import { validateRequiredString, validateSubscriptionData } from '../schemas/validation.utils';
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
		validateRequiredString(grpc.id, 'id');
	}

	static toDomain(grpc: UserIdentityData): UserIdentity {
		this.validate(grpc);

		return {
			id: grpc.id,
		};
	}

	// Domain → gRPC (outbound)
	static validateDomain(domain: UserIdentity): void {
		validateRequiredString(domain.id, 'id');
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
		validateRequiredString(grpc.clerkUserId, 'clerkUserId');
		validateRequiredString(grpc.providerId, 'providerId');
		validateSubscriptionData(grpc.data);
	}

	static toDomain(grpc: CreateSubscriptionData): SubscriptionCreate {
		this.validate(grpc);

		return {
			userId: grpc.clerkUserId, // Map clerkUserId to userId
			providerId: grpc.providerId,
			data: validateSubscriptionData(grpc.data),
		};
	}

	// Domain → gRPC (outbound)
	static validateDomain(domain: SubscriptionCreate): void {
		validateRequiredString(domain.userId, 'userId');
		validateRequiredString(domain.providerId, 'providerId');
		validateSubscriptionData(domain.data);
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
	static validate(grpc: UserIdentityData): void {
		validateRequiredString(grpc.id, 'id');
	}

	static toDomain(grpc: UserIdentityData): UserVendorQuery {
		this.validate(grpc);

		return {
			userId: grpc.id,
		};
	}

	// Domain → gRPC (outbound)
	static validateDomain(domain: UserVendorQuery): void {
		validateRequiredString(domain.userId, 'userId');
	}

	static toGrpc(domain: UserVendorQuery): UserIdentityData {
		this.validateDomain(domain);

		return {
			id: domain.userId,
		};
	}
}
