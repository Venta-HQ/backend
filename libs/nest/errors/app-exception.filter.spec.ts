import { vi } from 'vitest';
import { ArgumentsHost, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { WsException } from '@nestjs/websockets';
import { AppError, ErrorType } from './app-error';
import { AppExceptionFilter } from './app-exception.filter';

describe('AppExceptionFilter', () => {
	let filter: AppExceptionFilter;
	let mockConfigService: any;

	beforeEach(() => {
		mockConfigService = {
			get: vi.fn().mockReturnValue('test-domain'),
		};
		filter = new AppExceptionFilter(mockConfigService);
	});

	describe('catch', () => {
		it('should handle AppError for HTTP context', () => {
			const error = new AppError(ErrorType.VALIDATION, 'TEST_ERROR', 'Test error message');
			const mockResponse = {
				status: vi.fn().mockReturnThis(),
				json: vi.fn().mockReturnThis(),
			};
			const mockRequest = {
				url: '/test',
				headers: {
					'x-request-id': 'test-request-id',
				},
			};
			const mockContext = {
				getType: vi.fn().mockReturnValue('http'),
				switchToHttp: vi.fn().mockReturnValue({
					getResponse: vi.fn().mockReturnValue(mockResponse),
					getRequest: vi.fn().mockReturnValue(mockRequest),
				}),
			} as ArgumentsHost;

			filter.catch(error, mockContext);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: {
					code: 'TEST_ERROR',
					details: undefined,
					message: 'Test error message',
					path: '/test',
					requestId: 'test-request-id',
					timestamp: expect.any(String),
					type: 'VALIDATION',
				},
			});
		});

		it('should handle AppError for gRPC context', () => {
			const error = new AppError(ErrorType.NOT_FOUND, 'TEST_ERROR', 'Test error message');
			const mockContext = {
				getType: vi.fn().mockReturnValue('rpc'),
				switchToRpc: vi.fn().mockReturnValue({
					getContext: vi.fn().mockReturnValue({}),
					getData: vi.fn().mockReturnValue({}),
				}),
			} as ArgumentsHost;

			expect(() => filter.catch(error, mockContext)).toThrow();
		});

		it('should handle AppError for WebSocket context', () => {
			const error = new AppError(ErrorType.INTERNAL, 'TEST_ERROR', 'Test error message');
			const mockClient = {
				emit: vi.fn(),
			};
			const mockContext = {
				getType: vi.fn().mockReturnValue('ws'),
				switchToWs: vi.fn().mockReturnValue({
					getClient: vi.fn().mockReturnValue(mockClient),
					getData: vi.fn().mockReturnValue({}),
				}),
			} as ArgumentsHost;

			filter.catch(error, mockContext);

			expect(mockClient.emit).toHaveBeenCalledWith('error', {
				code: 'TEST_ERROR',
				details: undefined,
				message: 'Test error message',
				path: undefined,
				requestId: undefined,
				timestamp: expect.any(String),
				type: 'INTERNAL',
			});
		});

		it('should convert HttpException to AppError', () => {
			const httpError = new HttpException('HTTP Error', 400);
			const mockResponse = {
				status: vi.fn().mockReturnThis(),
				json: vi.fn().mockReturnThis(),
			};
			const mockRequest = {
				url: '/test',
				headers: {
					'x-request-id': 'test-request-id',
				},
			};
			const mockContext = {
				getType: vi.fn().mockReturnValue('http'),
				switchToHttp: vi.fn().mockReturnValue({
					getResponse: vi.fn().mockReturnValue(mockResponse),
					getRequest: vi.fn().mockReturnValue(mockRequest),
				}),
			} as ArgumentsHost;

			filter.catch(httpError, mockContext);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: {
					code: 'VALIDATION_ERROR',
					details: {
						originalError: 'HTTP Error',
						statusCode: 400,
					},
					message: 'HTTP Error',
					path: '/test',
					requestId: 'test-request-id',
					timestamp: expect.any(String),
					type: 'VALIDATION',
				},
			});
		});

		it('should convert RpcException to AppError', () => {
			const rpcError = new RpcException('gRPC error');
			const mockContext = {
				getType: vi.fn().mockReturnValue('rpc'),
				switchToRpc: vi.fn().mockReturnValue({
					getContext: vi.fn().mockReturnValue({}),
					getData: vi.fn().mockReturnValue({}),
				}),
			} as ArgumentsHost;

			expect(() => filter.catch(rpcError, mockContext)).toThrow();
		});

		it('should convert WsException to AppError', () => {
			const wsError = new WsException('WebSocket Error');
			const mockClient = {
				emit: vi.fn(),
			};
			const mockContext = {
				getType: vi.fn().mockReturnValue('ws'),
				switchToWs: vi.fn().mockReturnValue({
					getClient: vi.fn().mockReturnValue(mockClient),
					getData: vi.fn().mockReturnValue({}),
				}),
			} as ArgumentsHost;

			filter.catch(wsError, mockContext);

			expect(mockClient.emit).toHaveBeenCalledWith('error', {
				code: 'UNKNOWN_ERROR',
				details: {
					originalError: 'WebSocket Error',
				},
				message: 'WebSocket error',
				path: undefined,
				requestId: undefined,
				timestamp: expect.any(String),
				type: 'INTERNAL',
			});
		});

		it('should handle unknown errors', () => {
			const unknownError = new Error('Unknown error');
			const mockResponse = {
				status: vi.fn().mockReturnThis(),
				json: vi.fn().mockReturnThis(),
			};
			const mockRequest = {
				url: '/test',
				headers: {
					'x-request-id': 'test-request-id',
				},
			};
			const mockContext = {
				getType: vi.fn().mockReturnValue('http'),
				switchToHttp: vi.fn().mockReturnValue({
					getResponse: vi.fn().mockReturnValue(mockResponse),
					getRequest: vi.fn().mockReturnValue(mockRequest),
				}),
			} as ArgumentsHost;

			filter.catch(unknownError, mockContext);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: {
					code: 'UNKNOWN_ERROR',
					details: {
						stack: expect.any(String),
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
			const mockResponse = {
				status: vi.fn().mockReturnThis(),
				json: vi.fn().mockReturnThis(),
			};
			const mockRequest = {
				url: '/test',
				headers: {
					'x-request-id': 'test-request-id',
				},
			};
			const mockContext = {
				getType: vi.fn().mockReturnValue('http'),
				switchToHttp: vi.fn().mockReturnValue({
					getResponse: vi.fn().mockReturnValue(mockResponse),
					getRequest: vi.fn().mockReturnValue(mockRequest),
				}),
			} as ArgumentsHost;

			filter.catch(nonError, mockContext);

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
			const error = new AppError(ErrorType.VALIDATION, 'TEST_ERROR', 'Test error message', {
				field: 'test',
				value: 'invalid',
			});
			const mockResponse = {
				status: vi.fn().mockReturnThis(),
				json: vi.fn().mockReturnThis(),
			};
			const mockRequest = {
				url: '/test',
				headers: {
					'x-request-id': 'test-request-id',
				},
			};
			const mockContext = {
				getType: vi.fn().mockReturnValue('http'),
				switchToHttp: vi.fn().mockReturnValue({
					getResponse: vi.fn().mockReturnValue(mockResponse),
					getRequest: vi.fn().mockReturnValue(mockRequest),
				}),
			} as ArgumentsHost;

			filter.catch(error, mockContext);

			expect(mockResponse.json).toHaveBeenCalledWith({
				error: {
					code: 'TEST_ERROR',
					details: {
						field: 'test',
						value: 'invalid',
					},
					message: 'Test error message',
					path: '/test',
					requestId: 'test-request-id',
					timestamp: expect.any(String),
					type: 'VALIDATION',
				},
			});
		});
	});
});
