import { describe, expect, it } from 'vitest';
import {
	CreateVendorSchema,
	GrpcVendorCreateDataSchema,
	GrpcVendorLookupDataSchema,
	GrpcVendorUpdateDataSchema,
	UpdateVendorSchema,
} from './vendor.schemas';

describe('Vendor Schemas', () => {
	describe('CreateVendorSchema', () => {
		it('should validate valid vendor creation data', () => {
			const validData = {
				description: 'A test vendor',
				email: 'test@vendor.com',
				imageUrl: 'https://testvendor.com/image.jpg',
				name: 'Test Vendor',
				phone: '+1234567890',
				website: 'https://testvendor.com',
			};

			const result = CreateVendorSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate data with only required fields', () => {
			const validData = {
				name: 'Test Vendor',
				// All other fields are optional
			};

			const result = CreateVendorSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate data with null optional fields', () => {
			const validData = {
				description: null,
				email: null,
				imageUrl: null,
				name: 'Test Vendor',
				phone: null,
				website: null,
			};

			const result = CreateVendorSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject missing required name field', () => {
			const invalidData = {
				description: 'A test vendor',
				email: 'test@vendor.com',
				// missing name
			};

			const result = CreateVendorSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject non-string name', () => {
			const invalidData = {
				description: 'A test vendor',
				name: 123, // Should be string
			};

			const result = CreateVendorSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});

	describe('UpdateVendorSchema', () => {
		it('should validate valid vendor update data', () => {
			const validData = {
				description: 'An updated vendor',
				email: 'updated@vendor.com',
				imageUrl: 'https://updatedvendor.com/image.jpg',
				name: 'Updated Vendor',
				phone: '+1234567890',
				website: 'https://updatedvendor.com',
			};

			const result = UpdateVendorSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate data with only some fields', () => {
			const validData = {
				email: 'updated@vendor.com',
				name: 'Updated Vendor',
				// Other fields are optional
			};

			const result = UpdateVendorSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate empty object (all fields optional)', () => {
			const validData = {};

			const result = UpdateVendorSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate data with null values', () => {
			const validData = {
				description: null,
				email: null,
				imageUrl: null,
				name: 'Updated Vendor',
				phone: null,
				website: null,
			};

			const result = UpdateVendorSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe('GrpcVendorCreateDataSchema', () => {
		it('should validate valid gRPC vendor creation data', () => {
			const validData = {
				description: 'A test vendor',
				email: 'test@vendor.com',
				imageUrl: 'https://testvendor.com/image.jpg',
				name: 'Test Vendor',
				phone: '+1234567890',
				userId: 'user-123',
				website: 'https://testvendor.com',
			};

			const result = GrpcVendorCreateDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject missing required fields', () => {
			const invalidData = {
				description: 'A test vendor',
				name: 'Test Vendor',
				// missing other required fields
			};

			const result = GrpcVendorCreateDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject non-string userId', () => {
			const invalidData = {
				description: 'A test vendor',
				email: 'test@vendor.com',
				imageUrl: 'https://testvendor.com/image.jpg',
				name: 'Test Vendor',
				phone: '+1234567890',
				userId: 123, // Should be string
				website: 'https://testvendor.com',
			};

			const result = GrpcVendorCreateDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});

	describe('GrpcVendorUpdateDataSchema', () => {
		it('should validate valid gRPC vendor update data', () => {
			const validData = {
				description: 'An updated vendor',
				email: 'updated@vendor.com',
				id: 'vendor-123',
				imageUrl: 'https://updatedvendor.com/image.jpg',
				name: 'Updated Vendor',
				phone: '+1234567890',
				userId: 'user-123',
				website: 'https://updatedvendor.com',
			};

			const result = GrpcVendorUpdateDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject missing required id field', () => {
			const invalidData = {
				description: 'An updated vendor',
				email: 'updated@vendor.com',
				imageUrl: 'https://updatedvendor.com/image.jpg',
				name: 'Updated Vendor',
				phone: '+1234567890',
				userId: 'user-123',
				website: 'https://updatedvendor.com',
				// missing id
			};

			const result = GrpcVendorUpdateDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject non-string id', () => {
			const invalidData = {
				description: 'An updated vendor',
				email: 'updated@vendor.com',
				id: 123, // Should be string
				imageUrl: 'https://updatedvendor.com/image.jpg',
				name: 'Updated Vendor',
				phone: '+1234567890',
				userId: 'user-123',
				website: 'https://updatedvendor.com',
			};

			const result = GrpcVendorUpdateDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});

	describe('GrpcVendorLookupDataSchema', () => {
		it('should validate valid gRPC vendor lookup data', () => {
			const validData = {
				id: 'vendor-123',
			};

			const result = GrpcVendorLookupDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject missing id field', () => {
			const invalidData = {
				// missing id
			};

			const result = GrpcVendorLookupDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject non-string id', () => {
			const invalidData = {
				id: 123, // Should be string
			};

			const result = GrpcVendorLookupDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});
});
