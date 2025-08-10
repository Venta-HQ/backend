/**
 * Examples demonstrating the enhanced error handling system
 * This file shows the improvements in intellisense and type safety
 */

// ErrorType used in comments for context
import { EnhancedAppError } from './enhanced-app-error';
import { ErrorCodes } from './enhanced-error-schemas';

/**
 * BEFORE: Current error handling approach
 * Problems:
 * - No intellisense for error message
 * - No intellisense for required context variables
 * - No validation of context structure
 * - Easy to make mistakes with variable names
 */
export function oldErrorHandlingExample() {
	// ❌ Old way - no intellisense, no type safety
	// throw new AppError(ErrorType.NOT_FOUND, ErrorCodes.ERR_USER_NOT_FOUND, {
	//   userId: '123' // No intellisense that this field is required
	// });
	// ❌ Old way - typos in context variables are not caught
	// throw new AppError(ErrorType.VALIDATION, ErrorCodes.ERR_VENDOR_INCOMPLETE, {
	//   feilds: ['name', 'email'] // Typo: should be 'fields'
	// });
	// ❌ Old way - no preview of resulting error message
	// Developer has to mentally interpolate: "Vendor profile is incomplete. Missing: {fields}"
}

/**
 * AFTER: Enhanced error handling approach
 * Benefits:
 * ✅ Full intellisense for error codes and context
 * ✅ Type safety prevents runtime errors
 * ✅ Message preview shows exactly what the error will say
 * ✅ Validation ensures context matches schema
 */
export function newErrorHandlingExample() {
	// ✅ User domain errors - hover over ErrorCodes.ERR_USER_NOT_FOUND to see:
	// "User with ID "{userId}" not found" - Required: { userId: string }
	const userNotFoundError = EnhancedAppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, {
		userId: '123', // ✅ Intellisense shows this field is required
	});
	// Message: "User with ID "123" not found"

	// ✅ Validation errors - hover shows exact template and required context
	// "Vendor profile is incomplete. Missing: {fields}" - Required: { fields: string[] }
	const vendorIncompleteError = EnhancedAppError.validation(ErrorCodes.ERR_VENDOR_INCOMPLETE, {
		fields: ['name', 'email'], // ✅ Type-safe context
	});
	// Message: "Vendor profile is incomplete. Missing: name,email"

	// ✅ Complex validation with numeric types
	const coordinatesError = EnhancedAppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
		lat: 91.5,
		long: -200.3, // ✅ TypeScript validates numeric types
	});
	// Message: "Invalid coordinates: lat=91.5, long=-200.3"

	// ✅ Authorization errors - clear intent
	const authError = EnhancedAppError.forbidden(ErrorCodes.ERR_VENDOR_UNAUTHORIZED, {
		userId: 'user-123',
		vendorId: 'vendor-456',
	});
	// Message: "User "user-123" is not authorized to manage vendor "vendor-456""

	// ✅ External service errors - for third-party failures
	const uploadError = EnhancedAppError.externalService(ErrorCodes.ERR_INFRA_UPLOAD_FAILED, {
		filename: 'document.pdf',
		message: 'Network timeout',
	});
	// Message: "Failed to upload file "document.pdf": Network timeout"

	// ✅ Preview errors before throwing (great for debugging)
	// ✅ Errors have interpolated messages automatically
	const authErrorMessage = authError.message;
	// Message: "User "user-123" is not authorized to manage vendor "vendor-456""

	// ✅ HOVER OVER ErrorCodes to see rich type information!
	// TypeScript will show: Message: "Invalid webhook payload from "{source}"" | Context: source
	const webhookError = EnhancedAppError.validation(ErrorCodes.ERR_COMM_WEBHOOK_INVALID, { source: 'clerk' });

	// ✅ Type enforcement ensures context matches schema exactly
	const typeEnforcedError = EnhancedAppError.validation(ErrorCodes.ERR_USER_INCOMPLETE, {
		fields: ['name', 'email'], // ✅ Must be string[] as defined in schema - REQUIRED field
	});

	// ❌ Uncomment to see TypeScript enforce required fields:
	// const missingFieldError = EnhancedAppError.validation(ErrorCodes.ERR_USER_INCOMPLETE, {
	//   // ❌ Property 'fields' is missing in type '{}' but required
	// });

	// ✅ Required fields for interpolation + additional context allowed:
	const richContextError = EnhancedAppError.validation(ErrorCodes.ERR_USER_INCOMPLETE, {
		fields: ['name', 'email'], // ✅ Required for interpolation
		userId: 'user-123', // ✅ Additional context allowed
		attemptedAction: 'profile-update',
		timestamp: new Date().toISOString(),
	});

	// 🧪 Let's test type enforcement explicitly:

	// ❌ This should fail - missing required field:
	const _missingFieldTest = EnhancedAppError.validation(ErrorCodes.ERR_USER_INCOMPLETE, {
		// @ts-expect-error - 'fields' is required but missing
		userId: 'user-123', // Extra context is fine, but 'fields' is required
	});

	// ❌ This should fail - wrong type for required field:
	const _wrongTypeTest = EnhancedAppError.validation(ErrorCodes.ERR_USER_INCOMPLETE, {
		// @ts-expect-error - 'fields' should be string[], not string
		fields: 'not-an-array',
		userId: 'user-123',
	});

	return {
		userNotFoundError,
		vendorIncompleteError,
		coordinatesError,
		webhookError,
		typeEnforcedError,
		richContextError,
		authError,
		uploadError,
		authErrorMessage,
	};
}

/**
 * Real-world usage examples showing flexible context
 */
function demonstrateFlexibleContext() {
	// ✅ Minimal required context for message interpolation
	const basicError = EnhancedAppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, {
		userId: 'user-123', // Required for "User with ID "{userId}" not found"
	});

	// ✅ Rich context with additional debugging information
	const enrichedError = EnhancedAppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, {
		userId: 'user-123', // Required for interpolation
		requestId: 'req-abc-123', // Additional context
		userAgent: 'Mozilla/5.0...', // Additional context
		ipAddress: '192.168.1.1', // Additional context
		endpoint: '/api/users/user-123',
		timestamp: new Date().toISOString(),
	});

	// Both errors will have the same interpolated message: "User with ID "user-123" not found"
	// But enrichedError.context will have much more debugging information

	return { basicError, enrichedError };
}

/**
 * Original real-world usage examples in service methods
 */
export class UserService {
	async getUserById(userId: string) {
		const user = await this.findUser(userId);

		if (!user) {
			// ✅ Clean static method with enum - no magic strings!
			throw EnhancedAppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, { userId });
			// Message: "User with ID "123" not found"
		}

		return user;
	}

	async createUser(userData: any) {
		if (await this.userExists(userData.email)) {
			// ✅ Validation errors for business rules with enum
			throw EnhancedAppError.validation(ErrorCodes.ERR_USER_EXISTS, { email: userData.email });
			// Message: "User with email "john@example.com" already exists"
		}

		const validationErrors = this.validateUserData(userData);
		if (validationErrors.length > 0) {
			// ✅ Complex context with arrays - full type safety
			throw EnhancedAppError.validation(ErrorCodes.ERR_USER_INCOMPLETE, { fields: validationErrors });
			// Message: "User profile is incomplete. Missing: name,email,phone"
		}

		return this.saveUser(userData);
	}

	private async findUser(_userId: string) {
		// Simulation
		return null;
	}

	private async userExists(_email: string) {
		// Simulation
		return false;
	}

	private validateUserData(_userData: any): string[] {
		// Simulation
		return [];
	}

	private async saveUser(userData: any) {
		// Simulation
		return userData;
	}
}

export class VendorService {
	async updateVendorLocation(vendorId: string, lat: number, lng: number, userId: string) {
		// ✅ Input validation with clear error messages
		if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
			throw EnhancedAppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, { lat, long: lng });
			// Message: "Invalid coordinates: lat=91.5, long=-200.3"
		}

		const vendor = await this.findVendor(vendorId);
		if (!vendor) {
			throw EnhancedAppError.notFound(ErrorCodes.ERR_VENDOR_NOT_FOUND, { vendorId });
			// Message: "Vendor with ID "vendor-123" not found"
		}

		// ✅ Authorization check - use forbidden for permission denials
		if (!this.canUserManageVendor(userId, vendorId)) {
			throw EnhancedAppError.forbidden(ErrorCodes.ERR_VENDOR_UNAUTHORIZED, { userId, vendorId });
			// Message: "User "user-123" is not authorized to manage vendor "vendor-456""
		}

		try {
			await this.updateLocationInRedis(vendorId, lat, lng);
		} catch (error) {
			// ✅ External service error with operation context
			throw EnhancedAppError.internal(ErrorCodes.ERR_LOC_REDIS_FAILED, { operation: 'GEOADD' });
			// Message: "Redis location operation failed: GEOADD"
		}

		return { success: true };
	}

	private async findVendor(vendorId: string) {
		// Simulation
		return { id: vendorId };
	}

	private canUserManageVendor(_userId: string, _vendorId: string): boolean {
		// Simulation
		return true;
	}

	private async updateLocationInRedis(_vendorId: string, _lat: number, _lng: number) {
		// Simulation
		return true;
	}
}

export class WebhookService {
	async processWebhook(payload: any, source: string, signature: string) {
		// ✅ Signature validation
		if (!this.validateSignature(payload, signature, source)) {
			throw EnhancedAppError.unauthorized(ErrorCodes.ERR_COMM_WEBHOOK_SIGNATURE, { source });
			// Message: "Invalid webhook signature from "clerk""
		}

		// ✅ Payload validation
		if (!this.validatePayload(payload)) {
			throw EnhancedAppError.validation(ErrorCodes.ERR_COMM_WEBHOOK_INVALID, { source });
			// Message: "Invalid webhook payload from "clerk""
		}

		try {
			await this.processPayload(payload);
		} catch (error) {
			// ✅ Notification failure with recipient context
			throw EnhancedAppError.externalService(ErrorCodes.ERR_COMM_NOTIFICATION_FAILED, {
				recipient: 'webhook-processor',
			});
			// Message: "Failed to send notification to "webhook-processor""
		}

		return { processed: true };
	}

	private validateSignature(_payload: any, _signature: string, _source: string): boolean {
		// Simulation
		return true;
	}

	private validatePayload(_payload: any): boolean {
		// Simulation
		return true;
	}

	private async processPayload(_payload: any) {
		// Simulation
		return true;
	}
}

/**
 * Demonstration of intellisense improvements
 */
export function demonstrateIntellisense() {
	// ✅ When you type 'ErrorCodes.ERR_USER_' intellisense shows:
	// - ErrorCodes.ERR_USER_NOT_FOUND
	// - ErrorCodes.ERR_USER_EXISTS
	// - ErrorCodes.ERR_USER_INVALID_DATA
	// - ErrorCodes.ERR_USER_INCOMPLETE
	// - ErrorCodes.ERR_USER_VENDOR_EXISTS

	// 🎯 HOVER OVER any ErrorCodes property to see rich type information!
	// TypeScript displays: Message: "..." | Context: fieldNames

	// ✅ When you hover over ErrorCodes.ERR_USER_NOT_FOUND, you see:
	// Message: "User with ID "{userId}" not found" | Context: userId

	// ✅ When you hover over ErrorCodes.ERR_VENDOR_INCOMPLETE, you see:
	// Message: "Vendor profile is incomplete. Missing: {fields}" | Context: fields

	// ✅ Static methods with enum provide clear intent and great intellisense:
	// EnhancedAppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, { userId: 'user-123' })
	// EnhancedAppError.forbidden(ErrorCodes.ERR_VENDOR_UNAUTHORIZED, { userId: 'user-123', vendorId: 'vendor-456' })

	// 🛡️ STRICT FIELD ENFORCEMENT - z.input ensures required fields are actually required:

	// ✅ All required fields provided - works perfectly
	const userError = EnhancedAppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, {
		userId: 'user-123', // ✅ REQUIRED field - cannot be omitted
	});

	const vendorError = EnhancedAppError.validation(ErrorCodes.ERR_VENDOR_INCOMPLETE, {
		fields: ['name'], // ✅ REQUIRED field with correct type (string[])
	});

	const coordError = EnhancedAppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
		lat: 91.5, // ✅ REQUIRED field (number)
		long: -200.3, // ✅ REQUIRED field (number)
	});

	// ❌ These would show TypeScript errors if uncommented:
	// const missingFieldError = EnhancedAppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, {
	//   // ❌ Property 'userId' is missing in type '{}' but required in type '{ userId: string; }'
	// });

	return { userError, vendorError, coordError };
}

/**
 * Testing improvements
 */
export function testingExamples() {
	// ✅ Type-safe error assertions in tests with enum
	try {
		throw EnhancedAppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, { userId: 'test-user' });
	} catch (error) {
		if (error instanceof EnhancedAppError) {
			// ✅ Full type safety in error handling
			console.assert(error.errorCode === ErrorCodes.ERR_USER_NOT_FOUND);
			console.assert(error.context.userId === 'test-user');
			console.assert(error.interpolatedMessage === 'User with ID "test-user" not found');

			// ✅ Clean error properties available
			console.assert(error.errorCode === 'ERR_USER_NOT_FOUND');
			console.assert(error.errorType === 'NOT_FOUND');
		}
	}
}

/**
 * Migration path demonstration
 */
export function migrationPath() {
	// ❌ OLD: Error-prone, no intellisense
	// throw new AppError(ErrorType.NOT_FOUND, ErrorCodes.ERR_USER_NOT_FOUND, { userId: '123' });

	// ✅ NEW: Clean static method with enum - no magic strings, great intellisense
	throw EnhancedAppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, { userId: '123' });

	// ✅ Other examples of the static method pattern with enum:
	throw EnhancedAppError.validation(ErrorCodes.ERR_USER_INCOMPLETE, { fields: ['name'] });
	throw EnhancedAppError.forbidden(ErrorCodes.ERR_VENDOR_UNAUTHORIZED, { userId: 'u1', vendorId: 'v1' });
	throw EnhancedAppError.externalService(ErrorCodes.ERR_INFRA_UPLOAD_FAILED, {
		filename: 'test.pdf',
		message: 'timeout',
	});
}
