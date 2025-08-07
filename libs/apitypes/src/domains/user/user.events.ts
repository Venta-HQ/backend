import { z } from 'zod';

/**
 * User location update event schema
 * Used when user location is updated via location service
 */
export const userLocationUpdateEventDataSchema = z.object({
	location: z.object({
		lat: z.number().min(-90).max(90),
		long: z.number().min(-180).max(180),
	}),
	timestamp: z.date(),
	userId: z.string(),
});

export type UserLocationUpdateEventData = z.infer<typeof userLocationUpdateEventDataSchema>;

export const userEventSchemas = {
	'user.location.updated': userLocationUpdateEventDataSchema,
} as const;
