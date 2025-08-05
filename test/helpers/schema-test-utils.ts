import { z } from 'zod';

export interface SchemaTestCase {
	name: string;
	data: any;
	shouldPass: boolean;
	expectedError?: string;
}

/**
 * Creates standardized schema validation tests
 */
export function createSchemaValidationTests(schema: z.ZodSchema, testCases: SchemaTestCase[]) {
	return testCases.map(({ name, data, shouldPass, expectedError }) => ({
		name,
		test: () => {
			const result = schema.safeParse(data);
			expect(result.success).toBe(shouldPass);
			
			if (!shouldPass && expectedError) {
				expect(result.error?.message).toContain(expectedError);
			}
		}
	}));
}

/**
 * Creates basic schema validation test cases for common patterns
 */
export function createBasicSchemaTests(schema: z.ZodSchema, requiredFields: string[], optionalFields: string[] = []) {
	const testCases: SchemaTestCase[] = [];

	// Test valid data with all fields
	const validData: any = {};
	requiredFields.forEach(field => {
		validData[field] = `test_${field}`;
	});
	optionalFields.forEach(field => {
		validData[field] = `test_${field}`;
	});
	
	testCases.push({
		name: 'should validate valid data with all fields',
		data: validData,
		shouldPass: true
	});

	// Test valid data with only required fields
	const minimalData: any = {};
	requiredFields.forEach(field => {
		minimalData[field] = `test_${field}`;
	});
	
	testCases.push({
		name: 'should validate data with only required fields',
		data: minimalData,
		shouldPass: true
	});

	// Test missing required fields
	requiredFields.forEach(field => {
		const invalidData = { ...validData };
		delete invalidData[field];
		
		testCases.push({
			name: `should reject missing required field: ${field}`,
			data: invalidData,
			shouldPass: false,
			expectedError: field
		});
	});

	// Test invalid field types
	requiredFields.forEach(field => {
		const invalidData = { ...validData };
		invalidData[field] = 123; // Invalid type
		
		testCases.push({
			name: `should reject invalid type for field: ${field}`,
			data: invalidData,
			shouldPass: false,
			expectedError: field
		});
	});

	return testCases;
}

/**
 * Creates test cases for optional fields
 */
export function createOptionalFieldTests(schema: z.ZodSchema, baseData: any, optionalFields: string[]) {
	const testCases: SchemaTestCase[] = [];

	optionalFields.forEach(field => {
		// Test with null value
		const nullData = { ...baseData };
		nullData[field] = null;
		
		testCases.push({
			name: `should accept null value for optional field: ${field}`,
			data: nullData,
			shouldPass: true
		});

		// Test with undefined value
		const undefinedData = { ...baseData };
		delete undefinedData[field];
		
		testCases.push({
			name: `should accept undefined value for optional field: ${field}`,
			data: undefinedData,
			shouldPass: true
		});
	});

	return testCases;
} 