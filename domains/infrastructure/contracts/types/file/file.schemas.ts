import { z } from 'zod';

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
