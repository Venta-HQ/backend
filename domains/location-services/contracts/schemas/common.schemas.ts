import { z } from 'zod';

/**
 * Common schemas shared across transport-specific schemas
 */

export const coordinatesSchema = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
});
