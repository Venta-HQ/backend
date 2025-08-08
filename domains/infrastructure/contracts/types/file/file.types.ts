import { z } from 'zod';

// Base file upload data schema
export const FileUploadDataSchema = z.object({
	file: z.any(), // Express.Multer.File
});

// Type for file upload data
export type FileUploadData = z.infer<typeof FileUploadDataSchema>;
