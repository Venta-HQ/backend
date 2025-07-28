import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AppError, ErrorType } from '@app/nest/errors';
import { GrpcSchemaValidatorPipe } from './grpc-schema-validator.pipe';
import { SchemaValidatorPipe } from './schema-validator.pipe';
import { WsSchemaValidatorPipe } from './ws-schema-validator.pipe';

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

		it('should handle nested object validation errors', () => {
			const nestedPipe = new SchemaValidatorPipe(VendorSchema);
			const invalidData = {
				location: {
					lat: 'invalid',
					long: 'invalid',
				},
				name: 'Test Vendor',
			};

			try {
				nestedPipe.transform(invalidData, {} as any);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect(error.details).toEqual({
					errors: [
						{ message: 'Expected number, received string', path: 'location.lat' },
						{ message: 'Expected number, received string', path: 'location.long' },
					],
					field: 'location.lat',
				});
			}
		});

		it('should handle non-ZodError exceptions', () => {
			// Mock the schema to throw a non-ZodError
			const mockSchema = {
				parse: vi.fn().mockImplementation(() => {
					throw new Error('Custom error');
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

		it('should handle null values', () => {
			try {
				pipe.transform(null, {} as any);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect(error.type).toBe(ErrorType.VALIDATION);
				expect(error.code).toBe('VALIDATION_ERROR');
				expect(error.details).toEqual({
					errors: [{ message: 'Expected object, received null', path: '' }],
					field: '',
				});
			}
		});

		it('should handle undefined values', () => {
			try {
				pipe.transform(undefined, {} as any);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect(error.type).toBe(ErrorType.VALIDATION);
				expect(error.code).toBe('VALIDATION_ERROR');
				expect(error.details).toEqual({
					errors: [{ message: 'Required', path: '' }],
					field: '',
				});
			}
		});

		it('should handle empty arrays when object is expected', () => {
			try {
				pipe.transform([], {} as any);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect(error.type).toBe(ErrorType.VALIDATION);
				expect(error.code).toBe('VALIDATION_ERROR');
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
	});
});

describe('GrpcSchemaValidatorPipe', () => {
	let pipe: GrpcSchemaValidatorPipe;

	beforeEach(() => {
		pipe = new GrpcSchemaValidatorPipe(UserSchema);
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
	});
});

describe('WsSchemaValidatorPipe', () => {
	let pipe: WsSchemaValidatorPipe;

	beforeEach(() => {
		pipe = new WsSchemaValidatorPipe(UserSchema);
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
	});
});

describe('Schema Validator Pipes Integration', () => {
	it('should handle complex nested schemas consistently across all pipes', () => {
		const ComplexSchema = z.object({
			user: z.object({
				profile: z.object({
					email: z.string().email(),
					name: z.string().min(1),
					preferences: z.object({
						notifications: z.boolean(),
						theme: z.enum(['light', 'dark']),
					}),
				}),
				settings: z.object({
					language: z.string(),
					timezone: z.string(),
				}),
			}),
		});

		const validData = {
			user: {
				profile: {
					email: 'john@example.com',
					name: 'John Doe',
					preferences: {
						notifications: true,
						theme: 'dark',
					},
				},
				settings: {
					language: 'en',
					timezone: 'UTC',
				},
			},
		};

		const httpPipe = new SchemaValidatorPipe(ComplexSchema);
		const grpcPipe = new GrpcSchemaValidatorPipe(ComplexSchema);
		const wsPipe = new WsSchemaValidatorPipe(ComplexSchema);

		// All pipes should handle valid data the same way
		expect(httpPipe.transform(validData, {} as any)).toEqual(validData);
		expect(grpcPipe.transform(validData, {} as any)).toEqual(validData);
		expect(wsPipe.transform(validData, {} as any)).toEqual(validData);
	});

	it('should handle validation errors consistently across all pipes', () => {
		const SimpleSchema = z.object({
			email: z.string().email(),
			name: z.string().min(1),
		});

		const invalidData = {
			email: 'invalid',
			name: '',
		};

		const httpPipe = new SchemaValidatorPipe(SimpleSchema);
		const grpcPipe = new GrpcSchemaValidatorPipe(SimpleSchema);
		const wsPipe = new WsSchemaValidatorPipe(SimpleSchema);

		// All pipes should throw the same type of error
		expect(() => httpPipe.transform(invalidData, {} as any)).toThrow(AppError);
		expect(() => grpcPipe.transform(invalidData, {} as any)).toThrow(AppError);
		expect(() => wsPipe.transform(invalidData, {} as any)).toThrow(AppError);

		// All pipes should have the same error structure
		try {
			httpPipe.transform(invalidData, {} as any);
		} catch (httpError) {
			try {
				grpcPipe.transform(invalidData, {} as any);
			} catch (grpcError) {
				try {
					wsPipe.transform(invalidData, {} as any);
				} catch (wsError) {
					expect(httpError.type).toBe(grpcError.type);
					expect(grpcError.type).toBe(wsError.type);
					expect(httpError.code).toBe(grpcError.code);
					expect(grpcError.code).toBe(wsError.code);
				}
			}
		}
	});
});
