import { describe, it, expect } from 'vitest';
import {
	CreateVendorSchema,
	UpdateVendorSchema,
	GrpcVendorCreateDataSchema,
	GrpcVendorUpdateDataSchema,
	GrpcVendorLookupDataSchema,
} from './vendor.schemas';

describe('Vendor Schemas', () => {
	describe('CreateVendorSchema', () => {
		it('should validate valid vendor creation data', () => {
			const validData = {
				name: 'Test Vendor',
				description: 'A test vendor',
				email: 'test@vendor.com',
				phone: '+1234567890',
				website: 'https://testvendor.com',
				imageUrl: 'https://testvendor.com/image.jpg',
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
				name: 'Test Vendor',
				description: null,
				email: null,
				phone: null,
				website: null,
				imageUrl: null,
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
				name: 123, // Should be string
				description: 'A test vendor',
			};

			const result = CreateVendorSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});

	describe('UpdateVendorSchema', () => {
		it('should validate valid vendor update data', () => {
			const validData = {
				name: 'Updated Vendor',
				description: 'An updated vendor',
				email: 'updated@vendor.com',
				phone: '+1234567890',
				website: 'https://updatedvendor.com',
				imageUrl: 'https://updatedvendor.com/image.jpg',
			};

			const result = UpdateVendorSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate data with only some fields', () => {
			const validData = {
				name: 'Updated Vendor',
				email: 'updated@vendor.com',
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
				name: 'Updated Vendor',
				description: null,
				email: null,
				phone: null,
				website: null,
				imageUrl: null,
			};

			const result = UpdateVendorSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe('GrpcVendorCreateDataSchema', () => {
		it('should validate valid gRPC vendor creation data', () => {
			const validData = {
				name: 'Test Vendor',
				description: 'A test vendor',
				email: 'test@vendor.com',
				phone: '+1234567890',
				website: 'https://testvendor.com',
				imageUrl: 'https://testvendor.com/image.jpg',
				userId: 'user-123',
			};

			const result = GrpcVendorCreateDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject missing required fields', () => {
			const invalidData = {
				name: 'Test Vendor',
				description: 'A test vendor',
				// missing other required fields
			};

			const result = GrpcVendorCreateDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject non-string userId', () => {
			const invalidData = {
				name: 'Test Vendor',
				description: 'A test vendor',
				email: 'test@vendor.com',
				phone: '+1234567890',
				website: 'https://testvendor.com',
				imageUrl: 'https://testvendor.com/image.jpg',
				userId: 123, // Should be string
			};

			const result = GrpcVendorCreateDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});

	describe('GrpcVendorUpdateDataSchema', () => {
		it('should validate valid gRPC vendor update data', () => {
			const validData = {
				id: 'vendor-123',
				name: 'Updated Vendor',
				description: 'An updated vendor',
				email: 'updated@vendor.com',
				phone: '+1234567890',
				website: 'https://updatedvendor.com',
				imageUrl: 'https://updatedvendor.com/image.jpg',
				userId: 'user-123',
			};

			const result = GrpcVendorUpdateDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject missing required id field', () => {
			const invalidData = {
				name: 'Updated Vendor',
				description: 'An updated vendor',
				email: 'updated@vendor.com',
				phone: '+1234567890',
				website: 'https://updatedvendor.com',
				imageUrl: 'https://updatedvendor.com/image.jpg',
				userId: 'user-123',
				// missing id
			};

			const result = GrpcVendorUpdateDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject non-string id', () => {
			const invalidData = {
				id: 123, // Should be string
				name: 'Updated Vendor',
				description: 'An updated vendor',
				email: 'updated@vendor.com',
				phone: '+1234567890',
				website: 'https://updatedvendor.com',
				imageUrl: 'https://updatedvendor.com/image.jpg',
				userId: 'user-123',
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