import { z } from 'zod';

export namespace Infrastructure {
	// ============================================================================
	// Core Domain Types
	// Primary types that represent our domain concepts
	// ============================================================================
	export namespace Core {
		export interface VendorCreateData {
			name: string;
			description?: string;
			ownerId: string;
			metadata?: Record<string, string>;
		}

		export interface VendorUpdateData {
			name?: string;
			description?: string;
			metadata?: Record<string, string>;
		}

		export interface UserVendorRequest {
			userId: string;
			vendorId: string;
			status: 'pending' | 'approved' | 'rejected';
			metadata?: Record<string, string>;
		}

		export interface FileUploadResult {
			fileId: string;
			url: string;
			filename: string;
			size: number;
			mimetype: string;
			timestamp: string;
			uploadedBy: string;
			context: string;
			provider: string;
		}
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

		export interface FileUpload {
			filename: string;
			mimetype: string;
			size: number;
			content: Buffer;
			context: 'user_profile' | 'vendor_logo' | 'product_image';
			uploadedBy?: string;
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

		export interface CloudinaryUploadOptions {
			resourceType: 'image' | 'video' | 'raw';
			folder: string;
			publicId: string;
		}
	}

	// ============================================================================
	// Event Types
	// Types for domain events
	// ============================================================================
	export namespace Events {
		export interface FileUploaded {
			file: {
				fileId: string;
				filename: string;
				mimetype: string;
				size: number;
				timestamp: string;
				uploadedBy: string;
				context: string;
			};
			timestamp: string;
		}
	}

	// ============================================================================
	// Validation Types
	// Types for validation schemas
	// ============================================================================
	export namespace Validation {
		export const UserVendorRequestSchema = z.object({
			userId: z.string().uuid(),
			vendorId: z.string().uuid(),
			status: z.enum(['pending', 'approved', 'rejected']),
			metadata: z.record(z.string()).optional(),
		});

		export const VendorCreateSchema = z.object({
			name: z.string().min(1),
			description: z.string().optional(),
			ownerId: z.string().uuid(),
			metadata: z.record(z.string()).optional(),
		});

		export const VendorUpdateSchema = z.object({
			name: z.string().min(1).optional(),
			description: z.string().optional(),
			metadata: z.record(z.string()).optional(),
		});

		export const FileUploadSchema = z.object({
			filename: z.string().min(1),
			mimetype: z.string().min(1),
			size: z.number().positive(),
			content: z.instanceof(Buffer),
			context: z.enum(['user_profile', 'vendor_logo', 'product_image']),
			uploadedBy: z.string().optional(),
		});

		export const CloudinaryUploadOptionsSchema = z.object({
			resourceType: z.enum(['image', 'video', 'raw']),
			folder: z.string().min(1),
			publicId: z.string().min(1),
		});
	}
}
