import { Metadata } from '@grpc/grpc-js';
import { Logger } from '@nestjs/common';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import GrpcInstance from './grpc-instance.service';

// Mock @grpc/grpc-js
vi.mock('@grpc/grpc-js', () => ({
	Metadata: vi.fn(),
}));

describe('GrpcInstance', () => {
	let grpcInstance: GrpcInstance<any>;
	let mockRequest: any;
	let mockService: any;
	let mockMetadata: any;

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock Metadata
		mockMetadata = {
			set: vi.fn(),
		};
		(Metadata as any).mockImplementation(() => mockMetadata);

		// Mock Logger
		vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
		vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

		// Mock request
		mockRequest = {
			id: 'test-request-id',
		};

		// Mock service
		mockService = {
			testMethod: vi.fn(),
			anotherMethod: vi.fn(),
		};

		grpcInstance = new GrpcInstance(mockRequest, mockService);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('constructor', () => {
		it('should create instance with request and service', () => {
			expect(grpcInstance).toBeDefined();
		});

		it('should store request and service', () => {
			const instance = new GrpcInstance(mockRequest, mockService);
			expect(instance).toBeDefined();
		});
	});

	describe('invoke', () => {
		it('should invoke method with metadata when request has id', () => {
			const testData = { test: 'data' };
			const expectedResult = { success: true };
			mockService.testMethod.mockReturnValue(expectedResult);

			const result = grpcInstance.invoke('testMethod', testData);

			expect(Metadata).toHaveBeenCalled();
			expect(mockMetadata.set).toHaveBeenCalledWith('requestId', 'test-request-id');
			expect(mockService.testMethod).toHaveBeenCalledWith(testData, mockMetadata);
			expect(result).toBe(expectedResult);
		});

		it('should invoke method without requestId metadata when request has no id', () => {
			const requestWithoutId = {};
			const instance = new GrpcInstance(requestWithoutId, mockService);
			const testData = { test: 'data' };
			const expectedResult = { success: true };
			mockService.testMethod.mockReturnValue(expectedResult);

			const result = instance.invoke('testMethod', testData);

			expect(Metadata).toHaveBeenCalled();
			expect(mockMetadata.set).not.toHaveBeenCalled();
			expect(mockService.testMethod).toHaveBeenCalledWith(testData, mockMetadata);
			expect(result).toBe(expectedResult);
		});

		it('should invoke method with null request id', () => {
			const requestWithNullId = { id: null };
			const instance = new GrpcInstance(requestWithNullId, mockService);
			const testData = { test: 'data' };
			const expectedResult = { success: true };
			mockService.testMethod.mockReturnValue(expectedResult);

			const result = instance.invoke('testMethod', testData);

			expect(Metadata).toHaveBeenCalled();
			expect(mockMetadata.set).not.toHaveBeenCalled();
			expect(mockService.testMethod).toHaveBeenCalledWith(testData, mockMetadata);
			expect(result).toBe(expectedResult);
		});

		it('should invoke method with undefined request id', () => {
			const requestWithUndefinedId = { id: undefined };
			const instance = new GrpcInstance(requestWithUndefinedId, mockService);
			const testData = { test: 'data' };
			const expectedResult = { success: true };
			mockService.testMethod.mockReturnValue(expectedResult);

			const result = instance.invoke('testMethod', testData);

			expect(Metadata).toHaveBeenCalled();
			expect(mockMetadata.set).not.toHaveBeenCalled();
			expect(mockService.testMethod).toHaveBeenCalledWith(testData, mockMetadata);
			expect(result).toBe(expectedResult);
		});

		it('should handle different data types', () => {
			const testCases = [
				{ data: 'string', expected: 'result' },
				{ data: 123, expected: 456 },
				{ data: { obj: 'test' }, expected: { success: true } },
				{ data: [1, 2, 3], expected: [4, 5, 6] },
				{ data: null, expected: null },
				{ data: undefined, expected: undefined },
			];

			testCases.forEach(({ data, expected }) => {
				mockService.testMethod.mockReturnValue(expected);

				const result = grpcInstance.invoke('testMethod', data);

				expect(mockService.testMethod).toHaveBeenCalledWith(data, mockMetadata);
				expect(result).toBe(expected);
			});
		});

		it('should handle different method names', () => {
			const testData = { test: 'data' };
			const expectedResult = { success: true };
			mockService.anotherMethod.mockReturnValue(expectedResult);

			const result = grpcInstance.invoke('anotherMethod', testData);

			expect(mockService.anotherMethod).toHaveBeenCalledWith(testData, mockMetadata);
			expect(result).toBe(expectedResult);
		});

		it('should return undefined when method does not exist', () => {
			const testData = { test: 'data' };

			const result = grpcInstance.invoke('nonExistentMethod' as any, testData);

			expect(result).toBeUndefined();
		});

		it('should handle service methods that return promises', async () => {
			const testData = { test: 'data' };
			const expectedResult = Promise.resolve({ success: true });
			mockService.testMethod.mockReturnValue(expectedResult);

			const result = grpcInstance.invoke('testMethod', testData);

			expect(mockService.testMethod).toHaveBeenCalledWith(testData, mockMetadata);
			expect(result).toBe(expectedResult);
		});

		it('should handle service methods that throw errors', () => {
			const testData = { test: 'data' };
			const error = new Error('Service error');
			mockService.testMethod.mockImplementation(() => {
				throw error;
			});

			expect(() => grpcInstance.invoke('testMethod', testData)).toThrow('Service error');
		});
	});

	describe('metadata handling', () => {
		it('should create new Metadata instance for each invoke call', () => {
			const testData = { test: 'data' };
			mockService.testMethod.mockReturnValue({ success: true });

			grpcInstance.invoke('testMethod', testData);
			grpcInstance.invoke('testMethod', testData);

			expect(Metadata).toHaveBeenCalledTimes(2);
		});

		it('should set requestId metadata correctly', () => {
			const testData = { test: 'data' };
			mockService.testMethod.mockReturnValue({ success: true });

			grpcInstance.invoke('testMethod', testData);

			expect(mockMetadata.set).toHaveBeenCalledWith('requestId', 'test-request-id');
		});

		it('should not set requestId metadata when request id is empty string', () => {
			const requestWithEmptyId = { id: '' };
			const instance = new GrpcInstance(requestWithEmptyId, mockService);
			const testData = { test: 'data' };
			mockService.testMethod.mockReturnValue({ success: true });

			instance.invoke('testMethod', testData);

			expect(mockMetadata.set).not.toHaveBeenCalled();
		});

		it('should not set requestId metadata when request id is 0', () => {
			const requestWithZeroId = { id: 0 };
			const instance = new GrpcInstance(requestWithZeroId, mockService);
			const testData = { test: 'data' };
			mockService.testMethod.mockReturnValue({ success: true });

			instance.invoke('testMethod', testData);

			expect(mockMetadata.set).not.toHaveBeenCalled();
		});

		it('should not set requestId metadata when request id is false', () => {
			const requestWithFalseId = { id: false };
			const instance = new GrpcInstance(requestWithFalseId, mockService);
			const testData = { test: 'data' };
			mockService.testMethod.mockReturnValue({ success: true });

			instance.invoke('testMethod', testData);

			expect(mockMetadata.set).not.toHaveBeenCalled();
		});
	});

	describe('edge cases', () => {
		it('should handle request with no properties', () => {
			const emptyRequest = {};
			const instance = new GrpcInstance(emptyRequest, mockService);
			const testData = { test: 'data' };
			mockService.testMethod.mockReturnValue({ success: true });

			const result = instance.invoke('testMethod', testData);

			expect(mockService.testMethod).toHaveBeenCalledWith(testData, mockMetadata);
			expect(result).toEqual({ success: true });
		});

		it('should handle service with no methods', () => {
			const emptyService = {};
			const instance = new GrpcInstance(mockRequest, emptyService);
			const testData = { test: 'data' };

			const result = instance.invoke('testMethod' as any, testData);

			expect(result).toBeUndefined();
		});

		it('should handle service with null methods', () => {
			const serviceWithNullMethod = {
				testMethod: null,
			};
			const instance = new GrpcInstance(mockRequest, serviceWithNullMethod);
			const testData = { test: 'data' };

			const result = instance.invoke('testMethod', testData);

			expect(result).toBeUndefined();
		});

		it('should handle service with undefined methods', () => {
			const serviceWithUndefinedMethod = {
				testMethod: undefined,
			};
			const instance = new GrpcInstance(mockRequest, serviceWithUndefinedMethod);
			const testData = { test: 'data' };

			const result = instance.invoke('testMethod', testData);

			expect(result).toBeUndefined();
		});
	});

	describe('multiple instances', () => {
		it('should create separate instances with different requests and services', () => {
			const request1 = { id: 'request-1' };
			const request2 = { id: 'request-2' };
			const service1 = { method1: vi.fn() };
			const service2 = { method2: vi.fn() };

			const instance1 = new GrpcInstance(request1, service1);
			const instance2 = new GrpcInstance(request2, service2);

			expect(instance1).not.toBe(instance2);
		});

		it('should use correct request and service for each instance', () => {
			const request1 = { id: 'request-1' };
			const request2 = { id: 'request-2' };
			const service1 = { method1: vi.fn().mockReturnValue('result1') };
			const service2 = { method2: vi.fn().mockReturnValue('result2') };

			const instance1 = new GrpcInstance(request1, service1);
			const instance2 = new GrpcInstance(request2, service2);

			const result1 = instance1.invoke('method1', {});
			const result2 = instance2.invoke('method2', {});

			expect(result1).toBe('result1');
			expect(result2).toBe('result2');
		});
	});
}); 