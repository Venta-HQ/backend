import { vi } from 'vitest';

/**
 * Creates a standardized gRPC success mock
 */
export function createGrpcSuccessMock(response: any) {
	return {
		pipe: vi.fn().mockReturnValue({
			subscribe: vi.fn().mockImplementation((observer) => {
				observer.next(response);
				observer.complete();
				return { unsubscribe: vi.fn() };
			}),
			toPromise: vi.fn().mockResolvedValue(response),
		}),
		subscribe: vi.fn().mockImplementation((observer) => {
			observer.next(response);
			observer.complete();
			return { unsubscribe: vi.fn() };
		}),
	};
}

/**
 * Creates a standardized gRPC error mock
 */
export function createGrpcErrorMock(error: Error) {
	return {
		pipe: vi.fn().mockReturnValue({
			subscribe: vi.fn().mockImplementation((observer) => {
				observer.error(error);
				return { unsubscribe: vi.fn() };
			}),
			toPromise: vi.fn().mockRejectedValue(error),
		}),
		subscribe: vi.fn().mockImplementation((observer) => {
			observer.error(error);
			return { unsubscribe: vi.fn() };
		}),
	};
}

/**
 * Creates a standardized gRPC observable mock
 */
export function createGrpcObservableMock<T>(responses: T[]) {
	let currentIndex = 0;
	
	return {
		pipe: vi.fn().mockReturnValue({
			subscribe: vi.fn().mockImplementation((observer) => {
				responses.forEach((response, index) => {
					setTimeout(() => {
						observer.next(response);
						if (index === responses.length - 1) {
							observer.complete();
						}
					}, index * 10);
				});
				return { unsubscribe: vi.fn() };
			}),
			toPromise: vi.fn().mockResolvedValue(responses[responses.length - 1]),
		}),
		subscribe: vi.fn().mockImplementation((observer) => {
			responses.forEach((response, index) => {
				setTimeout(() => {
					observer.next(response);
					if (index === responses.length - 1) {
						observer.complete();
					}
				}, index * 10);
			});
			return { unsubscribe: vi.fn() };
		}),
	};
}

/**
 * Creates a standardized controller test for gRPC success scenarios
 */
export function createGrpcSuccessTest(
	controller: any,
	method: string,
	grpcClient: any,
	grpcMethod: string,
	requestData: any,
	expectedResponse: any,
	expectedGrpcCall: any
) {
	return async () => {
		grpcClient.invoke.mockReturnValue(createGrpcSuccessMock(expectedResponse));

		const result = await controller[method](requestData);

		expect(result).toEqual(expectedResponse);
		expect(grpcClient.invoke).toHaveBeenCalledWith(grpcMethod, expectedGrpcCall);
	};
}

/**
 * Creates a standardized controller test for gRPC error scenarios
 */
export function createGrpcErrorTest(
	controller: any,
	method: string,
	grpcClient: any,
	grpcMethod: string,
	requestData: any,
	expectedError: Error,
	expectedGrpcCall: any
) {
	return async () => {
		grpcClient.invoke.mockReturnValue(createGrpcErrorMock(expectedError));

		await expect(controller[method](requestData)).rejects.toThrow(expectedError);
		expect(grpcClient.invoke).toHaveBeenCalledWith(grpcMethod, expectedGrpcCall);
	};
} 