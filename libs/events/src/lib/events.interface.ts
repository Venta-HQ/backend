export interface EventMessage {
	data: any;
	timestamp: string;
	type: string;
	messageId?: string;
	// Event sourcing fields
	aggregateId?: string; // For domain events (e.g., user ID, vendor ID)
	aggregateType?: string; // Type of aggregate (e.g., 'user', 'vendor')
	version?: number; // Event version for optimistic concurrency
	correlationId?: string; // For tracing related events
	causationId?: string; // ID of the event that caused this event
	userId?: string; // Who triggered the event
	metadata?: Record<string, any>; // Additional context
}

export interface EventStream {
	streamName: string;
	eventTypes: string[];
	subscription: any;
}

export interface StreamSubscriptionOptions {
	streamName?: string;
	eventTypes?: string[];
	groupName?: string;
	ackPolicy?: 'explicit' | 'all' | 'none';
}

// Event sourcing specific interfaces
export interface EventSourcingOptions {
	enableAuditLog?: boolean;
	enableEventReplay?: boolean;
	enableStateReconstruction?: boolean;
	eventRetentionDays?: number;
}

export interface AggregateEvent {
	aggregateId: string;
	aggregateType: string;
	version: number;
	events: EventMessage[];
}

export interface EventReplayOptions {
	aggregateId?: string;
	aggregateType?: string;
	fromTimestamp?: string;
	toTimestamp?: string;
	eventTypes?: string[];
	limit?: number;
}

export interface IEventsService {
	healthCheck(): Promise<{ connected: boolean; status: string }>;
	publishEvent<T>(eventType: string, data: T, options?: Partial<EventMessage>): Promise<void>;
	subscribeToEventType(eventType: string, callback: (event: EventMessage) => void): Promise<any>;
	subscribeToEvents(callback: (event: EventMessage) => void): Promise<void>;
	subscribeToStream(options: StreamSubscriptionOptions, callback: (event: EventMessage) => void): Promise<EventStream>;
	unsubscribeFromStream(stream: EventStream): Promise<void>;
	getActiveStreams(): EventStream[];

	// Event sourcing methods
	getEventsForAggregate(aggregateId: string, aggregateType: string): Promise<EventMessage[]>;
	replayEvents(options: EventReplayOptions): Promise<EventMessage[]>;
	getEventHistory(aggregateId?: string, aggregateType?: string): Promise<EventMessage[]>;
	reconstructState<T>(
		aggregateId: string,
		aggregateType: string,
		initialState: T,
		reducer: (state: T, event: EventMessage) => T,
	): Promise<T>;
}
