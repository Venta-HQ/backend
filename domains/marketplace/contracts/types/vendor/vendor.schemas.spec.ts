import { describe, expect, it } from 'vitest';
import { createBasicSchemaTests, createOptionalFieldTests } from '@venta/test/helpers/schema-test-utils';
import {
	CreateVendorSchema,
	GrpcVendorCreateDataSchema,
	GrpcVendorLookupDataSchema,
	GrpcVendorUpdateDataSchema,
	UpdateVendorSchema,
} from './vendor.schemas';

describe('Vendor Schemas', () => {
	describe('CreateVendorSchema', () => {
		const requiredFields = ['name'];
		const optionalFields = ['description', 'email', 'imageUrl', 'phone', 'website'];

		const testCases = createBasicSchemaTests(CreateVendorSchema, requiredFields, optionalFields);
		testCases.forEach(({ name, test }) => {
			it(name, test);
		});

		// Test optional fields with null values
		const nullFieldTests = createOptionalFieldTests(CreateVendorSchema, { name: 'Test Vendor' }, optionalFields);
		nullFieldTests.forEach(({ name, test }) => {
			it(name, test);
		});
	});

	describe('UpdateVendorSchema', () => {
		// All fields are optional in update schema
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
			};

			const result = UpdateVendorSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate empty object (all fields optional)', () => {
			const validData = {};

			const result = UpdateVendorSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate data with null values for nullable fields', () => {
			const validData = {
				description: null,
				email: null,
				imageUrl: null,
				phone: null,
				website: null,
				// name is optional but not nullable
			};

			const result = UpdateVendorSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe('GrpcVendorCreateDataSchema', () => {
		const testCases = createBasicSchemaTests(GrpcVendorCreateDataSchema, ['name', 'userId']);

		testCases.forEach(({ name, test }) => {
			it(name, test);
		});
	});

	describe('GrpcVendorUpdateDataSchema', () => {
		const testCases = createBasicSchemaTests(GrpcVendorUpdateDataSchema, ['id']);

		testCases.forEach(({ name, test }) => {
			it(name, test);
		});
	});

	describe('GrpcVendorLookupDataSchema', () => {
		const testCases = createBasicSchemaTests(GrpcVendorLookupDataSchema, ['id']);

		testCases.forEach(({ name, test }) => {
			it(name, test);
		});
	});
});
