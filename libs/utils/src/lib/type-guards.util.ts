/**
 * Type guard utilities for common type checking patterns
 */

/**
 * Type guard for checking if a value is a non-empty string.
 * Validates that the value is a string and has at least one character.
 *
 * @param value - The value to check
 * @returns true if the value is a non-empty string, false otherwise
 *
 * @example
 * ```typescript
 * isNonEmptyString('hello') // true
 * isNonEmptyString('') // false
 * isNonEmptyString(123) // false
 * isNonEmptyString(null) // false
 *
 * // TypeScript type narrowing
 * const value: unknown = getUserInput();
 * if (isNonEmptyString(value)) {
 *   // value is typed as string here
 *   console.log(value.toUpperCase());
 * }
 * ```
 */
export function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard for checking if a value is a valid number.
 * Returns false for NaN, Infinity, and non-number types.
 *
 * @param value - The value to check
 * @returns true if the value is a finite number, false otherwise
 *
 * @example
 * ```typescript
 * isValidNumber(123) // true
 * isValidNumber(-0.5) // true
 * isValidNumber('123') // false
 * isValidNumber(NaN) // false
 * isValidNumber(Infinity) // false
 *
 * // TypeScript type narrowing
 * const value: unknown = getNumericInput();
 * if (isValidNumber(value)) {
 *   // value is typed as number here
 *   console.log(value.toFixed(2));
 * }
 * ```
 */
export function isValidNumber(value: unknown): value is number {
	return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Type guard for checking if a value is a valid date string.
 * Tests if the string can be parsed into a valid JavaScript Date object.
 *
 * @param value - The value to check
 * @returns true if the value is a string that can be parsed into a valid date, false otherwise
 *
 * @example
 * ```typescript
 * isValidDateString('2024-03-21') // true
 * isValidDateString('2024-03-21T15:30:00Z') // true
 * isValidDateString('not a date') // false
 * isValidDateString('2024-13-45') // false (invalid month/day)
 *
 * // TypeScript type narrowing
 * const value: unknown = getDateInput();
 * if (isValidDateString(value)) {
 *   // value is typed as string here
 *   const date = new Date(value);
 * }
 * ```
 */
export function isValidDateString(value: unknown): value is string {
	if (typeof value !== 'string') return false;
	const date = new Date(value);
	return !isNaN(date.getTime());
}

/**
 * Type guard for checking if a value is a valid array, optionally validating each item.
 * Can be used with or without an item-level type guard for flexible array validation.
 *
 * @param value - The value to check
 * @param itemGuard - Optional function to validate individual array items
 * @returns true if the value is an array (and all items pass the guard if provided), false otherwise
 *
 * @example
 * ```typescript
 * // Basic array check
 * isValidArray([1, 2, 3]) // true
 * isValidArray('not array') // false
 *
 * // With item type guard
 * isValidArray([1, 2, 3], isValidNumber) // true
 * isValidArray(['1', 2, 3], isValidNumber) // false
 *
 * // Custom item guard
 * interface User { id: string; name: string; }
 * const isUser = (value: unknown): value is User =>
 *   hasRequiredProperties<User>(value, ['id', 'name']);
 *
 * const users: unknown = getUsers();
 * if (isValidArray(users, isUser)) {
 *   // users is typed as User[]
 *   users.forEach(user => console.log(user.name));
 * }
 * ```
 */
export function isValidArray<T>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[] {
	if (!Array.isArray(value)) return false;
	if (!itemGuard) return true;
	return value.every((item) => itemGuard(item));
}

/**
 * Type guard for checking if an object has all required properties.
 * Useful for validating object shapes and implementing custom type guards.
 *
 * @param value - The value to check
 * @param properties - Array of required property names
 * @returns true if the value is an object with all required properties, false otherwise
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email?: string;
 * }
 *
 * // Basic property check
 * const obj = { id: '123', name: 'John' };
 * if (hasRequiredProperties<User>(obj, ['id', 'name'])) {
 *   // obj is typed as User here
 *   console.log(obj.name);
 * }
 *
 * // Custom type guard
 * function isUser(value: unknown): value is User {
 *   return hasRequiredProperties<User>(value, ['id', 'name']);
 * }
 *
 * const data: unknown = getUserData();
 * if (isUser(data)) {
 *   // data is typed as User here
 *   console.log(data.name);
 * }
 * ```
 */
export function hasRequiredProperties<T extends Record<string, unknown>>(
	value: unknown,
	properties: (keyof T)[],
): value is T {
	if (typeof value !== 'object' || value === null) return false;
	return properties.every((prop) => prop in value);
}

/**
 * Type guard for checking if a value is a valid enum value.
 * Works with both string and numeric enums.
 *
 * @param value - The value to check
 * @param enumObj - The enum object to check against
 * @returns true if the value is a valid enum value, false otherwise
 *
 * @example
 * ```typescript
 * enum UserRole {
 *   ADMIN = 'ADMIN',
 *   USER = 'USER',
 * }
 *
 * enum Status {
 *   ACTIVE = 1,
 *   INACTIVE = 2,
 * }
 *
 * // String enum check
 * isValidEnum('ADMIN', UserRole) // true
 * isValidEnum('GUEST', UserRole) // false
 *
 * // Numeric enum check
 * isValidEnum(1, Status) // true
 * isValidEnum(3, Status) // false
 *
 * // Type narrowing
 * const role: unknown = getRoleFromApi();
 * if (isValidEnum(role, UserRole)) {
 *   // role is typed as UserRole here
 *   switch (role) {
 *     case UserRole.ADMIN:
 *       // ...
 *   }
 * }
 * ```
 */
export function isValidEnum<T extends { [key: string]: string | number }>(
	value: unknown,
	enumObj: T,
): value is T[keyof T] {
	return Object.values(enumObj).includes(value as T[keyof T]);
}

/**
 * Type guard for checking if a value is an Error object.
 * Useful for error handling and type narrowing in catch blocks.
 *
 * @param value - The value to check
 * @returns true if the value is an Error instance, false otherwise
 *
 * @example
 * ```typescript
 * try {
 *   throw new Error('Something went wrong');
 * } catch (err) {
 *   if (isError(err)) {
 *     // err is typed as Error here
 *     console.error(err.message);
 *     console.error(err.stack);
 *   } else {
 *     // Handle non-Error thrown values
 *     console.error('Unknown error:', err);
 *   }
 * }
 *
 * // Custom error handling
 * function handleError(error: unknown) {
 *   if (isError(error)) {
 *     // Can safely access Error properties
 *     reportError(error.message);
 *   }
 * }
 * ```
 */
export function isError(value: unknown): value is Error {
	return value instanceof Error;
}

/**
 * Type guard for checking if a value is a Promise.
 * Useful for handling both synchronous and asynchronous operations.
 *
 * @param value - The value to check
 * @returns true if the value is a Promise, false otherwise
 *
 * @example
 * ```typescript
 * // Basic promise check
 * isPromise(Promise.resolve(42)) // true
 * isPromise(42) // false
 *
 * // Handling mixed return types
 * function processValue<T>(value: T | Promise<T>) {
 *   if (isPromise(value)) {
 *     // value is typed as Promise<T> here
 *     return value.then(processSync);
 *   } else {
 *     // value is typed as T here
 *     return processSync(value);
 *   }
 * }
 *
 * // Type narrowing in async context
 * async function handleResult(result: unknown) {
 *   if (isPromise<string>(result)) {
 *     // result is typed as Promise<string> here
 *     const value = await result;
 *     console.log(value.toUpperCase());
 *   }
 * }
 * ```
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
	return value instanceof Promise;
}

/**
 * Type guard for checking if a string is a valid URL.
 * Uses the built-in URL constructor for validation.
 *
 * @param value - The value to check
 * @returns true if the value is a string containing a valid URL, false otherwise
 *
 * @example
 * ```typescript
 * // Basic URL validation
 * isValidUrl('https://example.com') // true
 * isValidUrl('not-a-url') // false
 * isValidUrl(123) // false
 *
 * // With query parameters and path
 * isValidUrl('https://api.example.com/users?page=1') // true
 *
 * // Different protocols
 * isValidUrl('http://localhost:3000') // true
 * isValidUrl('ftp://files.example.com') // true
 *
 * // Invalid URLs
 * isValidUrl('http://') // false
 * isValidUrl('example.com') // false (missing protocol)
 * ```
 */
export function isValidUrl(value: unknown): value is string {
	if (typeof value !== 'string') return false;
	try {
		new URL(value);
		return true;
	} catch {
		return false;
	}
}
