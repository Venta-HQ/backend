import { z } from 'zod';

/**
 * Event registry entry that maps a subject to its schema
 */
export interface EventRegistryEntry<T = any> {
	schema: z.ZodSchema<T>;
	subject: string;
}

/**
 * Type-safe event registry
 */
export class EventRegistry {
	private events = new Map<string, EventRegistryEntry>();

	/**
	 * Register an event with its schema
	 */
	register<T>(subject: string, schema: z.ZodSchema<T>): void {
		this.events.set(subject, { schema, subject });
	}

	/**
	 * Get the schema for a subject
	 */
	getSchema(subject: string): z.ZodSchema | undefined {
		return this.events.get(subject)?.schema;
	}

	/**
	 * Get all registered subjects
	 */
	getSubjects(): string[] {
		return Array.from(this.events.keys());
	}

	/**
	 * Check if a subject is registered
	 */
	hasSubject(subject: string): boolean {
		return this.events.has(subject);
	}
}

/**
 * Global event registry instance
 */
export const eventRegistry = new EventRegistry();

/**
 * Type that represents all registered event subjects
 * This will be automatically populated as events are registered
 */
export type RegisteredEventSubjects = string;
