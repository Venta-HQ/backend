import { describe, expect, it } from 'vitest';
import { ErrorCodes, interpolateMessage } from './errorcodes';

describe('ErrorCodes', () => {
	it('should have all required error codes', () => {
		expect(ErrorCodes).toHaveProperty('UNAUTHORIZED');
		expect(ErrorCodes).toHaveProperty('USER_NOT_FOUND');
		expect(ErrorCodes).toHaveProperty('VALIDATION_ERROR');
		expect(ErrorCodes).toHaveProperty('INTERNAL_SERVER_ERROR');
		expect(ErrorCodes).toHaveProperty('RATE_LIMIT_EXCEEDED');
		expect(ErrorCodes).toHaveProperty('EXTERNAL_SERVICE_UNAVAILABLE');
	});

	it('should have consistent error messages', () => {
		expect(ErrorCodes.UNAUTHORIZED).toBe('Authentication required');
		expect(ErrorCodes.USER_NOT_FOUND).toBe('User with ID "{userId}" not found');
		expect(ErrorCodes.VALIDATION_ERROR).toBe('Validation failed for {field}');
		expect(ErrorCodes.INTERNAL_SERVER_ERROR).toBe('Internal server error');
	});
});

describe('interpolateMessage', () => {
	it('should interpolate simple placeholders', () => {
		const message = 'User with ID "{userId}" not found';
		const params = { userId: '123' };
		const result = interpolateMessage(message, params);

		expect(result).toBe('User with ID "123" not found');
	});

	it('should interpolate multiple placeholders', () => {
		const message = 'Database operation "{operation}" failed for user "{userId}"';
		const params = { operation: 'SELECT', userId: '123' };
		const result = interpolateMessage(message, params);

		expect(result).toBe('Database operation "SELECT" failed for user "123"');
	});

	it('should handle missing parameters gracefully', () => {
		const message = 'User with ID "{userId}" not found';
		const params = {};
		const result = interpolateMessage(message, params);

		expect(result).toBe('User with ID "{userId}" not found');
	});

	it('should handle extra parameters', () => {
		const message = 'User with ID "{userId}" not found';
		const params = { extra: 'value', userId: '123' };
		const result = interpolateMessage(message, params);

		expect(result).toBe('User with ID "123" not found');
	});

	it('should handle curly braces without placeholders', () => {
		const message = 'This is a {simple} message with {curly} braces';
		const params = {};
		const result = interpolateMessage(message, params);

		expect(result).toBe('This is a {simple} message with {curly} braces');
	});

	it('should handle mixed placeholders and curly braces', () => {
		const message = 'User "{userId}" has {role} role in {department}';
		const params = { role: 'admin', userId: '123' };
		const result = interpolateMessage(message, params);

		expect(result).toBe('User "123" has admin role in {department}');
	});

	it('should handle null and undefined parameters', () => {
		const message = 'User with ID "{userId}" not found';
		const params = { userId: null };
		const result = interpolateMessage(message, params);

		expect(result).toBe('User with ID "null" not found');
	});

	it('should handle empty string parameters', () => {
		const message = 'User with ID "{userId}" not found';
		const params = { userId: '' };
		const result = interpolateMessage(message, params);

		expect(result).toBe('User with ID "" not found');
	});
});
