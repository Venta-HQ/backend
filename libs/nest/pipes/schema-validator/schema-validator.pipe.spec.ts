import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ArgumentMetadata } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
// Import after mocking
import { SchemaValidatorPipe } from './schema-validator.pipe';

// Mock the dependencies
vi.mock('@venta/nest/errors', () => ({
	AppError: {
		validation: vi.fn((code: string, details: any) => {
			const error = new Error(`AppError: ${code}`);
			error.name = 'AppError';
			Object.assign(error, { code, ...details });
			return error;
		}),
	},
	ErrorCodes: {
		ERR_INVALID_INPUT: 'ERR_INVALID_INPUT',
	},
}));

vi.mock('@venta/nest/modules', () => ({
	Logger: vi.fn().mockImplementation(() => ({
		setContext: vi.fn().mockReturnThis(),
		error: vi.fn(),
		debug: vi.fn(),
		warn: vi.fn(),
		log: vi.fn(),
	})),
}));

describe('SchemaValidatorPipe', () => {
	const httpMeta: ArgumentMetadata = { type: 'body' };
	const webSocketMeta: ArgumentMetadata = { type: 'custom', data: 'MessageBody' };

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic functionality', () => {
		it('passes valid data through unchanged', () => {
			const pipe = new SchemaValidatorPipe(z.object({ id: z.string() }));
			const value = pipe.transform({ id: 'test-id' }, httpMeta);
			expect(value).toEqual({ id: 'test-id' });
		});

		it('validates and transforms data correctly', () => {
			const schema = z.object({
				lat: z.number().min(-90).max(90),
				lng: z.number().min(-180).max(180),
			});

			const pipe = new SchemaValidatorPipe(schema);
			const validData = { lat: 40.7128, lng: -74.006 };
			const result = pipe.transform(validData, httpMeta);

			expect(result).toEqual(validData);
		});
	});

	describe('Auto-detection and error handling', () => {
		it('auto-detects HTTP context and throws AppError', () => {
			const schema = z.object({
				lat: z.number().min(-90).max(90),
				lng: z.number().min(-180).max(180),
			});

			const pipe = new SchemaValidatorPipe(schema);

			expect(() => {
				pipe.transform({ lat: 100, lng: -74.006 }, httpMeta); // Invalid lat > 90
			}).toThrow(); // Should throw regular error (not WsException)

			// Verify it doesn't throw WsException for HTTP context
			try {
				pipe.transform({ lat: 100, lng: -74.006 }, httpMeta);
			} catch (error) {
				expect(error).not.toBeInstanceOf(WsException);
				expect(error.name).toBe('AppError');
			}
		});

		it('auto-detects WebSocket context and throws WsException', () => {
			const schema = z.object({
				lat: z.number().min(-90).max(90),
				lng: z.number().min(-180).max(180),
			});

			const pipe = new SchemaValidatorPipe(schema);

			expect(() => {
				pipe.transform({ lat: 100, lng: -74.006 }, webSocketMeta); // Invalid lat > 90
			}).toThrow(WsException); // Should auto-detect and throw WsException
		});

		it('works with complex validation schemas', () => {
			const userLocationSchema = z
				.object({
					lat: z.number().min(-90).max(90).optional(),
					lng: z.number().min(-180).max(180).optional(),
					latitude: z.number().min(-90).max(90).optional(),
					longitude: z.number().min(-180).max(180).optional(),
				})
				.refine(
					(data) =>
						(data.lat !== undefined && data.lng !== undefined) ||
						(data.latitude !== undefined && data.longitude !== undefined),
					{ message: 'Either (lat, lng) or (latitude, longitude) coordinates must be provided' },
				);

			const pipe = new SchemaValidatorPipe(userLocationSchema);

			// Should work with lat/lng format
			const result1 = pipe.transform({ lat: 40.7128, lng: -74.006 }, webSocketMeta);
			expect(result1).toEqual({ lat: 40.7128, lng: -74.006 });

			// Should work with latitude/longitude format
			const result2 = pipe.transform({ latitude: 40.7128, longitude: -74.006 }, webSocketMeta);
			expect(result2).toEqual({ latitude: 40.7128, longitude: -74.006 });

			// Should fail validation and throw WsException (auto-detected)
			expect(() => {
				pipe.transform({ lat: 40.7128 }, webSocketMeta); // Missing lng
			}).toThrow(WsException);
		});
	});

	describe('Context detection logic', () => {
		it('detects WebSocket context from custom metadata with MessageBody', () => {
			const pipe = new SchemaValidatorPipe(z.object({ test: z.string() }));
			const customMeta: ArgumentMetadata = { type: 'custom', data: 'MessageBody' };

			expect(() => {
				pipe.transform({ test: 123 }, customMeta); // Invalid - number instead of string
			}).toThrow(WsException);
		});

		it('detects WebSocket context from custom metadata without data', () => {
			const pipe = new SchemaValidatorPipe(z.object({ test: z.string() }));
			const customMeta: ArgumentMetadata = { type: 'custom' };

			expect(() => {
				pipe.transform({ test: 123 }, customMeta); // Invalid - number instead of string
			}).toThrow(WsException);
		});

		it('detects HTTP context from body metadata', () => {
			const pipe = new SchemaValidatorPipe(z.object({ test: z.string() }));
			const bodyMeta: ArgumentMetadata = { type: 'body' };

			expect(() => {
				pipe.transform({ test: 123 }, bodyMeta); // Invalid - number instead of string
			}).toThrow(); // Should throw but not WsException

			try {
				pipe.transform({ test: 123 }, bodyMeta);
			} catch (error) {
				expect(error).not.toBeInstanceOf(WsException);
			}
		});

		it('detects HTTP context from other metadata types', () => {
			const pipe = new SchemaValidatorPipe(z.object({ test: z.string() }));

			// Test various HTTP metadata types
			const queryMeta: ArgumentMetadata = { type: 'query' };
			const paramMeta: ArgumentMetadata = { type: 'param' };

			// Both should throw errors but not WsException
			expect(() => {
				pipe.transform({ test: 123 }, queryMeta);
			}).toThrow();

			expect(() => {
				pipe.transform({ test: 123 }, paramMeta);
			}).toThrow();

			// Verify they're not WsExceptions
			try {
				pipe.transform({ test: 123 }, queryMeta);
			} catch (error) {
				expect(error).not.toBeInstanceOf(WsException);
			}

			try {
				pipe.transform({ test: 123 }, paramMeta);
			} catch (error) {
				expect(error).not.toBeInstanceOf(WsException);
			}
		});
	});
});
