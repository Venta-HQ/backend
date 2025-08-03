import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AppError, ErrorType } from '@app/errors';
import { SchemaValidatorPipe } from './schema-validator.pipe';

// Test schemas
const UserSchema = z.object({
	age: z.number().min(18, 'Must be at least 18 years old'),
	email: z.string().email('Invalid email format'),
	name: z.string().min(1, 'Name is required'),
});

const VendorSchema = z.object({
	description: z.string().optional(),
	location: z.object({
		lat: z.number(),
		long: z.number(),
	}),
	name: z.string().min(1, 'Name is required'),
});

describe('SchemaValidatorPipe', () => {
	let pipe: SchemaValidatorPipe;

	beforeEach(() => {
		pipe = new SchemaValidatorPipe(UserSchema);
		vi.clearAllMocks();
	});

	describe('valid data', () => {
		it('should return parsed data for valid input', () => {
			const validData = {
				age: 25,
				email: 'john@example.com',
				name: 'John Doe',
			};

			const result = pipe.transform(validData, {} as any);

			expect(result).toEqual(validData);
		});

		it('should handle optional fields', () => {
			const vendorPipe = new SchemaValidatorPipe(VendorSchema);
			const validData = {
				location: {
					lat: 40.7128,
					long: -74.006,
				},
				name: 'Test Vendor',
			};

			const result = vendorPipe.transform(validData, {} as any);

			expect(result).toEqual(validData);
		});

		it('should handle empty objects when schema allows it', () => {
			const EmptySchema = z.object({});
			const emptyPipe = new SchemaValidatorPipe(EmptySchema);

			const result = emptyPipe.transform({}, {} as any);
			expect(result).toEqual({});
		});

		it('should handle primitive values', () => {
			const StringSchema = z.string().min(1);
			const stringPipe = new SchemaValidatorPipe(StringSchema);

			const result = stringPipe.transform('test', {} as any);
			expect(result).toBe('test');
		});
	});

	describe('invalid data', () => {
		it('should throw AppError with validation details for invalid input', () => {
			const invalidData = {
				age: 15,
				email: 'invalid-email',
				name: '',
			};

			expect(() => pipe.transform(invalidData, {} as any)).toThrow(AppError);
		});

		it('should include field and errors in validation error', () => {
			const invalidData = {
				age: 15,
				email: 'invalid-email',
				name: '',
			};

			try {
				pipe.transform(invalidData, {} as any);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect(error.type).toBe(ErrorType.VALIDATION);
				expect(error.code).toBe('VALIDATION_ERROR');
				expect(error.details).toEqual({
					errors: [
						{ message: 'Must be at least 18 years old', path: 'age' },
						{ message: 'Invalid email format', path: 'email' },
						{ message: 'Name is required', path: 'name' },
					],
					field: 'age',
				});
			}
		});

		it('should handle missing required fields', () => {
			const invalidData = {
				age: 25,
				// missing email and name
			};

			try {
				pipe.transform(invalidData, {} as any);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect(error.type).toBe(ErrorType.VALIDATION);
				expect(error.code).toBe('VALIDATION_ERROR');
				expect(error.details).toEqual({
					errors: [
						{ message: 'Required', path: 'email' },
						{ message: 'Required', path: 'name' },
					],
					field: 'email',
				});
			}
		});

		it('should handle nested object validation errors', () => {
			const nestedPipe = new SchemaValidatorPipe(VendorSchema);
			const invalidData = {
				location: {
					lat: 'invalid', // should be number
					long: -74.006,
				},
				name: 'Test Vendor',
			};

			try {
				nestedPipe.transform(invalidData, {} as any);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect(error.type).toBe(ErrorType.VALIDATION);
				expect(error.code).toBe('VALIDATION_ERROR');
				expect(error.details).toEqual({
					errors: [{ message: 'Expected number, received string', path: 'location.lat' }],
					field: 'location.lat',
				});
			}
		});

		it('should handle non-Zod errors gracefully', () => {
			const mockSchema = {
				parse: vi.fn().mockImplementation(() => {
					throw new Error('Non-Zod error');
				}),
			};

			const customPipe = new SchemaValidatorPipe(mockSchema as any);

			try {
				customPipe.transform({}, {} as any);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect(error.type).toBe(ErrorType.VALIDATION);
				expect(error.code).toBe('VALIDATION_ERROR');
				expect(error.details).toBeUndefined();
			}
		});
	});

	describe('error formatting', () => {
		it('should format ZodError paths correctly', () => {
			const NestedSchema = z.object({
				user: z.object({
					profile: z.object({
						name: z.string().min(1),
					}),
				}),
			});

			const nestedPipe = new SchemaValidatorPipe(NestedSchema);
			const invalidData = {
				user: {
					profile: {
						name: '',
					},
				},
			};

			try {
				nestedPipe.transform(invalidData, {} as any);
			} catch (error) {
				expect(error.details).toEqual({
					errors: [{ message: 'String must contain at least 1 character(s)', path: 'user.profile.name' }],
					field: 'user.profile.name',
				});
			}
		});

		it('should handle array path formatting', () => {
			const ArraySchema = z.object({
				users: z.array(
					z.object({
						name: z.string().min(1),
					}),
				),
			});

			const arrayPipe = new SchemaValidatorPipe(ArraySchema);
			const invalidData = {
				users: [{ name: '' }, { name: 'Valid' }],
			};

			try {
				arrayPipe.transform(invalidData, {} as any);
			} catch (error) {
				expect(error.details).toEqual({
					errors: [{ message: 'String must contain at least 1 character(s)', path: 'users.0.name' }],
					field: 'users.0.name',
				});
			}
		});
	});

	describe('metadata handling', () => {
		it('should ignore metadata parameter', () => {
			const validData = {
				age: 25,
				email: 'john@example.com',
				name: 'John Doe',
			};

			const metadata = {
				data: 'user',
				metatype: Object,
				type: 'body',
			};

			const result = pipe.transform(validData, metadata as any);
			expect(result).toEqual(validData);
		});

		it('should handle different metadata types (for protocol compatibility)', () => {
			const validData = {
				age: 25,
				email: 'john@example.com',
				name: 'John Doe',
			};

			// Test with HTTP metadata
			const httpResult = pipe.transform(validData, { type: 'body' } as any);
			expect(httpResult).toEqual(validData);

			// Test with gRPC metadata (any type)
			const grpcResult = pipe.transform(validData, {} as any);
			expect(grpcResult).toEqual(validData);

			// Test with WebSocket metadata
			const wsResult = pipe.transform(validData, { type: 'body' } as any);
			expect(wsResult).toEqual(validData);
		});
	});

	describe('protocol compatibility', () => {
		it('should work consistently across different protocols', () => {
			const SimpleSchema = z.object({
				email: z.string().email(),
				name: z.string().min(1),
			});

			const validData = {
				email: 'test@example.com',
				name: 'Test User',
			};

			const invalidData = {
				email: 'invalid',
				name: '',
			};

			const simplePipe = new SchemaValidatorPipe(SimpleSchema);

			// All should handle valid data the same way
			expect(simplePipe.transform(validData, {} as any)).toEqual(validData);

			// All should throw the same type of error for invalid data
			expect(() => simplePipe.transform(invalidData, {} as any)).toThrow(AppError);

			try {
				simplePipe.transform(invalidData, {} as any);
			} catch (error) {
				expect(error.type).toBe(ErrorType.VALIDATION);
				expect(error.code).toBe('VALIDATION_ERROR');
			}
		});
	});
});
