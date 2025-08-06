/**
 * Base event interface that all events should extend
 */
export interface BaseEvent {
	correlationId?: string;
	data: any;
	eventId: string;
	source: string;
	timestamp: string;
	version: string;
}

/**
 * Event metadata for emission
 */
export interface EventMetadata {
	correlationId?: string;
	source?: string;
	version?: string;
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

/**
 * Event processing result
 */
export interface EventProcessingResult {
	duration: number;
	eventId: string;
	success: boolean;
	timestamp: string;
}
