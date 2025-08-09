import { z } from 'zod';
import { CloudinaryUploadOptionsSchema, FileUploadSchema } from '../../schemas/file/file.schemas';

// File metadata schema
export const FileMetadataSchema = z.object({
	fieldname: z.string(),
	originalname: z.string(),
	encoding: z.string(),
	mimetype: z.string(),
	size: z.number(),
	buffer: z.instanceof(Buffer),
});

// Base file upload data schema
export const FileUploadDataSchema = z.object({
	file: FileMetadataSchema,
	type: z.enum(['avatar', 'logo', 'document']),
});

// Type for file metadata
export type FileMetadata = z.infer<typeof FileMetadataSchema>;

// Type for file upload
export type FileUpload = z.infer<typeof FileUploadSchema>;

// Type for file upload data
export type FileUploadData = z.infer<typeof FileUploadDataSchema>;

// Type for Cloudinary upload options
export type CloudinaryUploadOptions = z.infer<typeof CloudinaryUploadOptionsSchema>;

// Type for file upload result
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
