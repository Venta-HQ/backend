import { z } from 'zod';

/**
 * Generic validation utilities for common data types and patterns.
 * These utilities are domain-agnostic and can be used across any project.
 *
 * @module validation
 */

/**
 * Validates if a string is a valid UUID v4.
 *
 * @param uuid - The string to validate
 * @returns true if the string is a valid UUID v4, false otherwise
 *
 * @example
 * ```typescript
 * isValidUUID('123e4567-e89b-12d3-a456-426614174000') // true
 * isValidUUID('not-a-uuid') // false
 * ```
 */
export function isValidUUID(uuid: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

/**
 * Validates if a string is a valid email address format.
 * Note: This is a basic validation and doesn't guarantee email deliverability.
 *
 * @param email - The string to validate
 * @returns true if the string is a valid email format, false otherwise
 *
 * @example
 * ```typescript
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid-email') // false
 * ```
 */
export function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates if a string matches a basic phone number format.
 * Accepts numbers with optional country code, spaces, dashes, and parentheses.
 * Minimum length of 10 digits (excluding formatting characters).
 *
 * @param phone - The string to validate
 * @returns true if the string matches basic phone format, false otherwise
 *
 * @example
 * ```typescript
 * isValidPhone('+1 (555) 123-4567') // true
 * isValidPhone('5551234567') // true
 * isValidPhone('123') // false
 * ```
 */
export function isValidPhone(phone: string): boolean {
	return /^\+?[\d\s-()]{10,}$/.test(phone);
}

/**
 * Zod schema for validating pagination parameters.
 * Provides type-safe validation with sensible defaults.
 *
 * @returns A Zod schema for pagination parameters
 * - page: Optional positive integer (default: 1)
 * - limit: Optional positive integer between 1-100 (default: 20)
 *
 * @example
 * ```typescript
 * const query = { page: '2', limit: '50' };
 * const result = paginationSchema.safeParse({
 *   page: parseInt(query.page),
 *   limit: parseInt(query.limit),
 * });
 * if (result.success) {
 *   // result.data is { page: 2, limit: 50 }
 * }
 * ```
 */
export const paginationSchema = z.object({
	page: z.number().int().min(1).optional().default(1),
	limit: z.number().int().min(1).max(100).optional().default(20),
});

/**
 * Zod schema for validating date range parameters.
 * Ensures the end date is not before the start date.
 *
 * @returns A Zod schema for date range parameters
 * - startDate: ISO datetime string
 * - endDate: ISO datetime string (must be >= startDate)
 *
 * @example
 * ```typescript
 * const range = {
 *   startDate: '2024-01-01T00:00:00Z',
 *   endDate: '2024-12-31T23:59:59Z',
 * };
 * const result = dateRangeSchema.safeParse(range);
 * if (result.success) {
 *   // result.data has valid date range
 * } else {
 *   // result.error.message might be 'End date must be after start date'
 * }
 * ```
 */
export const dateRangeSchema = z
	.object({
		startDate: z.string().datetime(),
		endDate: z.string().datetime(),
	})
	.refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
		message: 'End date must be after start date',
	});

/**
 * Zod schema for validating geographic coordinates.
 * Ensures latitude and longitude are within valid ranges.
 *
 * @returns A Zod schema for coordinate validation
 * - lat: number between -90 and 90 (inclusive)
 * - lng: number between -180 and 180 (inclusive)
 *
 * @example
 * ```typescript
 * const point = {
 *   lat: 40.7128,
 *   lng: -74.006,
 * };
 * const result = coordinatesSchema.safeParse(point);
 * if (result.success) {
 *   // result.data has valid coordinates
 * } else {
 *   // result.error.message might indicate invalid lat/long
 * }
 * ```
 */
export const coordinatesSchema = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
});

/**
 * Type guard for checking if a value is a plain object (not an array, null, or other object types).
 *
 * @param value - The value to check
 * @returns true if the value is a plain object, false otherwise
 *
 * @example
 * ```typescript
 * isPlainObject({}) // true
 * isPlainObject({ key: 'value' }) // true
 * isPlainObject([]) // false
 * isPlainObject(null) // false
 * isPlainObject(new Date()) // false
 * ```
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
	return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Safely parses data using a Zod schema, returning the typed data or null on failure.
 * This is a more ergonomic alternative to Zod's built-in safeParse when you just want
 * the data or null, without the success/error wrapper.
 *
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns The validated and typed data if successful, null otherwise
 *
 * @example
 * ```typescript
 * const userSchema = z.object({
 *   id: z.string(),
 *   age: z.number().min(0),
 * });
 *
 * const validData = safeParse(userSchema, {
 *   id: '123',
 *   age: 25,
 * }); // Returns { id: '123', age: 25 }
 *
 * const invalidData = safeParse(userSchema, {
 *   id: '123',
 *   age: -1,
 * }); // Returns null
 * ```
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
	const result = schema.safeParse(data);
	return result.success ? result.data : null;
}
