import { beforeEach, describe, expect, it } from 'vitest';
import { HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { WsException } from '@nestjs/websockets';
import { AppError, ErrorType } from './error';
import { ErrorCodes, interpolateMessage } from './error-codes';

describe('AppError', () => {
	let testError: AppError;

	beforeEach(() => {
		testError = new AppError(
			ErrorType.VALIDATION,
			'VALIDATION_ERROR',
			'Validation failed',
			{ field: 'email' },
			'/api/user',
			'req_123',
		);
	});

	describe('constructor', () => {
		it('should create an AppError with all properties', () => {
			expect(testError).toBeInstanceOf(Error);
			expect(testError).toBeInstanceOf(AppError);
			expect(testError.type).toBe(ErrorType.VALIDATION);
			expect(testError.code).toBe('VALIDATION_ERROR');
			expect(testError.message).toBe('Validation failed');
			expect(testError.details).toEqual({ field: 'email' });
			expect(testError.path).toBe('/api/user');
			expect(testError.requestId).toBe('req_123');
			expect(testError.timestamp).toBeDefined();
			expect(new Date(testError.timestamp)).toBeInstanceOf(Date);
		});

		it('should create an AppError with minimal properties', () => {
			const minimalError = new AppError(ErrorType.INTERNAL, 'INTERNAL_SERVER_ERROR', 'Something went wrong');

			expect(minimalError.type).toBe(ErrorType.INTERNAL);
			expect(minimalError.code).toBe('INTERNAL_SERVER_ERROR');
			expect(minimalError.message).toBe('Something went wrong');
			expect(minimalError.details).toBeUndefined();
			expect(minimalError.path).toBeUndefined();
			expect(minimalError.requestId).toBeUndefined();
			expect(minimalError.timestamp).toBeDefined();
		});
	});

	describe('toHttpException', () => {
		it('should convert to HttpException with correct structure', () => {
			const httpException = testError.toHttpException();

			expect(httpException).toBeInstanceOf(HttpException);
			expect(httpException.getStatus()).toBe(400); // VALIDATION = 400
			expect(httpException.getResponse()).toEqual({
				error: {
					code: 'VALIDATION_ERROR',
					details: { field: 'email' },
					message: 'Validation failed',
					path: '/api/user',
					requestId: 'req_123',
					timestamp: testError.timestamp,
					type: ErrorType.VALIDATION,
				},
			});
		});

		it('should handle errors without optional properties', () => {
			const minimalError = new AppError(ErrorType.INTERNAL, 'INTERNAL_SERVER_ERROR', 'Something went wrong');
			const httpException = minimalError.toHttpException();

			expect(httpException.getStatus()).toBe(500); // INTERNAL = 500
			expect(httpException.getResponse()).toEqual({
				error: {
					code: 'INTERNAL_SERVER_ERROR',
					details: undefined,
					message: 'Something went wrong',
					path: undefined,
					requestId: undefined,
					timestamp: minimalError.timestamp,
					type: ErrorType.INTERNAL,
				},
			});
		});
	});

	describe('toGrpcException', () => {
		it('should convert to RpcException with correct structure', () => {
			const grpcException = testError.toGrpcException();

			expect(grpcException).toBeInstanceOf(RpcException);

			const error = grpcException.getError() as any;
			expect(error.code).toBe(3); // INVALID_ARGUMENT for VALIDATION
			expect(error.message).toBe('Validation failed');
			expect(error.details).toBe(
				JSON.stringify({
					code: 'VALIDATION_ERROR',
					details: { field: 'email' },
					path: '/api/user',
					requestId: 'req_123',
					timestamp: testError.timestamp,
					type: ErrorType.VALIDATION,
				}),
			);
		});
	});

	describe('toWsException', () => {
		it('should convert to WsException with correct structure', () => {
			const wsException = testError.toWsException();

			expect(wsException).toBeInstanceOf(WsException);
			expect(wsException.getError()).toEqual({
				code: 'VALIDATION_ERROR',
				details: { field: 'email' },
				message: 'Validation failed',
				path: '/api/user',
				requestId: 'req_123',
				timestamp: testError.timestamp,
				type: ErrorType.VALIDATION,
			});
		});
	});

	describe('HTTP status mapping', () => {
		it.each([
			[ErrorType.AUTHENTICATION, 401],
			[ErrorType.AUTHORIZATION, 403],
			[ErrorType.CONFLICT, 409],
			[ErrorType.EXTERNAL_SERVICE, 502],
			[ErrorType.INTERNAL, 500],
			[ErrorType.NOT_FOUND, 404],
			[ErrorType.RATE_LIMIT, 429],
			[ErrorType.VALIDATION, 400],
		])('should map %s to HTTP status %d', (errorType, expectedStatus) => {
			const error = new AppError(errorType, 'TEST_ERROR', 'Test message');
			const httpException = error.toHttpException();
			expect(httpException.getStatus()).toBe(expectedStatus);
		});
	});

	describe('gRPC status mapping', () => {
		it.each([
			[ErrorType.AUTHENTICATION, 16], // UNAUTHENTICATED
			[ErrorType.AUTHORIZATION, 7], // PERMISSION_DENIED
			[ErrorType.CONFLICT, 6], // ALREADY_EXISTS
			[ErrorType.EXTERNAL_SERVICE, 14], // UNAVAILABLE
			[ErrorType.INTERNAL, 13], // INTERNAL
			[ErrorType.NOT_FOUND, 5], // NOT_FOUND
			[ErrorType.RATE_LIMIT, 8], // RESOURCE_EXHAUSTED
			[ErrorType.VALIDATION, 3], // INVALID_ARGUMENT
		])('should map %s to gRPC status %d', (errorType, expectedStatus) => {
			const error = new AppError(errorType, 'TEST_ERROR', 'Test message');
			const grpcException = error.toGrpcException();
			const grpcError = grpcException.getError() as any;
			expect(grpcError.code).toBe(expectedStatus);
		});
	});

	describe('static factory methods', () => {
		describe('validation', () => {
			it('should create validation error with exact message match', () => {
				const error = AppError.validation('Validation failed for {field}');
				expect(error.type).toBe(ErrorType.VALIDATION);
				expect(error.message).toBe('Validation failed for {field}');
				expect(error.code).toBe('VALIDATION_ERROR');
			});

			it('should create validation error with interpolation', () => {
				const error = AppError.validation('Validation failed for {field}', { field: 'email' });
				expect(error.type).toBe(ErrorType.VALIDATION);
				expect(error.message).toBe('Validation failed for email');
				expect(error.code).toBe('VALIDATION_ERROR');
				expect(error.details).toEqual({ field: 'email' });
			});

			it('should create validation error with unknown message', () => {
				const error = AppError.validation('Custom validation message');
				expect(error.type).toBe(ErrorType.VALIDATION);
				expect(error.message).toBe('Custom validation message');
				expect(error.code).toBe('UNKNOWN_ERROR');
			});
		});

		describe('authentication', () => {
			it('should create authentication error with exact message match', () => {
				const error = AppError.authentication('Authentication required');
				expect(error.type).toBe(ErrorType.AUTHENTICATION);
				expect(error.message).toBe('Authentication required');
				expect(error.code).toBe('UNAUTHORIZED');
			});

			it('should create authentication error with unknown message', () => {
				const error = AppError.authentication('Invalid token');
				expect(error.type).toBe(ErrorType.AUTHENTICATION);
				expect(error.message).toBe('Invalid token');
				expect(error.code).toBe('UNKNOWN_ERROR');
			});
		});

		describe('authorization', () => {
			it('should create authorization error with exact message match', () => {
				const error = AppError.authorization('Insufficient permissions to perform this action');
				expect(error.type).toBe(ErrorType.AUTHORIZATION);
				expect(error.message).toBe('Insufficient permissions to perform this action');
				expect(error.code).toBe('INSUFFICIENT_PERMISSIONS');
			});

			it('should create authorization error with unknown message', () => {
				const error = AppError.authorization('Custom permission error');
				expect(error.type).toBe(ErrorType.AUTHORIZATION);
				expect(error.message).toBe('Custom permission error');
				expect(error.code).toBe('UNKNOWN_ERROR');
			});
		});

		describe('notFound', () => {
			it('should create not found error with exact message match', () => {
				const error = AppError.notFound('Resource not found');
				expect(error.type).toBe(ErrorType.NOT_FOUND);
				expect(error.message).toBe('Resource not found');
				expect(error.code).toBe('RESOURCE_NOT_FOUND');
			});

			it('should create not found error with unknown message', () => {
				const error = AppError.notFound('User not found');
				expect(error.type).toBe(ErrorType.NOT_FOUND);
				expect(error.message).toBe('User not found');
				expect(error.code).toBe('UNKNOWN_ERROR');
			});
		});

		describe('conflict', () => {
			it('should create conflict error with exact message match', () => {
				const error = AppError.conflict('Resource already exists');
				expect(error.type).toBe(ErrorType.CONFLICT);
				expect(error.message).toBe('Resource already exists');
				expect(error.code).toBe('RESOURCE_ALREADY_EXISTS');
			});

			it('should create conflict error with unknown message', () => {
				const error = AppError.conflict('Custom conflict message');
				expect(error.type).toBe(ErrorType.CONFLICT);
				expect(error.message).toBe('Custom conflict message');
				expect(error.code).toBe('UNKNOWN_ERROR');
			});
		});

		describe('rateLimit', () => {
			it('should create rate limit error with exact message match', () => {
				const error = AppError.rateLimit('Rate limit exceeded');
				expect(error.type).toBe(ErrorType.RATE_LIMIT);
				expect(error.message).toBe('Rate limit exceeded');
				expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
			});

			it('should create rate limit error with unknown message', () => {
				const error = AppError.rateLimit('Custom rate limit message');
				expect(error.type).toBe(ErrorType.RATE_LIMIT);
				expect(error.message).toBe('Custom rate limit message');
				expect(error.code).toBe('UNKNOWN_ERROR');
			});
		});

		describe('internal', () => {
			it('should create internal error with exact message match', () => {
				const error = AppError.internal('Internal server error');
				expect(error.type).toBe(ErrorType.INTERNAL);
				expect(error.message).toBe('Internal server error');
				expect(error.code).toBe('INTERNAL_SERVER_ERROR');
			});

			it('should create internal error with unknown message', () => {
				const error = AppError.internal('Database connection failed');
				expect(error.type).toBe(ErrorType.INTERNAL);
				expect(error.message).toBe('Database connection failed');
				expect(error.code).toBe('UNKNOWN_ERROR');
			});
		});

		describe('externalService', () => {
			it('should create external service error with exact message match', () => {
				const error = AppError.externalService('External service "{service}" is unavailable');
				expect(error.type).toBe(ErrorType.EXTERNAL_SERVICE);
				expect(error.message).toBe('External service "{service}" is unavailable');
				expect(error.code).toBe('EXTERNAL_SERVICE_UNAVAILABLE');
			});

			it('should create external service error with interpolation', () => {
				const error = AppError.externalService('External service "{service}" is unavailable', { service: 'payment' });
				expect(error.type).toBe(ErrorType.EXTERNAL_SERVICE);
				expect(error.message).toBe('External service "payment" is unavailable');
				expect(error.code).toBe('EXTERNAL_SERVICE_UNAVAILABLE');
				expect(error.details).toEqual({ service: 'payment' });
			});

			it('should create external service error with unknown message', () => {
				const error = AppError.externalService('Payment service unavailable');
				expect(error.type).toBe(ErrorType.EXTERNAL_SERVICE);
				expect(error.message).toBe('Payment service unavailable');
				expect(error.code).toBe('UNKNOWN_ERROR');
			});
		});
	});

	describe('property mutability', () => {
		it('should allow updating path and requestId', () => {
			testError.path = '/api/vendor';
			testError.requestId = 'req_456';

			expect(testError.path).toBe('/api/vendor');
			expect(testError.requestId).toBe('req_456');
		});
	});
});

describe('ErrorCodes', () => {
	it('should contain all expected error codes', () => {
		expect(ErrorCodes).toHaveProperty('VALIDATION_ERROR');
		expect(ErrorCodes).toHaveProperty('UNAUTHORIZED');
		expect(ErrorCodes).toHaveProperty('RESOURCE_NOT_FOUND');
		expect(ErrorCodes).toHaveProperty('INTERNAL_SERVER_ERROR');
		expect(ErrorCodes).toHaveProperty('RATE_LIMIT_EXCEEDED');
	});

	it('should have string values for all codes', () => {
		Object.values(ErrorCodes).forEach((value) => {
			expect(typeof value).toBe('string');
			expect(value.length).toBeGreaterThan(0);
		});
	});
});

describe('interpolateMessage', () => {
	it('should return original message when no variables provided', () => {
		const message = 'Simple error message';
		const result = interpolateMessage(message);
		expect(result).toBe(message);
	});

	it('should interpolate single variable', () => {
		const message = 'User with ID "{userId}" not found';
		const variables = { userId: '123' };
		const result = interpolateMessage(message, variables);
		expect(result).toBe('User with ID "123" not found');
	});

	it('should interpolate multiple variables', () => {
		const message = 'Database operation "{operation}" failed for user "{userId}"';
		const variables = { operation: 'INSERT', userId: '123' };
		const result = interpolateMessage(message, variables);
		expect(result).toBe('Database operation "INSERT" failed for user "123"');
	});

	it('should handle missing variables', () => {
		const message = 'User with ID "{userId}" not found';
		const variables = { otherField: 'value' };
		const result = interpolateMessage(message, variables);
		expect(result).toBe('User with ID "{userId}" not found');
	});

	it('should handle undefined variables', () => {
		const message = 'User with ID "{userId}" not found';
		const variables = { userId: undefined };
		const result = interpolateMessage(message, variables);
		expect(result).toBe('User with ID "{userId}" not found');
	});

	it('should convert non-string variables to strings', () => {
		const message = 'Count: {count}, Active: {active}';
		const variables = { active: true, count: 42 };
		const result = interpolateMessage(message, variables);
		expect(result).toBe('Count: 42, Active: true');
	});
});
