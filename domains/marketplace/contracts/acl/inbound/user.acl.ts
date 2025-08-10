import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { SchemaValidatorPipe } from '@venta/nest/pipes';
// gRPC types (wire format) - directly from proto
import type {
	CreateSubscriptionData,
	UserIdentityData,
	UserVendorData,
} from '@venta/proto/marketplace/user-management';
import { GrpcSubscriptionDataSchema, GrpcUserIdentitySchema } from '../../schemas/user/user.schemas';
// Domain types (what gRPC maps to)
import type { SubscriptionCreate, UserIdentity, UserVendorQuery } from '../../types/domain';

// ============================================================================
// INBOUND USER ACL PIPES - Transform gRPC types to domain types
// ============================================================================

/**
 * User Identity ACL Pipe
 * Transforms gRPC UserIdentityData to domain UserIdentity
 */
@Injectable()
export class UserIdentityACLPipe implements PipeTransform<UserIdentityData, UserIdentity> {
	private validator = new SchemaValidatorPipe(GrpcUserIdentitySchema);

	transform(value: UserIdentityData, metadata: ArgumentMetadata): UserIdentity {
		const validated = this.validator.transform(value, metadata);

		return {
			id: validated.id,
		};
	}
}

/**
 * Subscription Create ACL Pipe
 * Transforms gRPC CreateSubscriptionData to domain SubscriptionCreate
 */
@Injectable()
export class SubscriptionCreateACLPipe implements PipeTransform<CreateSubscriptionData, SubscriptionCreate> {
	private validator = new SchemaValidatorPipe(GrpcSubscriptionDataSchema);

	transform(value: CreateSubscriptionData, metadata: ArgumentMetadata): SubscriptionCreate {
		const validated = this.validator.transform(value, metadata);

		return {
			userId: validated.clerkUserId, // Map clerkUserId to userId
			providerId: validated.providerId,
			data: validated.data,
		};
	}
}

/**
 * User Vendor Query ACL Pipe
 * Transforms gRPC UserVendorData to domain UserVendorQuery
 */
@Injectable()
export class UserVendorQueryACLPipe implements PipeTransform<UserVendorData, UserVendorQuery> {
	transform(value: UserVendorData, _metadata: ArgumentMetadata): UserVendorQuery {
		return {
			userId: value.userId,
		};
	}
}
