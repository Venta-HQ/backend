// gRPC types (wire format) - directly from proto
import type { UserIdentityData } from '@venta/proto/marketplace/user-management';
// Validation utilities
import { validateSchema } from '@venta/utils';
import { grpcUserIdentitySchema } from '../schemas/user.schemas';
// Domain types (what gRPC maps to)
import type { UserIdentity } from '../types/domain';

// ============================================================================
// USER ACL - Bidirectional gRPC ↔ Domain transformation
// ============================================================================

/**
 * User Identity ACL
 * Bidirectional validation and transformation for user identity operations
 */
export class UserIdentityACL {
	// gRPC → Domain (inbound)
	static validateIncoming(grpc: UserIdentityData): void {
		validateSchema(grpcUserIdentitySchema, grpc);
	}

	static toDomain(grpc: UserIdentityData): UserIdentity {
		this.validateIncoming(grpc);

		return {
			id: grpc.id,
		};
	}
}
