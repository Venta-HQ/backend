import { z } from 'zod';

/**
 * Location domain event schemas with business context
 */
export const locationEventSchemas = {
	'location.vendor_location_updated': z.object({
		vendorId: z.string(),
		location: z.object({
			lat: z.number().min(-90).max(90),
			lng: z.number().min(-180).max(180),
		}),
		accuracy: z.number().optional(),
		timestamp: z.date(),
	}),

	'location.user_location_updated': z.object({
		userId: z.string(),
		location: z.object({
			lat: z.number().min(-90).max(90),
			lng: z.number().min(-180).max(180),
		}),
		accuracy: z.number().optional(),
		timestamp: z.date(),
	}),

	'location.proximity_alert': z.object({
		userId: z.string(),
		vendorId: z.string(),
		distance: z.number().positive(),
		location: z.object({
			lat: z.number().min(-90).max(90),
			lng: z.number().min(-180).max(180),
		}),
		timestamp: z.date(),
	}),

	'location.vendor_location_removed': z.object({
		vendorId: z.string(),
		timestamp: z.date(),
	}),

	'location.geolocation_search_completed': z.object({
		searchId: z.string(),
		query: z.object({
			lat: z.number().min(-90).max(90),
			lng: z.number().min(-180).max(180),
			radius: z.number().positive(),
		}),
		results: z.array(z.object({
			vendorId: z.string(),
			distance: z.number().positive(),
			location: z.object({
				lat: z.number().min(-90).max(90),
				lng: z.number().min(-180).max(180),
			}),
		})),
		timestamp: z.date(),
	}),
} as const;

export type LocationEventSubjects = keyof typeof locationEventSchemas;
export type LocationEventDataMap = {
	[K in LocationEventSubjects]: z.infer<typeof locationEventSchemas[K]>;
}; 