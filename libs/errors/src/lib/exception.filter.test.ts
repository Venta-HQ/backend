import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArgumentsHost, BadRequestException, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { WsException } from '@nestjs/websockets';
import { AppError, ErrorType } from './error';
import { AppExceptionFilter } from './exception.filter';

// Mock Express Response
const mockResponse = {
	json: vi.fn().mockReturnThis(),
	status: vi.fn().mockReturnThis(),
};

// Mock Express Request
const mockRequest = {
	headers: {
		'x-request-id': 'req_123',
	},
	url: '/api/test',
};

// Mock WebSocket Client
const mockWsClient = {
	emit: vi.fn(),
};

// Mock gRPC Context
const mockGrpcContext = {
	get: vi.fn().mockReturnValue(['req_456']),
};

describe('AppExceptionFilter', () => {
	let filter: AppExceptionFilter;
	let mockHost: ArgumentsHost;

	beforeEach(() => {
		filter = new AppExceptionFilter();
		vi.clearAllMocks();
	});

	describe('HTTP Exception Handling', () => {
		beforeEach(() => {
			mockHost = {
				getType: vi.fn().mockReturnValue('http'),
				switchToHttp: vi.fn().mockReturnValue({
					getRequest: vi.fn().mockReturnValue(mockRequest),
					getResponse: vi.fn().mockReturnValue(mockResponse),
				}),
				switchToRpc: vi.fn(),
				switchToWs: vi.fn(),
			} as any;
		});

		it('should handle AppError correctly', () => {
			const appError = new AppError(ErrorType.VALIDATION, 'VALIDATION_ERROR', 'Validation failed', { field: 'email' });

			filter.catch(appError, mockHost);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: {
					code: 'VALIDATION_ERROR',
					details: { field: 'email' },
					message: 'Validation failed',
					path: '/api/test',
					requestId: 'req_123',
					timestamp: expect.any(String),
					type: ErrorType.VALIDATION,
				},
			});
		});

		it('should convert HttpException to AppError', () => {
			const httpException = new BadRequestException('Bad request');

			filter.catch(httpException, mockHost);

			expect(mockResponse.status).toHaveBeenCalledWith(500); // Internal error
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: {
					code: 'UNKNOWN_ERROR',
					details: {
						originalError: expect.any(Object),
						statusCode: 400,
					},
					message: 'Bad request',
					path: '/api/test',
					requestId: 'req_123',
					timestamp: expect.any(String),
					type: ErrorType.INTERNAL,
				},
			});
		});

		it('should handle unknown errors', () => {
			const unknownError = new Error('Unknown error');

			filter.catch(unknownError, mockHost);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: {
					code: 'UNKNOWN_ERROR',
					details: {
						stack: expect.any(String),
					},
					message: 'Unknown error',
					path: '/api/test',
					requestId: 'req_123',
					timestamp: expect.any(String),
					type: ErrorType.INTERNAL,
				},
			});
		});

		it('should handle non-Error objects', () => {
			const nonError = 'String error';

			filter.catch(nonError, mockHost);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: {
					code: 'UNKNOWN_ERROR',
					details: {
						originalError: 'String error',
					},
					message: 'An unknown error occurred',
					path: '/api/test',
					requestId: 'req_123',
					timestamp: expect.any(String),
					type: ErrorType.INTERNAL,
				},
			});
		});
	});

	describe('gRPC Exception Handling', () => {
		beforeEach(() => {
			mockHost = {
				getType: vi.fn().mockReturnValue('rpc'),
				switchToHttp: vi.fn(),
				switchToRpc: vi.fn().mockReturnValue({
					getContext: vi.fn().mockReturnValue(mockGrpcContext),
				}),
				switchToWs: vi.fn(),
			} as any;
		});

		it('should handle AppError in gRPC context', () => {
			const appError = new AppError(ErrorType.NOT_FOUND, 'RESOURCE_NOT_FOUND', 'Resource not found');

			expect(() => filter.catch(appError, mockHost)).toThrow(RpcException);
		});

		it('should convert RpcException to AppError', () => {
			const grpcError = {
				code: 5, // NOT_FOUND
				details: 'gRPC error details',
				message: 'gRPC error message',
			};
			const rpcException = new RpcException(grpcError);

			expect(() => filter.catch(rpcException, mockHost)).toThrow(RpcException);
		});

		it('should add request ID from gRPC context', () => {
			const appError = new AppError(ErrorType.INTERNAL, 'INTERNAL_SERVER_ERROR', 'Internal error');

			expect(() => filter.catch(appError, mockHost)).toThrow(RpcException);
			expect(mockGrpcContext.get).toHaveBeenCalledWith('request-id');
		});
	});

	describe('WebSocket Exception Handling', () => {
		beforeEach(() => {
			mockHost = {
				getType: vi.fn().mockReturnValue('ws'),
				switchToHttp: vi.fn(),
				switchToRpc: vi.fn(),
				switchToWs: vi.fn().mockReturnValue({
					getClient: vi.fn().mockReturnValue(mockWsClient),
					getData: vi.fn().mockReturnValue({ requestId: 'req_789' }),
				}),
			} as any;
		});

		it('should handle AppError in WebSocket context', () => {
			const appError = new AppError(ErrorType.VALIDATION, 'VALIDATION_ERROR', 'Validation failed');

			filter.catch(appError, mockHost);

			expect(mockWsClient.emit).toHaveBeenCalledWith('error', {
				code: 'VALIDATION_ERROR',
				details: undefined,
				message: 'Validation failed',
				path: undefined,
				requestId: 'req_789',
				timestamp: expect.any(String),
				type: ErrorType.VALIDATION,
			});
		});

		it('should convert WsException to AppError', () => {
			const wsError = {
				code: 'WS_ERROR',
				message: 'WebSocket error',
			};
			const wsException = new WsException(wsError);

			filter.catch(wsException, mockHost);

			expect(mockWsClient.emit).toHaveBeenCalledWith('error', {
				code: 'UNKNOWN_ERROR',
				details: {
					originalError: wsError,
				},
				message: 'WebSocket error',
				path: undefined,
				requestId: 'req_789',
				timestamp: expect.any(String),
				type: ErrorType.INTERNAL,
			});
		});

		it('should handle WebSocket data without requestId', () => {
			mockHost.switchToWs = vi.fn().mockReturnValue({
				getClient: vi.fn().mockReturnValue(mockWsClient),
				getData: vi.fn().mockReturnValue({}),
			});

			const appError = new AppError(ErrorType.INTERNAL, 'INTERNAL_SERVER_ERROR', 'Internal error');

			filter.catch(appError, mockHost);

			expect(mockWsClient.emit).toHaveBeenCalledWith('error', {
				code: 'INTERNAL_SERVER_ERROR',
				details: undefined,
				message: 'Internal error',
				path: undefined,
				requestId: undefined,
				timestamp: expect.any(String),
				type: ErrorType.INTERNAL,
			});
		});
	});

	describe('Unknown Context Type', () => {
		beforeEach(() => {
			mockHost = {
				getType: vi.fn().mockReturnValue('unknown'),
				switchToHttp: vi.fn(),
				switchToRpc: vi.fn(),
				switchToWs: vi.fn(),
			} as any;
		});

		it('should throw AppError for unknown context type', () => {
			const appError = new AppError(ErrorType.INTERNAL, 'INTERNAL_SERVER_ERROR', 'Internal error');

			expect(() => filter.catch(appError, mockHost)).toThrow(AppError);
		});
	});

	describe('Error Conversion', () => {
		beforeEach(() => {
			mockHost = {
				getType: vi.fn().mockReturnValue('http'),
				switchToHttp: vi.fn().mockReturnValue({
					getRequest: vi.fn().mockReturnValue(mockRequest),
					getResponse: vi.fn().mockReturnValue(mockResponse),
				}),
				switchToRpc: vi.fn(),
				switchToWs: vi.fn(),
			} as any;
		});

		it('should preserve AppError without modification', () => {
			const originalError = new AppError(
				ErrorType.VALIDATION,
				'VALIDATION_ERROR',
				'Original message',
				{ field: 'test' },
				'/api/original',
				'req_original',
			);

			filter.catch(originalError, mockHost);

			// Should preserve original properties but update path and requestId from context
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: {
					code: 'VALIDATION_ERROR',
					details: { field: 'test' },
					message: 'Original message',
					path: '/api/test', // Updated from context
					requestId: 'req_123', // Updated from context
					timestamp: expect.any(String),
					type: ErrorType.VALIDATION,
				},
			});
		});

		it('should handle HttpException with complex response', () => {
			const complexResponse = {
				error: 'Bad Request',
				message: 'Validation failed',
				statusCode: 400,
			};
			const httpException = new HttpException(complexResponse, 400);

			filter.catch(httpException, mockHost);

			expect(mockResponse.json).toHaveBeenCalledWith({
				error: {
					code: 'UNKNOWN_ERROR',
					details: {
						originalError: complexResponse,
						statusCode: 400,
					},
					message: 'Validation failed',
					path: '/api/test',
					requestId: 'req_123',
					timestamp: expect.any(String),
					type: ErrorType.INTERNAL,
				},
			});
		});

		it('should handle HttpException with string response', () => {
			const httpException = new HttpException('Simple error message', 500);

			filter.catch(httpException, mockHost);

			expect(mockResponse.json).toHaveBeenCalledWith({
				error: {
					code: 'UNKNOWN_ERROR',
					details: {
						originalError: 'Simple error message',
						statusCode: 500,
					},
					message: 'Simple error message',
					path: '/api/test',
					requestId: 'req_123',
					timestamp: expect.any(String),
					type: ErrorType.INTERNAL,
				},
			});
		});
	});
});
