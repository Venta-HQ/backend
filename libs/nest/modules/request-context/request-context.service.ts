import { Injectable, Scope } from '@nestjs/common';

/**
 * Request-scoped service for storing request-specific data
 * This service is scoped to each request and provides a key-value store
 * for request-specific context like request IDs, user info, etc.
 */
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
	private readonly context = new Map<string, unknown>();

	/**
	 * Set a value in the request context
	 * @param key The key to store the value under
	 * @param value The value to store
	 */
	set(key: string, value: unknown): void {
		this.context.set(key, value);
	}

	/**
	 * Get a value from the request context
	 * @param key The key to retrieve
	 * @returns The stored value or undefined if not found
	 */
	get(key: string): unknown {
		return this.context.get(key);
	}

	/**
	 * Get a typed value from the request context
	 * @param key The key to retrieve
	 * @returns The stored value cast to the specified type, or undefined if not found
	 */
	getTyped<T>(key: string): T | undefined {
		const value = this.context.get(key);
		return value as T | undefined;
	}

	/**
	 * Get a string value from the request context
	 * @param key The key to retrieve
	 * @returns The stored string value or undefined if not found or not a string
	 */
	getString(key: string): string | undefined {
		const value = this.context.get(key);
		return typeof value === 'string' ? value : undefined;
	}

	/**
	 * Check if a key exists in the request context
	 * @param key The key to check
	 * @returns True if the key exists, false otherwise
	 */
	has(key: string): boolean {
		return this.context.has(key);
	}

	/**
	 * Delete a key from the request context
	 * @param key The key to delete
	 * @returns True if the key was deleted, false if it didn't exist
	 */
	delete(key: string): boolean {
		return this.context.delete(key);
	}

	/**
	 * Clear all data from the request context
	 */
	clear(): void {
		this.context.clear();
	}

	/**
	 * Get all keys in the request context
	 * @returns Array of all keys
	 */
	keys(): string[] {
		return Array.from(this.context.keys());
	}

	/**
	 * Get all values in the request context
	 * @returns Array of all values
	 */
	values(): unknown[] {
		return Array.from(this.context.values());
	}

	/**
	 * Get all entries in the request context
	 * @returns Array of [key, value] pairs
	 */
	entries(): [string, unknown][] {
		return Array.from(this.context.entries());
	}

	/**
	 * Get the size of the request context
	 * @returns Number of entries
	 */
	size(): number {
		return this.context.size;
	}

	/**
	 * Get the request ID from context
	 * @returns The request ID or undefined if not found
	 */
	getRequestId(): string | undefined {
		return this.getString('requestId');
	}

	/**
	 * Get the correlation ID from context
	 * @returns The correlation ID or undefined if not found
	 */
	getCorrelationId(): string | undefined {
		return this.getString('correlationId');
	}

	/**
	 * Set the request ID in context
	 * @param requestId The request ID to store
	 */
	setRequestId(requestId: string): void {
		this.set('requestId', requestId);
	}

	/**
	 * Set the correlation ID in context
	 * @param correlationId The correlation ID to store
	 */
	setCorrelationId(correlationId: string): void {
		this.set('correlationId', correlationId);
	}
}
