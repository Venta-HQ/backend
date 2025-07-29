export interface EventMessage {
	data: any;
	messageId?: string;
	timestamp: string;
	type: string;
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
	durableName?: string;
	ackPolicy?: 'explicit' | 'all' | 'none';
}

export interface IEventsService {
	healthCheck(): Promise<{ connected: boolean; status: string }>;
	publishEvent<T>(eventType: string, data: T): Promise<void>;
	subscribeToEventType(eventType: string, callback: (event: EventMessage) => void): Promise<any>;
	subscribeToEvents(callback: (event: EventMessage) => void): Promise<void>;
	subscribeToStream(options: StreamSubscriptionOptions, callback: (event: EventMessage) => void): Promise<EventStream>;
	unsubscribeFromStream(stream: EventStream): Promise<void>;
	getActiveStreams(): EventStream[];
}
