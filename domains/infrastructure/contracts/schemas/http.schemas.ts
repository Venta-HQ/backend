import { z } from 'zod';

/**
 * HTTP Request Validation Schemas for Infrastructure Domain
 *
 * These schemas validate incoming HTTP requests at the API Gateway level
 * before they reach the controller logic. They ensure type safety and
 * provide clear validation error messages.
 */

// Coordinate validation schema (used internally)
const _coordinateSchema = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
});

// Common parameter schemas
export const idParamSchema = z.object({
	id: z.string().min(1, 'ID is required'),
});

// Vendor schemas
export const vendorCreateSchema = z.object({
	name: z.string().min(1, 'Vendor name is required').max(100, 'Vendor name too long'),
	description: z.string().max(500, 'Description too long').optional().default(''),
	email: z.string().email('Valid email address is required'),
	phone: z.string().max(20, 'Phone number too long').optional().nullable(),
	website: z.string().url('Valid website URL is required').optional().nullable(),
	profileImage: z.string().url('Valid image URL is required').optional().nullable(),
});

export const vendorUpdateSchema = z.object({
	name: z.string().min(1, 'Vendor name is required').max(100, 'Vendor name too long').optional(),
	description: z.string().max(500, 'Description too long').optional(),
	email: z.string().email('Valid email address is required').optional(),
	phone: z.string().max(20, 'Phone number too long').optional(),
	website: z.string().url('Valid website URL is required').optional(),
	profileImage: z.string().url('Valid image URL is required').optional(),
});

// User query schemas
export const userVendorQuerySchema = z.object({
	ne_lat: z.coerce.number().min(-90).max(90),
	ne_lng: z.coerce.number().min(-180).max(180),
	sw_lat: z.coerce.number().min(-90).max(90),
	sw_lng: z.coerce.number().min(-180).max(180),
});

// File upload schemas
export const fileUploadSchema = z.object({
	file: z.any().refine((file) => file !== undefined, 'File is required'),
});

// Upload query parameter schemas
export const imageUploadQuerySchema = z.object({
	folder: z.string().optional(),
	quality: z.coerce.number().min(1).max(100).optional(),
	resize: z
		.string()
		.regex(/^\d+x\d+$/, 'Resize must be in format WIDTHxHEIGHT')
		.optional(),
});

// Type exports for use in controllers
export type IdParam = z.infer<typeof idParamSchema>;
export type VendorCreateBody = z.infer<typeof vendorCreateSchema>;
export type VendorUpdateBody = z.infer<typeof vendorUpdateSchema>;
export type UserVendorQuery = z.infer<typeof userVendorQuerySchema>;
export type ImageUploadQuery = z.infer<typeof imageUploadQuerySchema>;
