import { z } from 'zod';

export interface SchemaTestCase {
	data: any;
	expectedError?: string;
	name: string;
	shouldPass: boolean;
}

/**
 * Creates basic schema validation test cases for common patterns
 */
export function createBasicSchemaTests(schema: z.ZodSchema, requiredFields: string[], optionalFields: string[] = []) {
	const testCases: SchemaTestCase[] = [];

	// Test valid data with all fields
	const validData: any = {};
	requiredFields.forEach((field) => {
		validData[field] = `test_${field}`;
	});
	optionalFields.forEach((field) => {
		validData[field] = `test_${field}`;
	});

	testCases.push({
		data: validData,
		name: 'should validate valid data with all fields',
		shouldPass: true,
	});

	// Test valid data with only required fields
	const minimalData: any = {};
	requiredFields.forEach((field) => {
		minimalData[field] = `test_${field}`;
	});

	testCases.push({
		data: minimalData,
		name: 'should validate data with only required fields',
		shouldPass: true,
	});

	// Test missing required fields
	requiredFields.forEach((field) => {
		const invalidData = { ...validData };
		delete invalidData[field];

		testCases.push({
			data: invalidData,
			expectedError: field,
			name: `should reject missing required field: ${field}`,
			shouldPass: false,
		});
	});

	// Test invalid field types
	requiredFields.forEach((field) => {
		const invalidData = { ...validData };
		invalidData[field] = 123; // Invalid type

		testCases.push({
			data: invalidData,
			expectedError: field,
			name: `should reject invalid type for field: ${field}`,
			shouldPass: false,
		});
	});

	return testCases;
}

/**
 * Creates test cases for optional fields
 */
export function createOptionalFieldTests(schema: z.ZodSchema, baseData: any, optionalFields: string[]) {
	const testCases: SchemaTestCase[] = [];

	optionalFields.forEach((field) => {
		// Test with null value
		const nullData = { ...baseData };
		nullData[field] = null;

		testCases.push({
			data: nullData,
			name: `should accept null value for optional field: ${field}`,
			shouldPass: true,
		});

		// Test with undefined value
		const undefinedData = { ...baseData };
		delete undefinedData[field];

		testCases.push({
			data: undefinedData,
			name: `should accept undefined value for optional field: ${field}`,
			shouldPass: true,
		});
	});

	return testCases;
}
