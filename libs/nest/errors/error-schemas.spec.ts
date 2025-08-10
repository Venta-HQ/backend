import { describe, expect, it } from 'vitest';
import { AppError, ERROR_MESSAGES, ErrorCodes } from './error-schemas';

describe('ErrorCodes', () => {
	it('should have all required error codes', () => {
		expect(ErrorCodes).toHaveProperty('ERR_UNAUTHORIZED');
		expect(ErrorCodes).toHaveProperty('ERR_USER_NOT_FOUND');
		expect(ErrorCodes).toHaveProperty('ERR_VALIDATION_FAILED');
		expect(ErrorCodes).toHaveProperty('ERR_INTERNAL');
		expect(ErrorCodes).toHaveProperty('ERR_INVALID_INPUT');
	});

	it('should have consistent error messages', () => {
		expect(ERROR_MESSAGES[ErrorCodes.ERR_UNAUTHORIZED]).toBe('Authentication required');
		expect(ERROR_MESSAGES[ErrorCodes.ERR_USER_NOT_FOUND]).toBe('User not found');
		expect(ERROR_MESSAGES[ErrorCodes.ERR_VALIDATION_FAILED]).toBe('Validation failed');
		expect(ERROR_MESSAGES[ErrorCodes.ERR_INTERNAL]).toBe('Internal server error');
	});
});

describe('AppError', () => {
	it('should create validation errors with typed data', () => {
		const error = AppError.validation(ErrorCodes.ERR_USER_INCOMPLETE, {
			fields: ['name', 'email'],
		});

		expect(error).toBeInstanceOf(AppError);
		expect(error.message).toBe('User profile is incomplete');
		expect(error.errorCode).toBe(ErrorCodes.ERR_USER_INCOMPLETE);
		expect(error.errorType).toBe('VALIDATION');
		expect(error.data.fields).toEqual(['name', 'email']);
	});

	it('should create not found errors with typed data', () => {
		const error = AppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, {
			userId: 'user-123',
		});

		expect(error).toBeInstanceOf(AppError);
		expect(error.message).toBe('User not found');
		expect(error.errorCode).toBe(ErrorCodes.ERR_USER_NOT_FOUND);
		expect(error.errorType).toBe('NOT_FOUND');
		expect(error.data.userId).toBe('user-123');
	});

	it('should create unauthorized errors with no data required', () => {
		const error = AppError.unauthorized(ErrorCodes.ERR_UNAUTHORIZED, {});

		expect(error).toBeInstanceOf(AppError);
		expect(error.message).toBe('Authentication required');
		expect(error.errorCode).toBe(ErrorCodes.ERR_UNAUTHORIZED);
		expect(error.errorType).toBe('UNAUTHORIZED');
		expect(error.data).toEqual({});
	});

	it('should create forbidden errors with multiple data fields', () => {
		const error = AppError.forbidden(ErrorCodes.ERR_VENDOR_UNAUTHORIZED, {
			userId: 'user-123',
			vendorId: 'vendor-456',
		});

		expect(error).toBeInstanceOf(AppError);
		expect(error.message).toBe('User not authorized to manage vendor');
		expect(error.errorCode).toBe(ErrorCodes.ERR_VENDOR_UNAUTHORIZED);
		expect(error.errorType).toBe('FORBIDDEN');
		expect(error.data.userId).toBe('user-123');
		expect(error.data.vendorId).toBe('vendor-456');
	});

	it('should create location errors with numeric data', () => {
		const error = AppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
			lat: 91.5,
			long: -200.3,
		});

		expect(error).toBeInstanceOf(AppError);
		expect(error.message).toBe('Invalid coordinates');
		expect(error.errorCode).toBe(ErrorCodes.ERR_LOC_INVALID_COORDS);
		expect(error.data.lat).toBe(91.5);
		expect(error.data.long).toBe(-200.3);
	});
});
