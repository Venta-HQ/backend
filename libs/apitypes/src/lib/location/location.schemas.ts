import { z } from 'zod';

export const GenericLocationSyncDataSchema = z.object({
	id: z.string(),
	lat: z.number(),
	long: z.number(),
});
