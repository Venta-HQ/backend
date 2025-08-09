import { z } from 'zod';

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

// Type for file upload data
export type FileUploadData = z.infer<typeof FileUploadDataSchema>;
