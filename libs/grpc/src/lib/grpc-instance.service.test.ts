import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Metadata } from '@grpc/grpc-js';
import { Logger } from '@nestjs/common';
// Import after mocking
import GrpcInstance from './grpc-instance.service';

// Mock @grpc/grpc-js
vi.mock('@grpc/grpc-js', () => ({
	Metadata: vi.fn(),
}));

// Mock @app/utils
vi.mock('@app/utils', () => {
	const mockRetryOperation = vi.fn().mockImplementation(async (operation: () => any) => {
		return await operation();
	});

	return {
		retryOperation: mockRetryOperation,
	};
});

describe('GrpcInstance', () => {
	let grpcInstance: GrpcInstance<any>;
	let mockService: any;
	let mockRequest: any;
	let mockMetadata: any;

	beforeEach(() => {
		// Mock Metadata
		mockMetadata = {
			set: vi.fn(),
		};
		(Metadata as any).mockImplementation(() => mockMetadata);

		// Mock service
		mockService = {
			testMethod: vi.fn(),
			anotherMethod: vi.fn(),
		};

		// Mock request
		mockRequest = {
			id: 'test-request-id',
		};

		// Create instance
		grpcInstance = new GrpcInstance(mockRequest, mockService);

		// Mock Logger
		vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
		vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
	});

	afterEach(() => {
		// Clean up mocks but don't restore them completely
		vi.clearAllMocks();
	});

	describe('constructor', () => {
		it('should create instance with request and service', () => {
			expect(grpcInstance).toBeInstanceOf(GrpcInstance);
		});

		it('should store request and service', () => {
			expect((grpcInstance as any).request).toBe(mockRequest);
			expect((grpcInstance as any).service).toBe(mockService);
		});
	});

	describe('invoke', () => {
		it('should invoke method with metadata when request has id', async () => {
			const testData = { test: 'data' };
			const expectedResult = { success: true };
			mockService.testMethod.mockReturnValue(expectedResult);

			const result = await grpcInstance.invoke('testMethod', testData);

			expect(Metadata).toHaveBeenCalled();
			expect(mockMetadata.set).toHaveBeenCalledWith('requestId', 'test-request-id');
			expect(mockService.testMethod).toHaveBeenCalledWith(testData, mockMetadata);
			expect(result).toBe(expectedResult);
		});

		it('should invoke method without requestId metadata when request has no id', async () => {
			const requestWithoutId = {};
			const instance = new GrpcInstance(requestWithoutId, mockService);
			const testData = { test: 'data' };
			const expectedResult = { success: true };
			mockService.testMethod.mockReturnValue(expectedResult);

			const result = await (instance as any).invoke('testMethod', testData);

			expect(Metadata).toHaveBeenCalled();
			expect(mockMetadata.set).not.toHaveBeenCalled();
			expect(mockService.testMethod).toHaveBeenCalledWith(testData, mockMetadata);
			expect(result).toBe(expectedResult);
		});

		it('should handle different data types', async () => {
			const testCases = [
				{ data: 'string', expected: 'result' },
				{ data: 123, expected: 456 },
				{ data: { obj: 'test' }, expected: { success: true } },
				{ data: [1, 2, 3], expected: [4, 5, 6] },
				{ data: null, expected: null },
				{ data: undefined, expected: undefined },
			];

			for (const { data, expected } of testCases) {
				mockService.testMethod.mockReturnValue(expected);

				const result = await grpcInstance.invoke('testMethod', data);

				expect(mockService.testMethod).toHaveBeenCalledWith(data, mockMetadata);
				expect(result).toBe(expected);
			}
		});

		it('should handle service methods that return promises', async () => {
			const testData = { test: 'data' };
			const expectedResult = { success: true };
			mockService.testMethod.mockResolvedValue(expectedResult);

			const result = await grpcInstance.invoke('testMethod', testData);

			expect(mockService.testMethod).toHaveBeenCalledWith(testData, mockMetadata);
			expect(result).toBe(expectedResult);
		});

		it('should handle service methods that throw errors', async () => {
			const testData = { test: 'data' };
			const error = new Error('Service error');
			mockService.testMethod.mockRejectedValue(error);

			await expect(grpcInstance.invoke('testMethod', testData)).rejects.toThrow('Service error');
			expect(mockService.testMethod).toHaveBeenCalledWith(testData, mockMetadata);
		});
	});

	describe('metadata handling', () => {
		it('should create new Metadata instance for each invoke call', async () => {
			const testData = { test: 'data' };
			mockService.testMethod.mockReturnValue({ success: true });

			await grpcInstance.invoke('testMethod', testData);
			await grpcInstance.invoke('testMethod', testData);

			expect(Metadata).toHaveBeenCalledTimes(2);
		});

		it('should set requestId metadata correctly', async () => {
			const testData = { test: 'data' };
			mockService.testMethod.mockReturnValue({ success: true });

			await grpcInstance.invoke('testMethod', testData);

			expect(mockMetadata.set).toHaveBeenCalledWith('requestId', 'test-request-id');
		});

		it('should not set requestId metadata when request id is empty string', async () => {
			const requestWithEmptyId = { id: '' };
			const instance = new GrpcInstance(requestWithEmptyId, mockService);
			const testData = { test: 'data' };
			mockService.testMethod.mockReturnValue({ success: true });

			await (instance as any).invoke('testMethod', testData);

			expect(mockMetadata.set).not.toHaveBeenCalled();
		});
	});

	describe('multiple instances', () => {
		it('should create separate instances with different requests and services', () => {
			const request1 = { id: 'request1' };
			const request2 = { id: 'request2' };
			const service1 = { method1: vi.fn() };
			const service2 = { method2: vi.fn() };

			const instance1 = new GrpcInstance(request1, service1);
			const instance2 = new GrpcInstance(request2, service2);

			expect(instance1).not.toBe(instance2);
			expect((instance1 as any).request).toBe(request1);
			expect((instance2 as any).request).toBe(request2);
			expect((instance1 as any).service).toBe(service1);
			expect((instance2 as any).service).toBe(service2);
		});
	});

	describe('retry mechanism', () => {
		it('should use retry mechanism for gRPC calls', async () => {
			const { retryOperation } = await import('@app/utils');
			const testData = { test: 'data' };
			const expectedResult = { success: true };
			mockService.testMethod.mockReturnValue(expectedResult);

			const result = await grpcInstance.invoke('testMethod', testData);

			expect(retryOperation).toHaveBeenCalled();
			expect(result).toBe(expectedResult);
		});
	});
});
