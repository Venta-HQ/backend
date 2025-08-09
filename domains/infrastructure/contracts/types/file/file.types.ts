import type { z } from 'zod';
import {
	CloudinaryUploadOptionsSchema,
	FileMetadataSchema,
	FileUploadDataSchema,
	FileUploadSchema,
} from '../../schemas/file/file.schemas';

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
