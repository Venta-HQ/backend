import { z } from 'zod';
import { UserVendorRequestSchema } from './user/user.schemas';
import { CreateVendorSchema, UpdateVendorSchema } from './vendor/vendor.schemas';

export namespace Infrastructure {
	// ============================================================================
	// Core Domain Types
	// Primary types that represent our domain concepts
	// ============================================================================
	export namespace Core {
		export type VendorCreateData = z.infer<typeof CreateVendorSchema>;
		export type VendorUpdateData = z.infer<typeof UpdateVendorSchema>;
		export type UserVendorRequest = z.infer<typeof UserVendorRequestSchema>;
	}

	// ============================================================================
	// Contracts
	// Types for cross-domain communication
	// ============================================================================
	export namespace Contracts {
		export interface AuthContext {
			userId: string;
			roles: string[];
			metadata: Record<string, string>;
		}
	}

	// ============================================================================
	// Internal Types
	// Types for internal implementation details
	// ============================================================================
	export namespace Internal {
		export interface AuthedRequest extends Request {
			userId: string;
			roles: string[];
			metadata: Record<string, string>;
		}
	}

	// ============================================================================
	// Event Types
	// Types for domain events
	// ============================================================================
	export namespace Events {
		export interface FileUploaded {
			fileId: string;
			url: string;
			uploadedBy: string;
			timestamp: string;
		}
	}

	// ============================================================================
	// Validation Types
	// Types for validation schemas
	// ============================================================================
	export namespace Validation {
		export const VendorCreateSchema = CreateVendorSchema;
		export const VendorUpdateSchema = UpdateVendorSchema;
		export const UserVendorRequestSchema = UserVendorRequestSchema;
	}
}
