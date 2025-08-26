import { AsyncLocalStorage } from 'async_hooks';
import { Injectable } from '@nestjs/common';

/**
 * Singleton service for storing request-specific data using AsyncLocalStorage
 * This service uses Node.js AsyncLocalStorage to maintain request context
 * without requiring request-scoped dependency injection
 */
@Injectable()
export class RequestContextService {
	private readonly asyncLocalStorage = new AsyncLocalStorage<Map<string, unknown>>();

	/**
	 * Run a function within a new request context
	 * @param callback The function to run within the context
	 * @returns The result of the callback
	 */
	run<T>(callback: () => T): T {
		const context = new Map<string, unknown>();
		return this.asyncLocalStorage.run(context, callback);
	}

	/**
	 * Get the current context map or create one if none exists
	 * @returns The current context map
	 */
	private getContext(): Map<string, unknown> {
		const context = this.asyncLocalStorage.getStore();
		if (!context) {
			// If no context exists, return an empty map
			// This handles cases where methods are called outside of a request context
			return new Map<string, unknown>();
		}
		return context;
	}

	/**
	 * Set a value in the request context
	 * @param key The key to store the value under
	 * @param value The value to store
	 */
	set(key: string, value: unknown): void {
		const context = this.getContext();
		context.set(key, value);
	}

	/**
	 * Get a value from the request context
	 * @param key The key to retrieve
	 * @returns The stored value or undefined if not found
	 */
	get(key: string): unknown {
		const context = this.getContext();
		return context.get(key);
	}

	/**
	 * Get a typed value from the request context
	 * @param key The key to retrieve
	 * @returns The stored value cast to the specified type, or undefined if not found
	 */
	getTyped<T>(key: string): T | undefined {
		const value = this.get(key);
		return value as T | undefined;
	}

	/**
	 * Get a string value from the request context
	 * @param key The key to retrieve
	 * @returns The stored string value or undefined if not found or not a string
	 */
	getString(key: string): string | undefined {
		const value = this.get(key);
		return typeof value === 'string' ? value : undefined;
	}

	/**
	 * Check if a key exists in the request context
	 * @param key The key to check
	 * @returns True if the key exists, false otherwise
	 */
	has(key: string): boolean {
		const context = this.getContext();
		return context.has(key);
	}

	/**
	 * Delete a key from the request context
	 * @param key The key to delete
	 * @returns True if the key was deleted, false if it didn't exist
	 */
	delete(key: string): boolean {
		const context = this.getContext();
		return context.delete(key);
	}

	/**
	 * Clear all data from the request context
	 */
	clear(): void {
		const context = this.getContext();
		context.clear();
	}

	/**
	 * Get all keys in the request context
	 * @returns Array of all keys
	 */
	keys(): string[] {
		const context = this.getContext();
		return Array.from(context.keys());
	}

	/**
	 * Get all values in the request context
	 * @returns Array of all values
	 */
	values(): unknown[] {
		const context = this.getContext();
		return Array.from(context.values());
	}

	/**
	 * Get all entries in the request context
	 * @returns Array of [key, value] pairs
	 */
	entries(): [string, unknown][] {
		const context = this.getContext();
		return Array.from(context.entries());
	}

	/**
	 * Get the size of the request context
	 * @returns Number of entries
	 */
	size(): number {
		const context = this.getContext();
		return context.size;
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

	/**
	 * Get the user ID from context
	 * @returns The stored user ID or undefined if not found
	 */
	getUserId(): string | undefined {
		return this.getString('userId');
	}

	/**
	 * Set the user ID in context
	 * @param userId The user ID to store
	 */
	setUserId(userId: string): void {
		this.set('userId', userId);
	}

	/**
	 * Get the clerk ID from context
	 * @returns The stored clerk ID or undefined if not found
	 */
	getClerkId(): string | undefined {
		return this.getString('clerkId');
	}

	/**
	 * Set the clerk ID in context
	 * @param clerkId The clerk ID to store
	 */
	setClerkId(clerkId: string): void {
		this.set('clerkId', clerkId);
	}

	/**
	 * Set complete user context for WebSocket connections
	 * @param user User context with id and clerkId
	 * @param requestId Optional request ID, will generate one if not provided
	 */
	setUserContext(user: { id: string; clerkId: string }, requestId?: string): void {
		this.setUserId(user.id);
		this.setClerkId(user.clerkId);
		if (requestId) {
			this.setRequestId(requestId);
		}
	}

	/**
	 * Run a function within a WebSocket context with user information
	 * @param user The authenticated user context
	 * @param callback The function to run within the context
	 * @param requestId Optional request ID for correlation
	 * @returns The result of the callback
	 */
	runWithUser<T>(user: { id: string; clerkId: string }, callback: () => T, requestId?: string): T {
		return this.run(() => {
			this.setUserContext(user, requestId);
			return callback();
		});
	}
}
