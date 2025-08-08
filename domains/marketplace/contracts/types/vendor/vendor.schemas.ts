import { z } from 'zod';

// HTTP API schemas
export const CreateVendorSchema = z.object({
	description: z.string().nullable().optional(),
	email: z.string().nullable().optional(),
	imageUrl: z.string().nullable().optional(),
	name: z.string(),
	phone: z.string().nullable().optional(),
	website: z.string().nullable().optional(),
});

export const UpdateVendorSchema = z.object({
	description: z.string().nullable().optional(),
	email: z.string().nullable().optional(),
	imageUrl: z.string().nullable().optional(),
	name: z.string().optional(),
	phone: z.string().nullable().optional(),
	website: z.string().nullable().optional(),
});

// gRPC schemas
export const GrpcVendorCreateDataSchema = z.object({
	description: z.string(),
	email: z.string(),
	imageUrl: z.string(),
	name: z.string(),
	phone: z.string(),
	userId: z.string(),
	website: z.string(),
});

export const GrpcVendorUpdateDataSchema = z.object({
	description: z.string(),
	email: z.string(),
	id: z.string(),
	imageUrl: z.string(),
	name: z.string(),
	phone: z.string(),
	userId: z.string(),
	website: z.string(),
});

export const GrpcVendorLookupDataSchema = z.object({
	id: z.string(),
});
