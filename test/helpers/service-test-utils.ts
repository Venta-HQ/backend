import { errors } from './test-utils';

/**
 * Creates a standardized error test for service methods
 */
export function createServiceErrorTest(
	service: any,
	method: string,
	operation: string,
	mockData: any,
	expectedCall: any,
) {
	return async () => {
		const dbError = errors.database('Database connection failed');

		// Mock the specific operation to fail
		if (operation.includes('.')) {
			const [table, opMethod] = operation.split('.');
			service[table][opMethod].mockRejectedValue(dbError);
		} else {
			service[operation].mockRejectedValue(dbError);
		}

		// For service methods, we need to call the actual service method
		// The mockData should be the parameters for the service method
		await expect(service[method](mockData)).rejects.toThrow('Database connection failed');

		// Verify the expected call was made
		if (operation.includes('.')) {
			const [table, opMethod] = operation.split('.');
			expect(service[table][opMethod]).toHaveBeenCalledWith(expectedCall);
		} else {
			expect(service[operation]).toHaveBeenCalledWith(expectedCall);
		}
	};
}

/**
 * Creates a standardized success test for service methods
 */
export function createServiceSuccessTest(
	service: any,
	method: string,
	operation: string,
	mockData: any,
	expectedResult: any,
	expectedCall: any,
) {
	return async () => {
		// Mock the specific operation to succeed
		if (operation.includes('.')) {
			const [table, opMethod] = operation.split('.');
			service[table][opMethod].mockResolvedValue(expectedResult);
		} else {
			service[operation].mockResolvedValue(expectedResult);
		}

		// For service methods, we need to call the actual service method
		// The mockData should be the parameters for the service method
		const result = await service[method](mockData);

		expect(result).toEqual(expectedResult);

		// Verify the expected call was made
		if (operation.includes('.')) {
			const [table, opMethod] = operation.split('.');
			expect(service[table][opMethod]).toHaveBeenCalledWith(expectedCall);
		} else {
			expect(service[operation]).toHaveBeenCalledWith(expectedCall);
		}
	};
}

/**
 * Creates a standardized "not found" test for service methods
 */
export function createServiceNotFoundTest(
	service: any,
	method: string,
	operation: string,
	mockData: any,
	expectedCall: any,
) {
	return async () => {
		// Mock the specific operation to return null/empty
		if (operation.includes('.')) {
			const [table, opMethod] = operation.split('.');
			service[table][opMethod].mockResolvedValue(null);
		} else {
			service[operation].mockResolvedValue(null);
		}

		const result = await service[method](mockData);

		expect(result).toBeNull();

		// Verify the expected call was made
		if (operation.includes('.')) {
			const [table, opMethod] = operation.split('.');
			expect(service[table][opMethod]).toHaveBeenCalledWith(expectedCall);
		} else {
			expect(service[operation]).toHaveBeenCalledWith(expectedCall);
		}
	};
}
