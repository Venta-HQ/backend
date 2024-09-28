import { z } from 'zod';

export const VendorLocationUpdateDataSchema = z.object({
	lat: z.number(),
	long: z.number(),
	vendorId: z.string(),
});

export const UpdateUserLocationDataSchema = z.object({
	neLocation: z.object({
		lat: z.number(),
		long: z.number(),
	}),
	swLocation: z.object({
		lat: z.number(),
		long: z.number(),
	}),
	userId: z.string(),
});
