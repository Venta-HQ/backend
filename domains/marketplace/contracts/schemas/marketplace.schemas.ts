import { z } from 'zod';

export const VendorSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1),
	description: z.string(),
	email: z.string().email(),
	phone: z.string().optional(),
	website: z.string().url().optional(),
	isOpen: z.boolean(),
	imageUrl: z.string().url().optional(),
	location: z
		.object({
			lat: z.number().min(-90).max(90),
			long: z.number().min(-180).max(180),
		})
		.optional(),
	ownerId: z.string().uuid(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const UserSchema = z.object({
	id: z.string().uuid(),
	email: z.string().email().nullable(),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	isActive: z.boolean(),
	subscription: z
		.object({
			id: z.string().uuid(),
			userId: z.string().uuid(),
			status: z.enum(['active', 'cancelled', 'expired']),
			provider: z.literal('revenuecat'),
			externalId: z.string(),
			productId: z.string(),
			startDate: z.string().datetime(),
			endDate: z.string().datetime().optional(),
		})
		.optional(),
	location: z
		.object({
			lat: z.number().min(-90).max(90),
			long: z.number().min(-180).max(180),
			userId: z.string().uuid().optional(),
			updatedAt: z.string().datetime().optional(),
		})
		.optional(),
});
