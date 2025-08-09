import { z } from 'zod';
import {
	FileMetadataSchema as BaseFileMetadataSchema,
	FileUploadDataSchema as BaseFileUploadDataSchema,
} from './file/file.schemas';
import {
	UserDataSchema as BaseUserDataSchema,
	UserVendorRequestSchema as BaseUserVendorRequestSchema,
} from './user/user.schemas';
import {
	CreateVendorSchema as BaseCreateVendorSchema,
	UpdateVendorSchema as BaseUpdateVendorSchema,
} from './vendor/vendor.schemas';

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
