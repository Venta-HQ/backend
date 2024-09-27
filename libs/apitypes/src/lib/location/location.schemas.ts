import { z } from 'zod';

export const GenericLocationSyncDataSchema = z.object({
	id: z.string(),
	lat: z.number(),
	long: z.number(),
});

export const VendorLocationsRequestDataSchema = z.object({
	id: z.string(),
	neLocation: z.object({
		lat: z.number(),
		long: z.number(),
	}),
	swLocation: z.object({
		lat: z.number(),
		long: z.number(),
	}),
});
