import { z } from 'zod';

/**
 * Base event interface that all events should extend
 */
export interface BaseEvent {
	context?: Record<string, any>;
	meta: {
		eventId: string;
		source: string;
		timestamp: string;
		version: string;
		correlationId?: string;
		domain?: string;
		subdomain?: string;
	};
	data: any;
}

/**
 * Context configuration for schema metadata
 */
export interface ContextConfig {
	fields: string[];
	extract?: (data: any) => Record<string, any>;
}

/**
 * Enhanced Zod schema with context support and fluent API
 */
export interface ContextSchema<T> extends z.ZodObject<any> {
	_context?: ContextConfig;
	withContext<Fields extends keyof T>(fields: Fields[]): ContextSchema<T>;
}

/**
 * Create an event schema with fluent API for adding context
 */
export function createEventSchema<T extends z.ZodRawShape>(shape: T): ContextSchema<z.infer<z.ZodObject<T>>> {
	const baseSchema = z.object(shape);
	const schema = baseSchema as unknown as ContextSchema<z.infer<z.ZodObject<T>>>;

	schema.withContext = function <Fields extends keyof z.infer<z.ZodObject<T>>>(
		fields: Fields[],
	): ContextSchema<z.infer<z.ZodObject<T>>> {
		this._context = { fields: fields as string[] };
		return this;
	};

	return schema;
}

/**
 * Event handler function type
 */
export type EventHandler<T = any> = (event: T) => Promise<void>;

/**
 * Queue handler configuration
 */
export interface QueueHandler {
	handler: EventHandler;
	subject: string;
}
