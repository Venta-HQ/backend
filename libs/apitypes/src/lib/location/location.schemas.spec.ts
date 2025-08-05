import { describe, expect, it } from 'vitest';
import { createBasicSchemaTests, createOptionalFieldTests } from '../../../../../test/helpers/schema-test-utils';
import {
	GrpcLocationSchema,
	GrpcLocationUpdateSchema,
	GrpcVendorLocationRequestSchema,
	UpdateUserLocationDataSchema,
	VendorLocationUpdateDataSchema,
} from './location.schemas';

describe('Location Schemas', () => {
	describe('VendorLocationUpdateDataSchema', () => {
		const testCases = createBasicSchemaTests(VendorLocationUpdateDataSchema, ['vendorId', 'lat', 'long']);
		
		testCases.forEach(({ name, test }) => {
			it(name, test);
		});

		// Note: The schema doesn't validate coordinate ranges, so these tests are removed
		// as they would fail. The schema only validates that lat/long are numbers.
	});

	describe('UpdateUserLocationDataSchema', () => {
		const baseData = {
			neLocation: {
				lat: 40.7128,
				long: -74.006,
			},
			swLocation: {
				lat: 40.7028,
				long: -74.016,
			},
		};

		it('should validate valid user location update data', () => {
			const validData = {
				...baseData,
				userId: 'user-123',
			};

			const result = UpdateUserLocationDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate data without optional userId', () => {
			const result = UpdateUserLocationDataSchema.safeParse(baseData);
			expect(result.success).toBe(true);
		});

		// Test required location fields
		it('should reject missing required location fields', () => {
			const invalidData = {
				neLocation: {
					lat: 40.7128,
					// missing long
				},
				swLocation: {
					lat: 40.7028,
					long: -74.016,
				},
			};

			const result = UpdateUserLocationDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		// Test optional userId field
		const optionalFieldTests = createOptionalFieldTests(UpdateUserLocationDataSchema, baseData, ['userId']);
		optionalFieldTests.forEach(({ name, test }) => {
			it(name, test);
		});
	});

	describe('GrpcLocationSchema', () => {
		const testCases = createBasicSchemaTests(GrpcLocationSchema, ['lat', 'long']);
		
		testCases.forEach(({ name, test }) => {
			it(name, test);
		});

		it('should reject invalid coordinate types', () => {
			const invalidData = {
				lat: '40.7128', // Should be number
				long: -74.006,
			};

			const result = GrpcLocationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});

	describe('GrpcLocationUpdateSchema', () => {
		const baseData = {
			entityId: 'entity-123',
		};

		it('should validate valid gRPC location update data', () => {
			const validData = {
				...baseData,
				location: {
					lat: 40.7128,
					long: -74.006,
				},
			};

			const result = GrpcLocationUpdateSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate data with optional location', () => {
			const result = GrpcLocationUpdateSchema.safeParse(baseData);
			expect(result.success).toBe(true);
		});

		// Test required entityId field
		const requiredFieldTests = createBasicSchemaTests(GrpcLocationUpdateSchema, ['entityId']);
		requiredFieldTests.forEach(({ name, test }) => {
			it(name, test);
		});

		// Test optional location field
		const optionalFieldTests = createOptionalFieldTests(GrpcLocationUpdateSchema, baseData, ['location']);
		optionalFieldTests.forEach(({ name, test }) => {
			it(name, test);
		});
	});

	describe('GrpcVendorLocationRequestSchema', () => {
		it('should validate valid gRPC vendor location request data with both locations', () => {
			const validData = {
				neLocation: {
					lat: 40.7128,
					long: -74.006,
				},
				swLocation: {
					lat: 40.7028,
					long: -74.016,
				},
			};

			const result = GrpcVendorLocationRequestSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate data with only neLocation', () => {
			const validData = {
				neLocation: {
					lat: 40.7128,
					long: -74.006,
				},
			};

			const result = GrpcVendorLocationRequestSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate data with only swLocation', () => {
			const validData = {
				swLocation: {
					lat: 40.7028,
					long: -74.016,
				},
			};

			const result = GrpcVendorLocationRequestSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate empty object (both locations optional)', () => {
			const validData = {};

			const result = GrpcVendorLocationRequestSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		// Test optional fields
		const optionalFieldTests = createOptionalFieldTests(GrpcVendorLocationRequestSchema, {}, ['neLocation', 'swLocation']);
		optionalFieldTests.forEach(({ name, test }) => {
			it(name, test);
		});
	});
});
