import { z } from 'zod';

export interface SchemaTestCase {
	data: any;
	expectedError?: string;
	name: string;
	shouldPass: boolean;
}

export interface FieldConfig {
	type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum';
	required: boolean;
	enum?: string[];
	arrayType?: FieldConfig;
	objectFields?: Record<string, FieldConfig>;
	minLength?: number;
	maxLength?: number;
	minValue?: number;
	maxValue?: number;
	pattern?: RegExp;
}

/**
 * Creates a test value based on field configuration
 */
function createTestValue(field: string, config: FieldConfig): any {
	switch (config.type) {
		case 'string':
			return config.pattern ? 'test_pattern_match' : config.minLength ? 'a'.repeat(config.minLength) : `test_${field}`;
		case 'number':
			return config.minValue !== undefined ? config.minValue : 42;
		case 'boolean':
			return true;
		case 'array':
			return config.arrayType ? [createTestValue(field, config.arrayType)] : [];
		case 'object':
			if (!config.objectFields) return {};
			const obj: Record<string, any> = {};
			Object.entries(config.objectFields).forEach(([key, fieldConfig]) => {
				obj[key] = createTestValue(key, fieldConfig);
			});
			return obj;
		case 'enum':
			return config.enum?.[0] ?? `enum_${field}`;
		default:
			return `test_${field}`;
	}
}

/**
 * Creates an invalid test value based on field configuration
 */
function createInvalidTestValue(field: string, config: FieldConfig): any {
	switch (config.type) {
		case 'string':
			return 123;
		case 'number':
			return 'not_a_number';
		case 'boolean':
			return 'not_a_boolean';
		case 'array':
			return 'not_an_array';
		case 'object':
			return 'not_an_object';
		case 'enum':
			return 'invalid_enum_value';
		default:
			return null;
	}
}

/**
 * Creates basic schema validation test cases for common patterns
 */
export function createBasicSchemaTests(schema: z.ZodSchema, fields: Record<string, FieldConfig>) {
	const testCases: SchemaTestCase[] = [];
	const requiredFields = Object.entries(fields)
		.filter(([_, config]) => config.required)
		.map(([field]) => field);
	const optionalFields = Object.entries(fields)
		.filter(([_, config]) => !config.required)
		.map(([field]) => field);

	// Test valid data with all fields
	const validData: Record<string, any> = {};
	Object.entries(fields).forEach(([field, config]) => {
		validData[field] = createTestValue(field, config);
	});

	testCases.push({
		data: validData,
		name: 'should validate valid data with all fields',
		shouldPass: true,
	});

	// Test valid data with only required fields
	const minimalData: Record<string, any> = {};
	requiredFields.forEach((field) => {
		minimalData[field] = createTestValue(field, fields[field]);
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
	Object.entries(fields).forEach(([field, config]) => {
		const invalidData = { ...validData };
		invalidData[field] = createInvalidTestValue(field, config);

		testCases.push({
			data: invalidData,
			expectedError: field,
			name: `should reject invalid type for field: ${field}`,
			shouldPass: false,
		});

		// Add specific validation tests based on field config
		if (config.type === 'string') {
			if (config.minLength) {
				const tooShortData = { ...validData };
				tooShortData[field] = 'a'.repeat(config.minLength - 1);
				testCases.push({
					data: tooShortData,
					expectedError: field,
					name: `should reject too short string for field: ${field}`,
					shouldPass: false,
				});
			}

			if (config.maxLength) {
				const tooLongData = { ...validData };
				tooLongData[field] = 'a'.repeat(config.maxLength + 1);
				testCases.push({
					data: tooLongData,
					expectedError: field,
					name: `should reject too long string for field: ${field}`,
					shouldPass: false,
				});
			}

			if (config.pattern) {
				const invalidPatternData = { ...validData };
				invalidPatternData[field] = 'invalid_pattern';
				testCases.push({
					data: invalidPatternData,
					expectedError: field,
					name: `should reject invalid pattern for field: ${field}`,
					shouldPass: false,
				});
			}
		}

		if (config.type === 'number') {
			if (config.minValue !== undefined) {
				const tooSmallData = { ...validData };
				tooSmallData[field] = config.minValue - 1;
				testCases.push({
					data: tooSmallData,
					expectedError: field,
					name: `should reject too small number for field: ${field}`,
					shouldPass: false,
				});
			}

			if (config.maxValue !== undefined) {
				const tooBigData = { ...validData };
				tooBigData[field] = config.maxValue + 1;
				testCases.push({
					data: tooBigData,
					expectedError: field,
					name: `should reject too big number for field: ${field}`,
					shouldPass: false,
				});
			}
		}

		if (config.type === 'enum' && config.enum) {
			const invalidEnumData = { ...validData };
			invalidEnumData[field] = 'invalid_enum_value';
			testCases.push({
				data: invalidEnumData,
				expectedError: field,
				name: `should reject invalid enum value for field: ${field}`,
				shouldPass: false,
			});
		}
	});

	return testCases;
}

/**
 * Creates test cases for optional fields
 */
export function createOptionalFieldTests(schema: z.ZodSchema, fields: Record<string, FieldConfig>) {
	const testCases: SchemaTestCase[] = [];
	const optionalFields = Object.entries(fields)
		.filter(([_, config]) => !config.required)
		.map(([field]) => field);

	// Create base data with all required fields
	const baseData: Record<string, any> = {};
	Object.entries(fields)
		.filter(([_, config]) => config.required)
		.forEach(([field, config]) => {
			baseData[field] = createTestValue(field, config);
		});

	optionalFields.forEach((field) => {
		const config = fields[field];

		// Test with null value (if nullable)
		const nullData = { ...baseData };
		nullData[field] = null;

		testCases.push({
			data: nullData,
			name: `should handle null value for optional field: ${field}`,
			shouldPass: true,
		});

		// Test with undefined value
		const undefinedData = { ...baseData };
		delete undefinedData[field];

		testCases.push({
			data: undefinedData,
			name: `should handle undefined value for optional field: ${field}`,
			shouldPass: true,
		});

		// Test with valid value
		const validData = { ...baseData };
		validData[field] = createTestValue(field, config);

		testCases.push({
			data: validData,
			name: `should accept valid value for optional field: ${field}`,
			shouldPass: true,
		});
	});

	return testCases;
}

/**
 * Creates test cases for nested object fields
 */
export function createNestedObjectTests(schema: z.ZodSchema, fields: Record<string, FieldConfig>) {
	const testCases: SchemaTestCase[] = [];

	Object.entries(fields).forEach(([field, config]) => {
		if (config.type === 'object' && config.objectFields) {
			// Test with valid nested object
			const validData: Record<string, any> = {};
			Object.entries(fields).forEach(([f, c]) => {
				validData[f] = f === field ? createTestValue(f, config) : createTestValue(f, c);
			});

			testCases.push({
				data: validData,
				name: `should validate valid nested object for field: ${field}`,
				shouldPass: true,
			});

			// Test with invalid nested object structure
			const invalidData = { ...validData };
			invalidData[field] = { invalid_key: 'invalid_value' };

			testCases.push({
				data: invalidData,
				expectedError: field,
				name: `should reject invalid nested object structure for field: ${field}`,
				shouldPass: false,
			});

			// Test nested required fields
			Object.entries(config.objectFields)
				.filter(([_, nestedConfig]) => nestedConfig.required)
				.forEach(([nestedField]) => {
					const missingNestedData = { ...validData };
					const nestedObj = { ...validData[field] };
					delete nestedObj[nestedField];
					missingNestedData[field] = nestedObj;

					testCases.push({
						data: missingNestedData,
						expectedError: `${field}.${nestedField}`,
						name: `should reject missing nested required field: ${field}.${nestedField}`,
						shouldPass: false,
					});
				});
		}
	});

	return testCases;
}
