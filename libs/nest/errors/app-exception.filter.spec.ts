import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArgumentsHost } from '@nestjs/common';
import { AppExceptionFilter } from './app-exception.filter';
import { AppError } from './app-error';
import { ErrorCodes } from './errorcodes';

describe('AppExceptionFilter', () => {
	let filter: AppExceptionFilter;
	let mockHost: ArgumentsHost;
	let mockResponse: any;
	let mockRequest: any;

	beforeEach(() => {
		filter = new AppExceptionFilter();
		
		mockResponse = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		};
		
		mockRequest = {
			url: '/test',
			headers: { 'x-request-id': 'test-request-id' },
		};
		
		mockHost = {
			getType: vi.fn().mockReturnValue('http'),
			switchToHttp: vi.fn().mockReturnValue({
				getResponse: vi.fn().mockReturnValue(mockResponse),
				getRequest: vi.fn().mockReturnValue(mockRequest),
			}),
			switchToRpc: vi.fn().mockReturnValue({
				getContext: vi.fn().mockReturnValue({
					error: vi.fn(),
				}),
			}),
		} as any;
	});

	describe('catch', () => {
		it('should handle AppError for HTTP context', () => {
			const error = AppError.notFound(ErrorCodes.USER_NOT_FOUND);
			
			filter.catch(error, mockHost);
			
			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(mockResponse.json).toHaveBeenCalledWith({
				code: ErrorCodes.USER_NOT_FOUND,
				message: ErrorCodes.USER_NOT_FOUND,
				statusCode: 404,
				timestamp: expect.any(String),
				path: '/test',
				requestId: 'test-request-id',
			});
		});

		it('should handle AppError for gRPC context', () => {
			mockHost.getType = vi.fn().mockReturnValue('rpc');
			const error = AppError.notFound(ErrorCodes.USER_NOT_FOUND);
			
			filter.catch(error, mockHost);
			
			expect(mockHost.switchToRpc).toHaveBeenCalled();
		});

		it('should handle AppError for WebSocket context', () => {
			mockHost.getType = vi.fn().mockReturnValue('ws');
			const error = AppError.authentication(ErrorCodes.UNAUTHORIZED);
			
			expect(() => filter.catch(error, mockHost)).toThrow();
		});

		it('should convert HttpException to AppError', () => {
			const httpException = new Error('HTTP Error') as any;
			httpException.getStatus = vi.fn().mockReturnValue(400);
			httpException.getResponse = vi.fn().mockReturnValue({ message: 'Bad Request' });
			
			filter.catch(httpException, mockHost);
			
			expect(mockResponse.status).toHaveBeenCalledWith(400);
		});

		it('should convert RpcException to AppError', () => {
			mockHost.getType = vi.fn().mockReturnValue('rpc');
			const rpcException = new Error('gRPC Error') as any;
			rpcException.getError = vi.fn().mockReturnValue({ message: 'gRPC Error' });
			
			filter.catch(rpcException, mockHost);
			
			expect(mockHost.switchToRpc).toHaveBeenCalled();
		});

		it('should convert WsException to AppError', () => {
			mockHost.getType = vi.fn().mockReturnValue('ws');
			const wsException = new Error('WebSocket Error') as any;
			wsException.getError = vi.fn().mockReturnValue({ message: 'WebSocket Error' });
			
			expect(() => filter.catch(wsException, mockHost)).toThrow();
		});

		it('should handle unknown errors', () => {
			const unknownError = new Error('Unknown error');
			
			filter.catch(unknownError, mockHost);
			
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Unknown error',
				statusCode: 500,
				timestamp: expect.any(String),
				path: '/test',
				requestId: 'test-request-id',
			});
		});

		it('should handle non-Error objects', () => {
			const nonError = 'String error';
			
			filter.catch(nonError, mockHost);
			
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'An unknown error occurred',
				statusCode: 500,
				timestamp: expect.any(String),
				path: '/test',
				requestId: 'test-request-id',
			});
		});

		it('should include error details in response', () => {
			const details = { field: 'email' };
			const error = AppError.validation(ErrorCodes.VALIDATION_ERROR, details);
			
			filter.catch(error, mockHost);
			
			expect(mockResponse.json).toHaveBeenCalledWith({
				code: ErrorCodes.VALIDATION_ERROR,
				message: ErrorCodes.VALIDATION_ERROR,
				statusCode: 400,
				timestamp: expect.any(String),
				path: '/test',
				requestId: 'test-request-id',
				details,
			});
		});
	});
}); 