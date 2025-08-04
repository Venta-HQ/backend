import { describe, it, expect } from 'vitest';
import { HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { WsException } from '@nestjs/websockets';
import { AppError, ErrorType } from './app-error';
import { ErrorCodes } from './errorcodes';

describe('AppError', () => {
	describe('static factory methods', () => {
		it('should create authentication error', () => {
			const error = AppError.authentication(ErrorCodes.UNAUTHORIZED);
			expect(error.type).toBe(ErrorType.AUTHENTICATION);
			expect(error.code).toBe('UNAUTHORIZED');
			expect(error.message).toBe('Authentication required');
		});

		it('should create authorization error', () => {
			const error = AppError.authorization(ErrorCodes.INSUFFICIENT_PERMISSIONS);
			expect(error.type).toBe(ErrorType.AUTHORIZATION);
			expect(error.code).toBe('INSUFFICIENT_PERMISSIONS');
			expect(error.message).toBe('Insufficient permissions to perform this action');
		});

		it('should create validation error', () => {
			const details = { field: 'email', value: 'invalid' };
			const error = AppError.validation(ErrorCodes.VALIDATION_ERROR, details);
			expect(error.type).toBe(ErrorType.VALIDATION);
			expect(error.code).toBe('VALIDATION_ERROR');
			expect(error.message).toBe('Validation failed for email');
		});

		it('should create not found error', () => {
			const error = AppError.notFound(ErrorCodes.USER_NOT_FOUND);
			expect(error.type).toBe(ErrorType.NOT_FOUND);
			expect(error.code).toBe('USER_NOT_FOUND');
			expect(error.message).toBe('User with ID "{userId}" not found');
		});

		it('should create conflict error', () => {
			const error = AppError.conflict(ErrorCodes.USER_ALREADY_EXISTS);
			expect(error.type).toBe(ErrorType.CONFLICT);
			expect(error.code).toBe('USER_ALREADY_EXISTS');
			expect(error.message).toBe('User already exists');
		});

		it('should create rate limit error', () => {
			const error = AppError.rateLimit(ErrorCodes.TOO_MANY_REQUESTS);
			expect(error.type).toBe(ErrorType.RATE_LIMIT);
			expect(error.code).toBe('TOO_MANY_REQUESTS');
			expect(error.message).toBe('Too many requests');
		});

		it('should create external service error', () => {
			const error = AppError.externalService(ErrorCodes.EXTERNAL_SERVICE_UNAVAILABLE);
			expect(error.type).toBe(ErrorType.EXTERNAL_SERVICE);
			expect(error.code).toBe('EXTERNAL_SERVICE_UNAVAILABLE');
			expect(error.message).toBe('External service "{service}" is unavailable');
		});

		it('should create internal error', () => {
			const error = AppError.internal(ErrorCodes.INTERNAL_SERVER_ERROR);
			expect(error.type).toBe(ErrorType.INTERNAL);
			expect(error.code).toBe('INTERNAL_SERVER_ERROR');
			expect(error.message).toBe('Internal server error');
		});
	});

	describe('constructor', () => {
		it('should create error with all properties', () => {
			const details = { userId: '123' };
			const error = new AppError(
				ErrorType.NOT_FOUND,
				'USER_NOT_FOUND',
				'User not found',
				details,
				'/api/users/123',
				'req-123'
			);

			expect(error.type).toBe(ErrorType.NOT_FOUND);
			expect(error.code).toBe('USER_NOT_FOUND');
			expect(error.message).toBe('User not found');
			expect(error.details).toEqual(details);
			expect(error.path).toBe('/api/users/123');
			expect(error.requestId).toBe('req-123');
			expect(error.timestamp).toBeDefined();
		});

		it('should create error without details', () => {
			const error = new AppError(
				ErrorType.AUTHENTICATION,
				'UNAUTHORIZED',
				'Authentication required'
			);

			expect(error.type).toBe(ErrorType.AUTHENTICATION);
			expect(error.code).toBe('UNAUTHORIZED');
			expect(error.message).toBe('Authentication required');
			expect(error.details).toBeUndefined();
		});
	});

	describe('toHttpException', () => {
		it('should convert to HttpException', () => {
			const error = new AppError(ErrorType.NOT_FOUND, 'USER_NOT_FOUND', 'User not found');
			const httpException = error.toHttpException();

			expect(httpException).toBeInstanceOf(HttpException);
			expect(httpException.getStatus()).toBe(404);
			expect(httpException.getResponse()).toEqual({
				error: {
					code: 'USER_NOT_FOUND',
					details: undefined,
					message: 'User not found',
					path: undefined,
					requestId: undefined,
					timestamp: error.timestamp,
					type: 'NOT_FOUND',
				},
			});
		});

		it('should include details in response', () => {
			const details = { userId: '123' };
			const error = new AppError(ErrorType.NOT_FOUND, 'USER_NOT_FOUND', 'User not found', details);
			const httpException = error.toHttpException();

			expect(httpException.getResponse()).toEqual({
				error: {
					code: 'USER_NOT_FOUND',
					details,
					message: 'User not found',
					path: undefined,
					requestId: undefined,
					timestamp: error.timestamp,
					type: 'NOT_FOUND',
				},
			});
		});
	});

	describe('toGrpcException', () => {
		it('should convert to RpcException', () => {
			const error = new AppError(ErrorType.NOT_FOUND, 'USER_NOT_FOUND', 'User with ID "{userId}" not found');
			const grpcException = error.toGrpcException();
			
			expect(grpcException).toBeInstanceOf(RpcException);
			expect(grpcException.getError()).toEqual({
				code: 5, // NOT_FOUND
				details: JSON.stringify({
					code: 'USER_NOT_FOUND',
					details: undefined,
					path: undefined,
					requestId: undefined,
					timestamp: error.timestamp,
					type: 'NOT_FOUND',
				}),
				message: 'User with ID "{userId}" not found',
			});
		});

		it('should include details in gRPC error', () => {
			const details = { userId: '123' };
			const error = new AppError(ErrorType.NOT_FOUND, 'USER_NOT_FOUND', 'User with ID "123" not found', details);
			const grpcException = error.toGrpcException();
			
			expect(grpcException.getError()).toEqual({
				code: 5, // NOT_FOUND
				details: JSON.stringify({
					code: 'USER_NOT_FOUND',
					details,
					path: undefined,
					requestId: undefined,
					timestamp: error.timestamp,
					type: 'NOT_FOUND',
				}),
				message: 'User with ID "123" not found',
			});
		});
	});

	describe('toWsException', () => {
		it('should convert to WsException', () => {
			const error = new AppError(ErrorType.NOT_FOUND, 'USER_NOT_FOUND', 'User not found');
			const wsException = error.toWsException();

			expect(wsException).toBeInstanceOf(WsException);
			expect(wsException.getError()).toEqual({
				code: 'USER_NOT_FOUND',
				details: undefined,
				message: 'User not found',
				path: undefined,
				requestId: undefined,
				timestamp: error.timestamp,
				type: 'NOT_FOUND',
			});
		});

		it('should include details in WebSocket error', () => {
			const details = { userId: '123' };
			const error = new AppError(ErrorType.NOT_FOUND, 'USER_NOT_FOUND', 'User not found', details);
			const wsException = error.toWsException();

			expect(wsException.getError()).toEqual({
				code: 'USER_NOT_FOUND',
				details,
				message: 'User not found',
				path: undefined,
				requestId: undefined,
				timestamp: error.timestamp,
				type: 'NOT_FOUND',
			});
		});
	});
}); 