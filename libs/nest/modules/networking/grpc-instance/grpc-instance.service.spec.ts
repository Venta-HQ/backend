import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Metadata } from '@grpc/grpc-js';
import GrpcInstance from './grpc-instance.service';

// Mock the retryObservable utility
vi.mock('@app/utils', () => ({
	retryObservable: vi.fn().mockImplementation((observable) => observable),
}));

describe('GrpcInstance', () => {
	let grpcInstance: GrpcInstance<any>;
	let mockRequest: any;
	let mockService: any;
	let mockLogger: any;

	beforeEach(() => {
		mockRequest = {
			id: 'test-request-id',
		};

		mockService = {
			anotherMethod: vi.fn(),
			testMethod: vi.fn(),
		};

		mockLogger = {
			error: vi.fn(),
			log: vi.fn(),
		};

		// Create instance with mocked dependencies
		grpcInstance = new GrpcInstance(mockRequest, mockService);
		// Mock the logger property
		(grpcInstance as any).logger = mockLogger;

		vi.clearAllMocks();
	});

	describe('invoke', () => {
		it('should invoke service method with metadata and request ID for Promise-based methods', async () => {
			const testData = { key: 'value' };
			const expectedResult = { success: true };

			mockService.testMethod.mockResolvedValue(expectedResult);

			const result = await grpcInstance.invoke('testMethod', testData);

			expect(mockService.testMethod).toHaveBeenCalledWith(testData, expect.any(Metadata));
			expect(result).toEqual(expectedResult);
		});

		it('should invoke service method with metadata and request ID for Observable-based methods', () => {
			const testData = { key: 'value' };
			const expectedResult = { success: true };
			const mockObservable = of(expectedResult);

			mockService.testMethod.mockReturnValue(mockObservable);

			const result = grpcInstance.invoke('testMethod', testData);

			expect(mockService.testMethod).toHaveBeenCalledWith(testData, expect.any(Metadata));
			expect(result).toBe(mockObservable);
		});

		it('should set request ID in metadata when available', async () => {
			const testData = { key: 'value' };
			mockService.testMethod.mockResolvedValue({});

			await grpcInstance.invoke('testMethod', testData);

			const metadata = mockService.testMethod.mock.calls[0][1];
			expect(metadata.get('requestId')).toEqual(['test-request-id']);
		});

		it('should not set request ID in metadata when not available', async () => {
			const testData = { key: 'value' };
			mockService.testMethod.mockResolvedValue({});

			// Create instance without request ID
			const instanceWithoutRequestId = new GrpcInstance({}, mockService);
			(instanceWithoutRequestId as any).logger = mockLogger;

			await instanceWithoutRequestId.invoke('testMethod', testData);

			const metadata = mockService.testMethod.mock.calls[0][1];
			expect(metadata.get('requestId')).toEqual([]);
		});

		it('should throw error when method does not exist on service', () => {
			const testData = { key: 'value' };

			// Create a new mock service without the nonExistentMethod
			const serviceWithoutMethod = {
				testMethod: vi.fn(),
			};
			const instanceWithoutMethod = new GrpcInstance(mockRequest, serviceWithoutMethod);
			(instanceWithoutMethod as any).logger = mockLogger;

			expect(() => {
				instanceWithoutMethod.invoke('nonExistentMethod' as any, testData);
			}).toThrow('Method nonExistentMethod not found on service');
		});

		it('should handle service method errors for Promise-based methods', async () => {
			const testData = { key: 'value' };
			const serviceError = new Error('Service error');
			mockService.testMethod.mockRejectedValue(serviceError);

			await expect(grpcInstance.invoke('testMethod', testData)).rejects.toThrow('Service error');
		});

		it('should handle service method errors for Observable-based methods', () => {
			const testData = { key: 'value' };
			const serviceError = new Error('Service error');
			const errorObservable = throwError(() => serviceError);

			mockService.testMethod.mockReturnValue(errorObservable);

			// Should not throw since retryObservable is mocked to return the observable
			const result = grpcInstance.invoke('testMethod', testData);
			expect(result).toBe(errorObservable);
		});

		it('should handle different data types', async () => {
			const stringData = 'test string';
			const numberData = 123;
			const objectData = { nested: { value: 'test' } };

			mockService.testMethod.mockResolvedValue({});

			await grpcInstance.invoke('testMethod', stringData);
			expect(mockService.testMethod).toHaveBeenCalledWith(stringData, expect.any(Metadata));

			await grpcInstance.invoke('testMethod', numberData);
			expect(mockService.testMethod).toHaveBeenCalledWith(numberData, expect.any(Metadata));

			await grpcInstance.invoke('testMethod', objectData);
			expect(mockService.testMethod).toHaveBeenCalledWith(objectData, expect.any(Metadata));
		});

		it('should handle null and undefined data', async () => {
			mockService.testMethod.mockResolvedValue({});

			await grpcInstance.invoke('testMethod', null);
			expect(mockService.testMethod).toHaveBeenCalledWith(null, expect.any(Metadata));

			await grpcInstance.invoke('testMethod', undefined);
			expect(mockService.testMethod).toHaveBeenCalledWith(undefined, expect.any(Metadata));
		});

		it('should handle multiple method calls', async () => {
			const data1 = { key1: 'value1' };
			const data2 = { key2: 'value2' };

			mockService.testMethod.mockResolvedValue({ result1: true });
			mockService.anotherMethod.mockResolvedValue({ result2: true });

			const result1 = await grpcInstance.invoke('testMethod', data1);
			const result2 = await grpcInstance.invoke('anotherMethod', data2);

			expect(result1).toEqual({ result1: true });
			expect(result2).toEqual({ result2: true });

			expect(mockService.testMethod).toHaveBeenCalledWith(data1, expect.any(Metadata));
			expect(mockService.anotherMethod).toHaveBeenCalledWith(data2, expect.any(Metadata));
		});

		it('should create new metadata for each call', async () => {
			const data = { key: 'value' };
			mockService.testMethod.mockResolvedValue({});

			await grpcInstance.invoke('testMethod', data);
			await grpcInstance.invoke('testMethod', data);

			const metadata1 = mockService.testMethod.mock.calls[0][1];
			const metadata2 = mockService.testMethod.mock.calls[1][1];

			// Metadata objects should be different instances
			expect(metadata1).not.toBe(metadata2);
			// But should have the same content
			expect(metadata1.get('requestId')).toEqual(metadata2.get('requestId'));
		});
	});

	describe('metadata handling', () => {
		it('should create metadata with correct structure', async () => {
			const testData = { key: 'value' };
			mockService.testMethod.mockResolvedValue({});

			await grpcInstance.invoke('testMethod', testData);

			const metadata = mockService.testMethod.mock.calls[0][1];
			expect(metadata).toBeInstanceOf(Metadata);
			expect(metadata.get('requestId')).toEqual(['test-request-id']);
		});

		it('should handle empty request ID', async () => {
			const testData = { key: 'value' };
			mockService.testMethod.mockResolvedValue({});

			const instanceWithEmptyRequestId = new GrpcInstance({ id: '' }, mockService);
			(instanceWithEmptyRequestId as any).logger = mockLogger;

			await instanceWithEmptyRequestId.invoke('testMethod', testData);

			const metadata = mockService.testMethod.mock.calls[0][1];
			// Empty string request ID should not be set in metadata
			expect(metadata.get('requestId')).toEqual([]);
		});
	});
});
