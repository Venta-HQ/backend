import { z } from 'zod';

export const VendorLocationUpdateDataSchema = z.object({
	lat: z.number(),
	long: z.number(),
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
});
