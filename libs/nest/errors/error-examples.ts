/**
 * Examples demonstrating the type-safe error handling system
 */

import { EnhancedAppError, ErrorCodes } from './error-schemas';

/**
 * ✅ WORKING ERROR SYSTEM EXAMPLES
 */
export function demonstrateErrorHandling() {
	// ✅ User errors with typed data
	const userNotFound = AppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, {
		userId: 'user-123', // ✅ Required field - TypeScript enforces this
	});
	// userNotFound.message = "User not found"
	// userNotFound.data = { userId: 'user-123' }

	// ✅ Validation errors with array data
	const userIncomplete = AppError.validation(ErrorCodes.ERR_USER_INCOMPLETE, {
		fields: ['name', 'email'], // ✅ Must be string[] - type enforced
	});
	// userIncomplete.message = "User profile is incomplete"
	// userIncomplete.data = { fields: ['name', 'email'] }

	// ✅ Location errors with numeric data
	const invalidCoords = AppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
		lat: 91.5, // ✅ Must be number
		long: -200.3, // ✅ Must be number
	});

	// ✅ Authorization errors with multiple fields
	const unauthorized = AppError.forbidden(ErrorCodes.ERR_VENDOR_UNAUTHORIZED, {
		userId: 'user-123',
		vendorId: 'vendor-456',
	});

	// ✅ Errors with no data required
	const authRequired = AppError.unauthorized(ErrorCodes.ERR_UNAUTHORIZED, {});

	return {
		userNotFound,
		userIncomplete,
		invalidCoords,
		unauthorized,
		authRequired,
	};
}

/**
 * ✅ REAL-WORLD SERVICE EXAMPLES
 */
export class UserService {
	async getUserById(userId: string) {
		const user = await this.findUser(userId);

		if (!user) {
			// ✅ Type-safe error with static message + typed data
			throw AppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, { userId });
		}

		return user;
	}

	async createUser(userData: any) {
		// ✅ Business rule validation
		if (await this.userExists(userData.email)) {
			throw AppError.validation(ErrorCodes.ERR_USER_EXISTS, {
				email: userData.email,
			});
		}

		// ✅ Input validation with typed array
		const validationErrors = this.validateUserData(userData);
		if (validationErrors.length > 0) {
			throw AppError.validation(ErrorCodes.ERR_USER_INCOMPLETE, {
				fields: validationErrors,
			});
		}

		return this.saveUser(userData);
	}

	private async findUser(_userId: string) {
		return null;
	}
	private async userExists(_email: string) {
		return false;
	}
	private validateUserData(_userData: any): string[] {
		return [];
	}
	private async saveUser(userData: any) {
		return userData;
	}
}

export class VendorService {
	async updateVendorLocation(vendorId: string, lat: number, lng: number, userId: string) {
		// ✅ Input validation with numeric types
		if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
			throw AppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
				lat,
				long: lng,
			});
		}

		// ✅ Resource validation
		const vendor = await this.findVendor(vendorId);
		if (!vendor) {
			throw AppError.notFound(ErrorCodes.ERR_VENDOR_NOT_FOUND, { vendorId });
		}

		// ✅ Authorization check
		if (!this.canUserManageVendor(userId, vendorId)) {
			throw AppError.forbidden(ErrorCodes.ERR_VENDOR_UNAUTHORIZED, {
				userId,
				vendorId,
			});
		}

		try {
			await this.updateLocationInDatabase(vendorId, lat, lng);
		} catch (error) {
			// ✅ Database operation error
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'UPDATE location',
			});
		}

		return { success: true };
	}

	private async findVendor(vendorId: string) {
		return { id: vendorId };
	}
	private canUserManageVendor(_userId: string, _vendorId: string): boolean {
		return true;
	}
	private async updateLocationInDatabase(_vendorId: string, _lat: number, _lng: number) {
		return true;
	}
}

/**
 * ✅ TESTING EXAMPLES
 */
export function testingExamples() {
	try {
		throw AppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, { userId: 'test-user' });
	} catch (error) {
		if (error instanceof AppError) {
			// ✅ Test static message
			console.assert(error.message === 'User not found');

			// ✅ Test typed data
			console.assert(error.data.userId === 'test-user');

			// ✅ Test error metadata
			console.assert(error.errorCode === ErrorCodes.ERR_USER_NOT_FOUND);
			console.assert(error.errorType === 'NOT_FOUND');
		}
	}
}

/**
 * ✅ TYPE ENFORCEMENT EXAMPLES
 * Uncomment these one at a time to test TypeScript enforcement
 */
export function demonstrateTypeEnforcement() {
	// ✅ CORRECT USAGE - These work perfectly
	const correctError = AppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, {
		userId: 'user-123', // ✅ Required field provided
	});

	// ❌ INCORRECT USAGE - These cause TypeScript errors (uncomment to test):

	// Missing required field:
	// const missingFieldError = AppError.validation(ErrorCodes.ERR_USER_INCOMPLETE, {
	//   // ❌ TypeScript Error: Property 'fields' is missing in type '{}' but required
	// });

	// Wrong type for required field:
	// const wrongTypeError = AppError.validation(ErrorCodes.ERR_USER_INCOMPLETE, {
	//   fields: 'not-an-array', // ❌ TypeScript Error: Type 'string' is not assignable to type 'string[]'
	// });

	// Empty data for schema that requires data:
	// const emptyDataError = AppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, {
	//   // ❌ TypeScript Error: Property 'userId' is missing in type '{}' but required
	// });

	return { correctError };
}

/**
 * ✅ MIGRATION FROM OLD SYSTEM
 */
export function migrationExample() {
	// ❌ OLD: Manual error type, magic strings, no type safety
	// throw new AppError(ErrorType.NOT_FOUND, 'ERR_USER_NOT_FOUND', { userId: '123' });

	// ✅ NEW: Clean static method, enum, type safety
	throw AppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, { userId: '123' });
}
