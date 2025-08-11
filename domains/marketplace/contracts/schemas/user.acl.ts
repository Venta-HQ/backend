import { z } from 'zod';

export const grpcUserIdentitySchema = z.object({
	id: z.string(),
});

export const grpcUserVendorListSchema = z.object({
	vendors: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
		}),
	),
});

export const eventLocationUpdateSchema = z.object({
	userId: z.string(),
	location: z.object({
		lat: z.number(),
		lng: z.number(),
	}),
});
