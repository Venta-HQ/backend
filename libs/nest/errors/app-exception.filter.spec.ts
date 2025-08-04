import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { WsException } from '@nestjs/websockets';
import { AppExceptionFilter } from './app-exception.filter';
import { AppError, ErrorType } from './app-error';

describe('AppExceptionFilter', () => {
	let filter: AppExceptionFilter;
	let mockResponse: any;
	let mockRequest: any;

	beforeEach(() => {
		filter = new AppExceptionFilter();
		mockResponse = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn().mockReturnThis(),
		};
		mockRequest = {
			url: '/test',
			method: 'GET',
			headers: {
				'x-request-id': 'test-request-id',
			},
		};
	});

	describe('catch', () => {
		it('should handle AppError for HTTP context', () => {
			const appError = new AppError(ErrorType.NOT_FOUND, 'USER_NOT_FOUND', 'User not found');
			const exception = appError.toHttpException();
			const mockContext = {
				getType: vi.fn().mockReturnValue('http'),
				switchToHttp: () => ({
					getResponse: () => mockResponse,
					getRequest: () => mockRequest,
				}),
			};

			filter.catch(exception, mockContext as any);

			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: {
					code: 'USER_NOT_FOUND',
					details: undefined,
					message: 'User not found',
					path: '/test',
					requestId: 'test-request-id',
					timestamp: appError.timestamp,
					type: 'NOT_FOUND',
				},
			});
		});

		it('should handle AppError for gRPC context', () => {
			const appError = new AppError(ErrorType.NOT_FOUND, 'USER_NOT_FOUND', 'User not found');
			const exception = appError.toGrpcException();
			const mockContext = {
				getType: vi.fn().mockReturnValue('rpc'),
				switchToRpc: () => ({
					getData: () => ({}),
					getContext: () => ({}),
				}),
			};

			// Mock the handleGrpcException method to avoid actual error throwing
			const handleGrpcSpy = vi.spyOn(filter as any, 'handleGrpcException').mockImplementation(() => {
				return {
					code: 5,
					details: JSON.stringify({
						code: 'USER_NOT_FOUND',
						details: undefined,
						path: undefined,
						requestId: undefined,
						timestamp: appError.timestamp,
						type: 'NOT_FOUND',
					}),
					message: 'User not found',
				};
			});

			const result = filter.catch(exception, mockContext as any);

			// The filter converts the exception to AppError before calling handleGrpcException
			expect(handleGrpcSpy).toHaveBeenCalledWith(expect.any(AppError), mockContext);
			expect(result).toBeDefined();
		});

		it('should handle AppError for WebSocket context', () => {
			const appError = new AppError(ErrorType.NOT_FOUND, 'USER_NOT_FOUND', 'User not found');
			const exception = appError.toWsException();
			const mockContext = {
				getType: vi.fn().mockReturnValue('ws'),
				switchToWs: () => ({
					getData: () => ({}),
					getClient: () => ({
						send: vi.fn(),
					}),
				}),
			};

			// Mock the handleWsException method
			const handleWsSpy = vi.spyOn(filter as any, 'handleWsException').mockImplementation(() => {
				return {
					code: 'USER_NOT_FOUND',
					details: undefined,
					message: 'User not found',
					path: undefined,
					requestId: undefined,
					timestamp: appError.timestamp,
					type: 'NOT_FOUND',
				};
			});

			const result = filter.catch(exception, mockContext as any);

			// The filter converts the exception to AppError before calling handleWsException
			expect(handleWsSpy).toHaveBeenCalledWith(expect.any(AppError), mockContext);
			expect(result).toBeDefined();
		});

		it('should convert HttpException to AppError', () => {
			const httpException = new HttpException('Bad Request', 400);
			const mockContext = {
				getType: vi.fn().mockReturnValue('http'),
				switchToHttp: () => ({
					getResponse: () => mockResponse,
					getRequest: () => mockRequest,
				}),
			};

			filter.catch(httpException, mockContext as any);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: {
					code: 'VALIDATION_ERROR',
					details: {
						originalError: 'Bad Request',
						statusCode: 400,
					},
					message: 'Bad Request',
					path: '/test',
					requestId: 'test-request-id',
					timestamp: expect.any(String),
					type: 'VALIDATION',
				},
			});
		});

		it('should convert RpcException to AppError', () => {
			const rpcException = new RpcException({
				code: 5,
				details: 'User not found',
				message: 'gRPC Error',
			});
			const mockContext = {
				getType: vi.fn().mockReturnValue('rpc'),
				switchToRpc: () => ({
					getData: () => ({}),
					getContext: () => ({}),
				}),
			};

			// Mock the handleGrpcException method
			const handleGrpcSpy = vi.spyOn(filter as any, 'handleGrpcException').mockImplementation(() => {
				return {
					code: 5,
					details: 'User not found',
					message: 'gRPC Error',
				};
			});

			const result = filter.catch(rpcException, mockContext as any);

			// The filter converts the exception to AppError before calling handleGrpcException
			expect(handleGrpcSpy).toHaveBeenCalledWith(expect.any(AppError), mockContext);
			expect(result).toBeDefined();
		});

		it('should convert WsException to AppError', () => {
			const wsException = new WsException('WebSocket error');
			const mockContext = {
				getType: vi.fn().mockReturnValue('ws'),
				switchToWs: () => ({
					getData: () => ({}),
					getClient: () => ({
						send: vi.fn(),
					}),
				}),
			};

			// Mock the handleWsException method
			const handleWsSpy = vi.spyOn(filter as any, 'handleWsException').mockImplementation(() => {
				return {
					code: 'INTERNAL_ERROR',
					details: undefined,
					message: 'Internal server error',
					path: undefined,
					requestId: undefined,
					timestamp: expect.any(String),
					type: 'INTERNAL',
				};
			});

			const result = filter.catch(wsException, mockContext as any);

			// The filter converts the exception to AppError before calling handleWsException
			expect(handleWsSpy).toHaveBeenCalledWith(expect.any(AppError), mockContext);
			expect(result).toBeDefined();
		});

		it('should handle unknown errors', () => {
			const unknownError = new Error('Unknown error');
			const mockContext = {
				getType: vi.fn().mockReturnValue('http'),
				switchToHttp: () => ({
					getResponse: () => mockResponse,
					getRequest: () => mockRequest,
				}),
			};

			filter.catch(unknownError, mockContext as any);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: {
					code: 'UNKNOWN_ERROR',
					details: {
						stack: expect.stringContaining('Error: Unknown error'),
					},
					message: 'Unknown error',
					path: '/test',
					requestId: 'test-request-id',
					timestamp: expect.any(String),
					type: 'INTERNAL',
				},
			});
		});

		it('should handle non-Error objects', () => {
			const nonError = 'String error';
			const mockContext = {
				getType: vi.fn().mockReturnValue('http'),
				switchToHttp: () => ({
					getResponse: () => mockResponse,
					getRequest: () => mockRequest,
				}),
			};

			filter.catch(nonError, mockContext as any);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: {
					code: 'UNKNOWN_ERROR',
					details: {
						originalError: 'String error',
					},
					message: 'An unknown error occurred',
					path: '/test',
					requestId: 'test-request-id',
					timestamp: expect.any(String),
					type: 'INTERNAL',
				},
			});
		});

		it('should include error details in response', () => {
			const details = { userId: '123' };
			const appError = new AppError(ErrorType.NOT_FOUND, 'USER_NOT_FOUND', 'User not found', details);
			const exception = appError.toHttpException();
			const mockContext = {
				getType: vi.fn().mockReturnValue('http'),
				switchToHttp: () => ({
					getResponse: () => mockResponse,
					getRequest: () => mockRequest,
				}),
			};

			filter.catch(exception, mockContext as any);

			expect(mockResponse.json).toHaveBeenCalledWith({
				error: {
					code: 'USER_NOT_FOUND',
					details,
					message: 'User not found',
					path: '/test',
					requestId: 'test-request-id',
					timestamp: appError.timestamp,
					type: 'NOT_FOUND',
				},
			});
		});
	});
}); 