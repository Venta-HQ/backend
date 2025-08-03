export interface EventMessage {
	data: any;
	timestamp: string;
	type: string;
	messageId?: string;
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

export interface IEventsService {
	healthCheck(): Promise<{ connected: boolean; status: string }>;
	publishEvent<T>(eventType: string, data: T, options?: Partial<EventMessage>): Promise<void>;
	subscribeToEventType(eventType: string, callback: (event: EventMessage) => void): Promise<any>;
	subscribeToEvents(callback: (event: EventMessage) => void): Promise<void>;
	subscribeToStream(options: StreamSubscriptionOptions, callback: (event: EventMessage) => void): Promise<EventStream>;
	unsubscribeFromStream(stream: EventStream): Promise<void>;
	getActiveStreams(): EventStream[];
} 