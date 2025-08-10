import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { SchemaValidatorPipe } from '@venta/nest/pipes';
import { UserIdentityData } from '@venta/proto/marketplace/user-management';
import { ClerkUserSchema, GrpcUserIdentitySchema } from '../../schemas/user/user.schemas';
import type { User } from '../../types/domain';
import type { ClerkUser } from '../../types/internal';

// ============================================================================
// EXTERNAL CLERK ACL PIPES - Transform Clerk API types to domain types
// ============================================================================

/**
 * Clerk User Identity ACL Pipe
 * Validates and passes through gRPC user identity data for Clerk integration
 */
@Injectable()
export class ClerkUserIdentityACLPipe implements PipeTransform<UserIdentityData, UserIdentityData> {
	private validator = new SchemaValidatorPipe(GrpcUserIdentitySchema);

	transform(value: UserIdentityData, metadata: ArgumentMetadata): UserIdentityData {
		return this.validator.transform(value, metadata);
	}
}

/**
 * Clerk User Transform ACL Pipe
 * Transforms external Clerk user data to internal domain user
 */
@Injectable()
export class ClerkUserTransformACLPipe implements PipeTransform<ClerkUser, User> {
	private validator = new SchemaValidatorPipe(ClerkUserSchema);

	transform(value: ClerkUser, metadata: ArgumentMetadata): User {
		const validated = this.validator.transform(value, metadata);

		return {
			id: validated.id,
			email: validated.email_addresses?.[0]?.email_address || '',
			firstName: validated.first_name || '',
			lastName: validated.last_name || '',
			imageUrl: validated.image_url || '',
			createdAt: new Date(validated.created_at).toISOString(),
			updatedAt: new Date(validated.updated_at).toISOString(),
			isActive: true,
		};
	}
}
