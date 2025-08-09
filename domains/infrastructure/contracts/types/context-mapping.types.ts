import { z } from 'zod';
import {
	FileMetadataSchema as BaseFileMetadataSchema,
	FileUploadDataSchema as BaseFileUploadDataSchema,
	type FileUploadData as BaseFileUploadData,
} from './file/file.types';
import {
	UserDataSchema as BaseUserDataSchema,
	UserVendorRequestSchema as BaseUserVendorRequestSchema,
	type UserData as BaseUserData,
	type UserVendorRequest as BaseUserVendorRequest,
} from './user/user.types';
import {
	CreateVendorSchema as BaseCreateVendorSchema,
	UpdateVendorSchema as BaseUpdateVendorSchema,
	type CreateVendorData as BaseCreateVendorData,
	type UpdateVendorData as BaseUpdateVendorData,
} from './vendor/vendor.types';

export namespace Infrastructure {
	export namespace Core {
		export type VendorCreateData = BaseCreateVendorData;
		export type VendorUpdateData = BaseUpdateVendorData;
		export type FileUploadData = BaseFileUploadData;
		export type UserData = BaseUserData;
	}

	export namespace Contracts {
		export interface VendorCreateRequest extends Core.VendorCreateData {
			userId: string;
		}

		export interface VendorUpdateRequest extends Core.VendorUpdateData {
			id: string;
			userId: string;
		}

		export interface FileUploadRequest extends Core.FileUploadData {
			userId: string;
		}

		export interface UserRequest {
			userId: string;
		}

		export type UserVendorRequest = BaseUserVendorRequest;
	}

	export namespace Internal {
		export interface FileUploadResult {
			fileId: string;
			url: string;
			uploadedAt: string;
		}

		export interface UserProfile {
			id: string;
			email: string;
			firstName?: string;
			lastName?: string;
			createdAt: string;
			updatedAt: string;
		}
	}

	export namespace Validation {
		export const FileMetadataSchema = BaseFileMetadataSchema;
		export const FileUploadSchema = BaseFileUploadDataSchema;
		export const UserSchema = BaseUserDataSchema;
		export const CreateVendorSchema = BaseCreateVendorSchema;
		export const UpdateVendorSchema = BaseUpdateVendorSchema;
		export const UserVendorRequestSchema = BaseUserVendorRequestSchema;

		export const VendorCreateRequestSchema = BaseCreateVendorSchema.extend({
			userId: z.string().uuid(),
		});

		export const VendorUpdateRequestSchema = BaseUpdateVendorSchema.extend({
			id: z.string().uuid(),
			userId: z.string().uuid(),
		});

		export const FileUploadRequestSchema = BaseFileUploadDataSchema.extend({
			userId: z.string().uuid(),
		});

		export const UserRequestSchema = z.object({
			userId: z.string().uuid(),
		});

		export const FileUploadResultSchema = z.object({
			fileId: z.string().uuid(),
			url: z.string().url(),
			uploadedAt: z.string().datetime(),
		});

		export const UserProfileSchema = z.object({
			id: z.string().uuid(),
			email: z.string().email(),
			firstName: z.string().optional(),
			lastName: z.string().optional(),
			createdAt: z.string().datetime(),
			updatedAt: z.string().datetime(),
		});
	}
}
