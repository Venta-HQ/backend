import { describe, it, expect } from 'vitest';
import { AppError, ErrorType } from './app-error';
import { ErrorCodes } from './errorcodes';

describe('AppError', () => {
	describe('static factory methods', () => {
		it('should create authentication error', () => {
			const error = AppError.authentication(ErrorCodes.UNAUTHORIZED);
			
			expect(error).toBeInstanceOf(AppError);
			expect(error.type).toBe(ErrorType.AUTHENTICATION);
			expect(error.message).toBe(ErrorCodes.UNAUTHORIZED);
			expect(error.statusCode).toBe(401);
		});

		it('should create authorization error', () => {
			const error = AppError.authorization(ErrorCodes.INSUFFICIENT_PERMISSIONS);
			
			expect(error).toBeInstanceOf(AppError);
			expect(error.type).toBe(ErrorType.AUTHORIZATION);
			expect(error.message).toBe(ErrorCodes.INSUFFICIENT_PERMISSIONS);
			expect(error.statusCode).toBe(403);
		});

		it('should create validation error', () => {
			const details = { field: 'email' };
			const error = AppError.validation(ErrorCodes.VALIDATION_ERROR, details);
			
			expect(error).toBeInstanceOf(AppError);
			expect(error.type).toBe(ErrorType.VALIDATION);
			expect(error.message).toBe(ErrorCodes.VALIDATION_ERROR);
			expect(error.statusCode).toBe(400);
			expect(error.details).toEqual(details);
		});

		it('should create not found error', () => {
			const error = AppError.notFound(ErrorCodes.USER_NOT_FOUND);
			
			expect(error).toBeInstanceOf(AppError);
			expect(error.type).toBe(ErrorType.NOT_FOUND);
			expect(error.message).toBe(ErrorCodes.USER_NOT_FOUND);
			expect(error.statusCode).toBe(404);
		});

		it('should create conflict error', () => {
			const error = AppError.conflict(ErrorCodes.USER_ALREADY_EXISTS);
			
			expect(error).toBeInstanceOf(AppError);
			expect(error.type).toBe(ErrorType.CONFLICT);
			expect(error.message).toBe(ErrorCodes.USER_ALREADY_EXISTS);
			expect(error.statusCode).toBe(409);
		});

		it('should create rate limit error', () => {
			const error = AppError.rateLimit(ErrorCodes.RATE_LIMIT_EXCEEDED);
			
			expect(error).toBeInstanceOf(AppError);
			expect(error.type).toBe(ErrorType.RATE_LIMIT);
			expect(error.message).toBe(ErrorCodes.RATE_LIMIT_EXCEEDED);
			expect(error.statusCode).toBe(429);
		});

		it('should create external service error', () => {
			const error = AppError.externalService(ErrorCodes.EXTERNAL_SERVICE_UNAVAILABLE);
			
			expect(error).toBeInstanceOf(AppError);
			expect(error.type).toBe(ErrorType.EXTERNAL_SERVICE);
			expect(error.message).toBe(ErrorCodes.EXTERNAL_SERVICE_UNAVAILABLE);
			expect(error.statusCode).toBe(503);
		});

		it('should create internal error', () => {
			const details = { operation: 'database_query' };
			const error = AppError.internal(ErrorCodes.INTERNAL_SERVER_ERROR, details);
			
			expect(error).toBeInstanceOf(AppError);
			expect(error.type).toBe(ErrorType.INTERNAL);
			expect(error.message).toBe(ErrorCodes.INTERNAL_SERVER_ERROR);
			expect(error.statusCode).toBe(500);
			expect(error.details).toEqual(details);
		});
	});

	describe('constructor', () => {
		it('should create error with all properties', () => {
			const details = { userId: '123' };
			const error = new AppError(
				ErrorType.NOT_FOUND,
				ErrorCodes.USER_NOT_FOUND,
				404,
				details
			);
			
			expect(error.type).toBe(ErrorType.NOT_FOUND);
			expect(error.message).toBe(ErrorCodes.USER_NOT_FOUND);
			expect(error.statusCode).toBe(404);
			expect(error.details).toEqual(details);
		});

		it('should create error without details', () => {
			const error = new AppError(
				ErrorType.AUTHENTICATION,
				ErrorCodes.UNAUTHORIZED,
				401
			);
			
			expect(error.type).toBe(ErrorType.AUTHENTICATION);
			expect(error.message).toBe(ErrorCodes.UNAUTHORIZED);
			expect(error.statusCode).toBe(401);
			expect(error.details).toBeUndefined();
		});
	});

	describe('toHttpException', () => {
		it('should convert to HttpException', () => {
			const error = AppError.notFound(ErrorCodes.USER_NOT_FOUND);
			const httpException = error.toHttpException();
			
			expect(httpException.getStatus()).toBe(404);
			expect(httpException.getResponse()).toEqual({
				code: ErrorCodes.USER_NOT_FOUND,
				message: ErrorCodes.USER_NOT_FOUND,
				statusCode: 404,
				timestamp: expect.any(String),
			});
		});

		it('should include details in response', () => {
			const details = { field: 'email' };
			const error = AppError.validation(ErrorCodes.VALIDATION_ERROR, details);
			const httpException = error.toHttpException();
			
			expect(httpException.getResponse()).toEqual({
				code: ErrorCodes.VALIDATION_ERROR,
				message: ErrorCodes.VALIDATION_ERROR,
				statusCode: 400,
				timestamp: expect.any(String),
				details,
			});
		});
	});

	describe('toGrpcException', () => {
		it('should convert to RpcException', () => {
			const error = AppError.notFound(ErrorCodes.USER_NOT_FOUND);
			const grpcException = error.toGrpcException();
			
			expect(grpcException.getError()).toEqual({
				code: 5, // NOT_FOUND
				message: ErrorCodes.USER_NOT_FOUND,
				details: ErrorCodes.USER_NOT_FOUND,
			});
		});

		it('should include details in gRPC error', () => {
			const details = { userId: '123' };
			const error = AppError.notFound(ErrorCodes.USER_NOT_FOUND, details);
			const grpcException = error.toGrpcException();
			
			expect(grpcException.getError()).toEqual({
				code: 5, // NOT_FOUND
				message: ErrorCodes.USER_NOT_FOUND,
				details: JSON.stringify({ ...details, message: ErrorCodes.USER_NOT_FOUND }),
			});
		});
	});

	describe('toWsException', () => {
		it('should convert to WsException', () => {
			const error = AppError.authentication(ErrorCodes.UNAUTHORIZED);
			const wsException = error.toWsException();
			
			expect(wsException.getError()).toEqual({
				code: ErrorCodes.UNAUTHORIZED,
				message: ErrorCodes.UNAUTHORIZED,
				statusCode: 401,
			});
		});

		it('should include details in WebSocket error', () => {
			const details = { token: 'expired' };
			const error = AppError.authentication(ErrorCodes.TOKEN_EXPIRED, details);
			const wsException = error.toWsException();
			
			expect(wsException.getError()).toEqual({
				code: ErrorCodes.TOKEN_EXPIRED,
				message: ErrorCodes.TOKEN_EXPIRED,
				statusCode: 401,
				details,
			});
		});
	});
}); 