import { describe, expect, it } from 'vitest';
import {
	GrpcLocationSchema,
	GrpcLocationUpdateSchema,
	GrpcVendorLocationRequestSchema,
	UpdateUserLocationDataSchema,
	VendorLocationUpdateDataSchema,
} from './location.schemas';

describe('Location Schemas', () => {
	describe('VendorLocationUpdateDataSchema', () => {
		it('should validate valid vendor location update data', () => {
			const validData = {
				lat: 40.7128,
				long: -74.006,
				vendorId: 'vendor-123',
			};

			const result = VendorLocationUpdateDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject invalid latitude types', () => {
			const invalidData = {
				lat: 'invalid', // Should be number
				long: -74.006,
				vendorId: 'vendor-123',
			};

			const result = VendorLocationUpdateDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject missing required fields', () => {
			const invalidData = {
				lat: 40.7128,
				// missing long and vendorId
			};

			const result = VendorLocationUpdateDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject non-string vendorId', () => {
			const invalidData = {
				lat: 40.7128,
				long: -74.006,
				vendorId: 123, // Should be string
			};

			const result = VendorLocationUpdateDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});

	describe('UpdateUserLocationDataSchema', () => {
		it('should validate valid user location update data', () => {
			const validData = {
				neLocation: {
					lat: 40.7128,
					long: -74.006,
				},
				swLocation: {
					lat: 40.7028,
					long: -74.016,
				},
				userId: 'user-123',
			};

			const result = UpdateUserLocationDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate data without optional userId', () => {
			const validData = {
				neLocation: {
					lat: 40.7128,
					long: -74.006,
				},
				swLocation: {
					lat: 40.7028,
					long: -74.016,
				},
				// userId is optional
			};

			const result = UpdateUserLocationDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject invalid location coordinates', () => {
			const invalidData = {
				neLocation: {
					lat: 'invalid', // Should be number
					long: -74.006,
				},
				swLocation: {
					lat: 40.7028,
					long: -74.016,
				},
			};

			const result = UpdateUserLocationDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

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
	});

	describe('GrpcLocationSchema', () => {
		it('should validate valid gRPC location data', () => {
			const validData = {
				lat: 40.7128,
				long: -74.006,
			};

			const result = GrpcLocationSchema.safeParse(validData);
			expect(result.success).toBe(true);
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
		it('should validate valid gRPC location update data', () => {
			const validData = {
				entityId: 'entity-123',
				location: {
					lat: 40.7128,
					long: -74.006,
				},
			};

			const result = GrpcLocationUpdateSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate data with optional location', () => {
			const validData = {
				entityId: 'entity-123',
				// location is optional
			};

			const result = GrpcLocationUpdateSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject missing entityId', () => {
			const invalidData = {
				location: {
					lat: 40.7128,
					long: -74.006,
				},
				// missing entityId
			};

			const result = GrpcLocationUpdateSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});

	describe('GrpcVendorLocationRequestSchema', () => {
		it('should validate valid gRPC vendor location request data', () => {
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

		it('should validate data with optional locations', () => {
			const validData = {
				// Both locations are optional
			};

			const result = GrpcVendorLocationRequestSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate data with only one location', () => {
			const validData = {
				neLocation: {
					lat: 40.7128,
					long: -74.006,
				},
				// swLocation is optional
			};

			const result = GrpcVendorLocationRequestSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});
});
