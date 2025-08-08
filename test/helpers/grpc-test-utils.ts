import { vi } from 'vitest';

/**
 * Type for gRPC observer
 */
interface GrpcObserver<T> {
	next: (value: T) => void;
	error: (error: Error) => void;
	complete: () => void;
}

/**
 * Type for gRPC subscription
 */
interface GrpcSubscription {
	unsubscribe: () => void;
}

/**
 * Creates a standardized gRPC success mock with proper cleanup
 */
export function createGrpcSuccessMock<T>(response: T, timeout = 0) {
	let subscription: GrpcSubscription | null = null;

	const mockSubscribe = (observer: GrpcObserver<T>) => {
		const timeoutId = setTimeout(() => {
			observer.next(response);
			observer.complete();
		}, timeout);

		subscription = {
			unsubscribe: () => {
				clearTimeout(timeoutId);
				subscription = null;
			},
		};

		return subscription;
	};

	return {
		pipe: vi.fn().mockReturnValue({
			subscribe: vi.fn().mockImplementation(mockSubscribe),
			toPromise: vi.fn().mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(response), timeout);
					}),
			),
		}),
		subscribe: vi.fn().mockImplementation(mockSubscribe),
	};
}

/**
 * Creates a standardized gRPC error mock with proper cleanup
 */
export function createGrpcErrorMock(error: Error, timeout = 0) {
	let subscription: GrpcSubscription | null = null;

	const mockSubscribe = (observer: GrpcObserver<any>) => {
		const timeoutId = setTimeout(() => {
			observer.error(error);
		}, timeout);

		subscription = {
			unsubscribe: () => {
				clearTimeout(timeoutId);
				subscription = null;
			},
		};

		return subscription;
	};

	return {
		pipe: vi.fn().mockReturnValue({
			subscribe: vi.fn().mockImplementation(mockSubscribe),
			toPromise: vi.fn().mockImplementation(
				() =>
					new Promise((_, reject) => {
						setTimeout(() => reject(error), timeout);
					}),
			),
		}),
		subscribe: vi.fn().mockImplementation(mockSubscribe),
	};
}

/**
 * Creates a standardized gRPC observable mock with proper cleanup
 */
export function createGrpcObservableMock<T>(responses: T[], interval = 10) {
	let subscription: GrpcSubscription | null = null;
	let timeoutIds: NodeJS.Timeout[] = [];

	const mockSubscribe = (observer: GrpcObserver<T>) => {
		responses.forEach((response, index) => {
			const timeoutId = setTimeout(() => {
				if (subscription) {
					observer.next(response);
					if (index === responses.length - 1) {
						observer.complete();
					}
				}
			}, index * interval);
			timeoutIds.push(timeoutId);
		});

		subscription = {
			unsubscribe: () => {
				timeoutIds.forEach(clearTimeout);
				timeoutIds = [];
				subscription = null;
			},
		};

		return subscription;
	};

	return {
		pipe: vi.fn().mockReturnValue({
			subscribe: vi.fn().mockImplementation(mockSubscribe),
			toPromise: vi.fn().mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(responses[responses.length - 1]), responses.length * interval);
					}),
			),
		}),
		subscribe: vi.fn().mockImplementation(mockSubscribe),
	};
}

/**
 * Creates a standardized controller test for gRPC success scenarios with timeout support
 */
export function createGrpcSuccessTest(
	controller: any,
	method: string,
	grpcClient: any,
	grpcMethod: string,
	requestData: any,
	expectedResponse: any,
	expectedGrpcCall: any,
	timeout = 0,
) {
	return async () => {
		grpcClient.invoke.mockReturnValue(createGrpcSuccessMock(expectedResponse, timeout));

		const result = await controller[method](requestData);

		expect(result).toEqual(expectedResponse);
		expect(grpcClient.invoke).toHaveBeenCalledWith(grpcMethod, expectedGrpcCall);
	};
}

/**
 * Creates a standardized controller test for gRPC error scenarios with timeout support
 */
export function createGrpcErrorTest(
	controller: any,
	method: string,
	grpcClient: any,
	grpcMethod: string,
	requestData: any,
	expectedError: Error,
	expectedGrpcCall: any,
	timeout = 0,
) {
	return async () => {
		grpcClient.invoke.mockReturnValue(createGrpcErrorMock(expectedError, timeout));

		await expect(controller[method](requestData)).rejects.toThrow(expectedError);
		expect(grpcClient.invoke).toHaveBeenCalledWith(grpcMethod, expectedGrpcCall);
	};
}

/**
 * Creates a standardized controller test for gRPC stream scenarios
 */
export function createGrpcStreamTest(
	controller: any,
	method: string,
	grpcClient: any,
	grpcMethod: string,
	requestData: any,
	expectedResponses: any[],
	expectedGrpcCall: any,
	interval = 10,
) {
	return async () => {
		grpcClient.invoke.mockReturnValue(createGrpcObservableMock(expectedResponses, interval));

		const responses: any[] = [];
		const subscription = controller[method](requestData).subscribe((response: any) => {
			responses.push(response);
		});

		await new Promise((resolve) => setTimeout(resolve, expectedResponses.length * interval + 10));
		subscription.unsubscribe();

		expect(responses).toEqual(expectedResponses);
		expect(grpcClient.invoke).toHaveBeenCalledWith(grpcMethod, expectedGrpcCall);
	};
}
