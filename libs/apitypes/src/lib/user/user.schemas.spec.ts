import { describe, it, expect } from 'vitest';
import {
	GrpcUserVendorDataSchema,
	GrpcClerkUserDataSchema,
	GrpcRevenueCatProviderDataSchema,
	GrpcRevenueCatSubscriptionDataSchema,
} from './user.schemas';

describe('User Schemas', () => {
	describe('GrpcUserVendorDataSchema', () => {
		it('should validate valid user vendor data', () => {
			const validData = {
				userId: 'user-123',
			};

			const result = GrpcUserVendorDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject missing userId field', () => {
			const invalidData = {
				// missing userId
			};

			const result = GrpcUserVendorDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject non-string userId', () => {
			const invalidData = {
				userId: 123, // Should be string
			};

			const result = GrpcUserVendorDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should accept empty string userId (no validation)', () => {
			const validData = {
				userId: '', // Empty string is valid since schema doesn't validate length
			};

			const result = GrpcUserVendorDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe('GrpcClerkUserDataSchema', () => {
		it('should validate valid clerk user data', () => {
			const validData = {
				id: 'clerk-user-123',
			};

			const result = GrpcClerkUserDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject missing id field', () => {
			const invalidData = {
				// missing id
			};

			const result = GrpcClerkUserDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject non-string id', () => {
			const invalidData = {
				id: 123, // Should be string
			};

			const result = GrpcClerkUserDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});

	describe('GrpcRevenueCatProviderDataSchema', () => {
		it('should validate valid RevenueCat provider data', () => {
			const validData = {
				eventId: 'event-123',
				productId: 'product-456',
				transactionId: 'transaction-789',
			};

			const result = GrpcRevenueCatProviderDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject missing required fields', () => {
			const invalidData = {
				eventId: 'event-123',
				// missing productId and transactionId
			};

			const result = GrpcRevenueCatProviderDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject non-string fields', () => {
			const invalidData = {
				eventId: 123, // Should be string
				productId: 'product-456',
				transactionId: 'transaction-789',
			};

			const result = GrpcRevenueCatProviderDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should accept empty string fields (no validation)', () => {
			const validData = {
				eventId: '',
				productId: 'product-456',
				transactionId: 'transaction-789',
			};

			const result = GrpcRevenueCatProviderDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe('GrpcRevenueCatSubscriptionDataSchema', () => {
		it('should validate valid RevenueCat subscription data with provider data', () => {
			const validData = {
				clerkUserId: 'clerk-user-123',
				providerId: 'provider-456',
				data: {
					eventId: 'event-123',
					productId: 'product-456',
					transactionId: 'transaction-789',
				},
			};

			const result = GrpcRevenueCatSubscriptionDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate valid RevenueCat subscription data without provider data', () => {
			const validData = {
				clerkUserId: 'clerk-user-123',
				providerId: 'provider-456',
				// data is optional
			};

			const result = GrpcRevenueCatSubscriptionDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject missing required fields', () => {
			const invalidData = {
				clerkUserId: 'clerk-user-123',
				// missing providerId
			};

			const result = GrpcRevenueCatSubscriptionDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject non-string clerkUserId', () => {
			const invalidData = {
				clerkUserId: 123, // Should be string
				providerId: 'provider-456',
			};

			const result = GrpcRevenueCatSubscriptionDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject non-string providerId', () => {
			const invalidData = {
				clerkUserId: 'clerk-user-123',
				providerId: 456, // Should be string
			};

			const result = GrpcRevenueCatSubscriptionDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject invalid provider data when provided', () => {
			const invalidData = {
				clerkUserId: 'clerk-user-123',
				providerId: 'provider-456',
				data: {
					eventId: 'event-123',
					// missing required fields in data
				},
			};

			const result = GrpcRevenueCatSubscriptionDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});
}); 