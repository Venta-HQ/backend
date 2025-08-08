import { describe, expect, it } from 'vitest';
import { createBasicSchemaTests, createOptionalFieldTests } from '@test/helpers/schema-test-utils';
import {
	GrpcClerkUserDataSchema,
	GrpcRevenueCatProviderDataSchema,
	GrpcRevenueCatSubscriptionDataSchema,
	GrpcUserVendorDataSchema,
} from './user.schemas';

describe('User Schemas', () => {
	describe('GrpcUserVendorDataSchema', () => {
		const testCases = createBasicSchemaTests(GrpcUserVendorDataSchema, ['userId']);

		testCases.forEach(({ name, test }) => {
			it(name, test);
		});

		it('should accept empty string userId (no validation)', () => {
			const validData = { userId: '' };
			const result = GrpcUserVendorDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe('GrpcClerkUserDataSchema', () => {
		const testCases = createBasicSchemaTests(GrpcClerkUserDataSchema, ['id']);

		testCases.forEach(({ name, test }) => {
			it(name, test);
		});
	});

	describe('GrpcRevenueCatProviderDataSchema', () => {
		const testCases = createBasicSchemaTests(GrpcRevenueCatProviderDataSchema, [
			'eventId',
			'productId',
			'transactionId',
		]);

		testCases.forEach(({ name, test }) => {
			it(name, test);
		});

		it('should accept empty string fields (no validation)', () => {
			const validData = {
				eventId: '',
				productId: '',
				transactionId: '',
			};
			const result = GrpcRevenueCatProviderDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe('GrpcRevenueCatSubscriptionDataSchema', () => {
		const baseData = {
			clerkUserId: 'clerk-user-123',
			providerId: 'provider-456',
		};

		it('should validate valid RevenueCat subscription data with provider data', () => {
			const validData = {
				...baseData,
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
			const result = GrpcRevenueCatSubscriptionDataSchema.safeParse(baseData);
			expect(result.success).toBe(true);
		});

		// Test required fields
		const requiredFieldTests = createBasicSchemaTests(GrpcRevenueCatSubscriptionDataSchema, [
			'clerkUserId',
			'providerId',
		]);
		requiredFieldTests.forEach(({ name, test }) => {
			it(name, test);
		});

		// Test optional data field
		const optionalFieldTests = createOptionalFieldTests(GrpcRevenueCatSubscriptionDataSchema, baseData, ['data']);
		optionalFieldTests.forEach(({ name, test }) => {
			it(name, test);
		});

		it('should reject invalid provider data when provided', () => {
			const invalidData = {
				...baseData,
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
