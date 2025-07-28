import { Observable, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { GrpcRequestIdInterceptor } from './grpc-logger.interceptor';
import { RequestContextService } from './request-context.service';

describe('GrpcRequestIdInterceptor', () => {
	let interceptor: GrpcRequestIdInterceptor;
	let mockRequestContextService: vi.Mocked<RequestContextService>;
	let mockExecutionContext: vi.Mocked<ExecutionContext>;
	let mockCallHandler: vi.Mocked<CallHandler>;

	beforeEach(() => {
		vi.clearAllMocks();

		mockRequestContextService = {
			get: vi.fn(),
			run: vi.fn(),
			set: vi.fn(),
		} as any;

		mockExecutionContext = {
			switchToRpc: vi.fn(),
		} as any;

		mockCallHandler = {
			handle: vi.fn(),
		} as any;

		interceptor = new GrpcRequestIdInterceptor(mockRequestContextService);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('constructor', () => {
		it('should create interceptor with RequestContextService', () => {
			expect(interceptor).toBeDefined();
		});
	});

	describe('intercept method', () => {
		it('should extract request ID from gRPC metadata', async () => {
			const requestId = 'test-request-id';
			const mockMetadata = {
				get: vi.fn().mockReturnValue([requestId]),
			};
			const mockGrpcContext = {
				getContext: vi.fn().mockReturnValue(mockMetadata),
			};

			mockExecutionContext.switchToRpc.mockReturnValue(mockGrpcContext);
			mockCallHandler.handle.mockReturnValue(of('success'));
			mockRequestContextService.run.mockImplementation((callback) => {
				callback();
				return 'success';
			});

			const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

			// Wait for the observable to complete
			await new Promise((resolve) => {
				result.subscribe({
					complete: resolve,
					next: () => {},
				});
			});

			expect(mockExecutionContext.switchToRpc).toHaveBeenCalled();
			expect(mockGrpcContext.getContext).toHaveBeenCalled();
			expect(mockMetadata.get).toHaveBeenCalledWith('requestid');
			expect(mockRequestContextService.run).toHaveBeenCalled();
			expect(mockRequestContextService.set).toHaveBeenCalledWith('requestId', requestId);
		});

		it('should handle missing request ID in metadata', async () => {
			const mockMetadata = {
				get: vi.fn().mockReturnValue([]),
			};
			const mockGrpcContext = {
				getContext: vi.fn().mockReturnValue(mockMetadata),
			};

			mockExecutionContext.switchToRpc.mockReturnValue(mockGrpcContext);
			mockCallHandler.handle.mockReturnValue(of('success'));
			mockRequestContextService.run.mockImplementation((callback) => {
				callback();
				return 'success';
			});

			const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

			// Wait for the observable to complete
			await new Promise((resolve) => {
				result.subscribe({
					complete: resolve,
					next: () => {},
				});
			});

			expect(mockRequestContextService.set).toHaveBeenCalledWith('requestId', 'no-request-id');
		});

		it('should handle undefined request ID in metadata', async () => {
			const mockMetadata = {
				get: vi.fn().mockReturnValue(undefined),
			};
			const mockGrpcContext = {
				getContext: vi.fn().mockReturnValue(mockMetadata),
			};

			mockExecutionContext.switchToRpc.mockReturnValue(mockGrpcContext);
			mockCallHandler.handle.mockReturnValue(of('success'));
			mockRequestContextService.run.mockImplementation((callback) => {
				callback();
				return 'success';
			});

			const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

			// Wait for the observable to complete
			await new Promise<void>((resolve) => {
				result.subscribe({
					complete: () => resolve(),
					error: () => resolve(),
					next: () => {},
				});
			});

			expect(mockRequestContextService.set).toHaveBeenCalledWith('requestId', 'no-request-id');
		});

		it('should handle successful response', () => {
			const requestId = 'success-request-id';
			const responseData = { message: 'success' };
			const mockMetadata = {
				get: vi.fn().mockReturnValue([requestId]),
			};
			const mockGrpcContext = {
				getContext: vi.fn().mockReturnValue(mockMetadata),
			};

			mockExecutionContext.switchToRpc.mockReturnValue(mockGrpcContext);
			mockCallHandler.handle.mockReturnValue(of(responseData));
			mockRequestContextService.run.mockImplementation((callback) => {
				callback();
				return responseData;
			});

			const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

			expect(result).toBeInstanceOf(Observable);
		});

		it('should handle error response', () => {
			const requestId = 'error-request-id';
			const error = new Error('Test error');
			const mockMetadata = {
				get: vi.fn().mockReturnValue([requestId]),
			};
			const mockGrpcContext = {
				getContext: vi.fn().mockReturnValue(mockMetadata),
			};

			mockExecutionContext.switchToRpc.mockReturnValue(mockGrpcContext);
			mockCallHandler.handle.mockReturnValue(throwError(() => error));
			mockRequestContextService.run.mockImplementation((callback) => {
				callback();
				throw error;
			});

			const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

			expect(result).toBeInstanceOf(Observable);
		});

		it('should wrap error in RpcException', () => {
			const requestId = 'rpc-error-request-id';
			const error = new Error('RPC error');
			const mockMetadata = {
				get: vi.fn().mockReturnValue([requestId]),
			};
			const mockGrpcContext = {
				getContext: vi.fn().mockReturnValue(mockMetadata),
			};

			mockExecutionContext.switchToRpc.mockReturnValue(mockGrpcContext);
			mockCallHandler.handle.mockReturnValue(throwError(() => error));
			mockRequestContextService.run.mockImplementation((callback) => {
				callback();
				throw error;
			});

			const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

			expect(result).toBeInstanceOf(Observable);
		});

		it('should handle empty metadata', async () => {
			const mockMetadata = {
				get: vi.fn().mockReturnValue(undefined),
			};
			const mockGrpcContext = {
				getContext: vi.fn().mockReturnValue(mockMetadata),
			};

			mockExecutionContext.switchToRpc.mockReturnValue(mockGrpcContext);
			mockCallHandler.handle.mockReturnValue(of('success'));
			mockRequestContextService.run.mockImplementation((callback) => {
				callback();
				return 'success';
			});

			const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

			// Wait for the observable to complete
			await new Promise<void>((resolve) => {
				result.subscribe({
					complete: () => resolve(),
					error: () => resolve(),
					next: () => {},
				});
			});

			expect(mockRequestContextService.set).toHaveBeenCalledWith('requestId', 'no-request-id');
		});

		it('should handle multiple request IDs in metadata', async () => {
			const requestIds = ['id1', 'id2', 'id3'];
			const mockMetadata = {
				get: vi.fn().mockReturnValue(requestIds),
			};
			const mockGrpcContext = {
				getContext: vi.fn().mockReturnValue(mockMetadata),
			};

			mockExecutionContext.switchToRpc.mockReturnValue(mockGrpcContext);
			mockCallHandler.handle.mockReturnValue(of('success'));
			mockRequestContextService.run.mockImplementation((callback) => {
				callback();
				return 'success';
			});

			const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

			// Wait for the observable to complete
			await new Promise((resolve) => {
				result.subscribe({
					complete: resolve,
					next: () => {},
				});
			});

			expect(mockRequestContextService.set).toHaveBeenCalledWith('requestId', 'id1');
		});
	});

	describe('context management', () => {
		it('should run handler within request context', async () => {
			const requestId = 'context-request-id';
			const mockMetadata = {
				get: vi.fn().mockReturnValue([requestId]),
			};
			const mockGrpcContext = {
				getContext: vi.fn().mockReturnValue(mockMetadata),
			};

			mockExecutionContext.switchToRpc.mockReturnValue(mockGrpcContext);
			mockCallHandler.handle.mockReturnValue(of('success'));

			let contextCallback: Function;
			mockRequestContextService.run.mockImplementation((callback) => {
				contextCallback = callback;
				callback();
				return 'success';
			});

			const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

			// Wait for the observable to complete
			await new Promise((resolve) => {
				result.subscribe({
					complete: resolve,
					next: () => {},
				});
			});

			expect(mockRequestContextService.run).toHaveBeenCalled();
			expect(contextCallback).toBeDefined();
		});

		it('should set request ID before calling handler', async () => {
			const requestId = 'before-handler-request-id';
			const mockMetadata = {
				get: vi.fn().mockReturnValue([requestId]),
			};
			const mockGrpcContext = {
				getContext: vi.fn().mockReturnValue(mockMetadata),
			};

			mockExecutionContext.switchToRpc.mockReturnValue(mockGrpcContext);
			mockCallHandler.handle.mockReturnValue(of('success'));

			let setCalled = false;
			mockRequestContextService.run.mockImplementation((callback) => {
				mockRequestContextService.set.mockImplementation(() => {
					setCalled = true;
				});
				callback();
				return 'success';
			});

			const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

			// Wait for the observable to complete
			await new Promise((resolve) => {
				result.subscribe({
					complete: resolve,
					next: () => {},
				});
			});

			expect(setCalled).toBe(true);
		});
	});

	describe('observable handling', () => {
		it('should handle observable completion', () => {
			const requestId = 'complete-request-id';
			const mockMetadata = {
				get: vi.fn().mockReturnValue([requestId]),
			};
			const mockGrpcContext = {
				getContext: vi.fn().mockReturnValue(mockMetadata),
			};

			mockExecutionContext.switchToRpc.mockReturnValue(mockGrpcContext);
			mockCallHandler.handle.mockReturnValue(of('success'));

			const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

			expect(result).toBeInstanceOf(Observable);
		});

		it('should handle observable error', () => {
			const requestId = 'observable-error-request-id';
			const error = new Error('Observable error');
			const mockMetadata = {
				get: vi.fn().mockReturnValue([requestId]),
			};
			const mockGrpcContext = {
				getContext: vi.fn().mockReturnValue(mockMetadata),
			};

			mockExecutionContext.switchToRpc.mockReturnValue(mockGrpcContext);
			mockCallHandler.handle.mockReturnValue(throwError(() => error));

			const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

			expect(result).toBeInstanceOf(Observable);
		});

		it('should handle observable with multiple emissions', () => {
			const requestId = 'multiple-request-id';
			const mockMetadata = {
				get: vi.fn().mockReturnValue([requestId]),
			};
			const mockGrpcContext = {
				getContext: vi.fn().mockReturnValue(mockMetadata),
			};

			mockExecutionContext.switchToRpc.mockReturnValue(mockGrpcContext);
			mockCallHandler.handle.mockReturnValue(of('emission1', 'emission2', 'emission3'));

			const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

			expect(result).toBeInstanceOf(Observable);
		});
	});

	describe('error handling', () => {
		it('should handle gRPC context errors', async () => {
			const error = new Error('gRPC context error');
			mockExecutionContext.switchToRpc.mockImplementation(() => {
				throw error;
			});

			expect(() => {
				interceptor.intercept(mockExecutionContext, mockCallHandler);
			}).toThrow('gRPC context error');
		});

		it('should handle metadata access errors', async () => {
			const error = new Error('Metadata access error');
			const mockMetadata = {
				get: vi.fn().mockImplementation(() => {
					throw error;
				}),
			};
			const mockGrpcContext = {
				getContext: vi.fn().mockReturnValue(mockMetadata),
			};

			mockExecutionContext.switchToRpc.mockReturnValue(mockGrpcContext);

			expect(() => {
				interceptor.intercept(mockExecutionContext, mockCallHandler);
			}).toThrow('Metadata access error');
		});
	});

	describe('edge cases', () => {
		it('should handle null execution context', () => {
			expect(() => {
				interceptor.intercept(null as any, mockCallHandler);
			}).toThrow();
		});

		it('should handle very long request IDs', async () => {
			const longRequestId = 'a'.repeat(1000);
			const mockMetadata = {
				get: vi.fn().mockReturnValue([longRequestId]),
			};
			const mockGrpcContext = {
				getContext: vi.fn().mockReturnValue(mockMetadata),
			};

			mockExecutionContext.switchToRpc.mockReturnValue(mockGrpcContext);
			mockCallHandler.handle.mockReturnValue(of('success'));
			mockRequestContextService.run.mockImplementation((callback) => {
				callback();
				return 'success';
			});

			const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

			// Wait for the observable to complete
			await new Promise((resolve) => {
				result.subscribe({
					complete: resolve,
					next: () => {},
				});
			});

			expect(mockRequestContextService.set).toHaveBeenCalledWith('requestId', longRequestId);
		});

		it('should handle special characters in request IDs', async () => {
			const specialRequestId = 'req-id@#$%^&*()_+-=[]{}|;:,.<>?';
			const mockMetadata = {
				get: vi.fn().mockReturnValue([specialRequestId]),
			};
			const mockGrpcContext = {
				getContext: vi.fn().mockReturnValue(mockMetadata),
			};

			mockExecutionContext.switchToRpc.mockReturnValue(mockGrpcContext);
			mockCallHandler.handle.mockReturnValue(of('success'));
			mockRequestContextService.run.mockImplementation((callback) => {
				callback();
				return 'success';
			});

			const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

			// Wait for the observable to complete
			await new Promise((resolve) => {
				result.subscribe({
					complete: resolve,
					next: () => {},
				});
			});

			expect(mockRequestContextService.set).toHaveBeenCalledWith('requestId', specialRequestId);
		});
	});

	describe('performance considerations', () => {
		it('should handle high-frequency interceptions', async () => {
			const requestId = 'perf-request-id';
			const mockMetadata = {
				get: vi.fn().mockReturnValue([requestId]),
			};
			const mockGrpcContext = {
				getContext: vi.fn().mockReturnValue(mockMetadata),
			};

			mockExecutionContext.switchToRpc.mockReturnValue(mockGrpcContext);
			mockCallHandler.handle.mockReturnValue(of('success'));
			mockRequestContextService.run.mockImplementation((callback) => {
				callback();
				return 'success';
			});

			// Test multiple rapid interceptions
			const promises = [];
			for (let i = 0; i < 100; i++) {
				const result = interceptor.intercept(mockExecutionContext, mockCallHandler);
				promises.push(
					new Promise((resolve) => {
						result.subscribe({
							complete: resolve,
							next: () => {},
						});
					}),
				);
			}

			await Promise.all(promises);

			expect(mockRequestContextService.run).toHaveBeenCalledTimes(100);
			expect(mockRequestContextService.set).toHaveBeenCalledTimes(100);
		});

		it('should not create memory leaks with repeated interceptions', async () => {
			const requestId = 'memory-request-id';
			const mockMetadata = {
				get: vi.fn().mockReturnValue([requestId]),
			};
			const mockGrpcContext = {
				getContext: vi.fn().mockReturnValue(mockMetadata),
			};

			mockExecutionContext.switchToRpc.mockReturnValue(mockGrpcContext);
			mockCallHandler.handle.mockReturnValue(of('success'));
			mockRequestContextService.run.mockImplementation((callback) => {
				callback();
				return 'success';
			});

			// Test many interceptions to ensure no memory leaks
			const promises = [];
			for (let i = 0; i < 1000; i++) {
				const result = interceptor.intercept(mockExecutionContext, mockCallHandler);
				promises.push(
					new Promise((resolve) => {
						result.subscribe({
							complete: resolve,
							next: () => {},
						});
					}),
				);
			}

			await Promise.all(promises);

			expect(mockRequestContextService.run).toHaveBeenCalledTimes(1000);
		});
	});
});
