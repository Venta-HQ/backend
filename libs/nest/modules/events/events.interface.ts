import { Subscription } from 'nats';

export interface EventMessage<T = unknown> {
	data: T;
	messageId?: string;
	timestamp: string;
	type: string;
}

export interface EventStream {
	eventTypes: string[];
	streamName: string;
	subscription: Subscription;
}

export interface StreamSubscriptionOptions {
	ackPolicy?: 'explicit' | 'all' | 'none';
	eventTypes?: string[];
	groupName?: string;
	streamName?: string;
}

export interface IEventsService {
	getActiveStreams(): EventStream[];
	healthCheck(): Promise<{ connected: boolean; status: string }>;
	publishEvent<T>(eventType: string, data: T, options?: Partial<EventMessage<T>>): Promise<void>;
	subscribeToEventType(eventType: string, callback: (event: EventMessage) => void): Promise<Subscription>;
	subscribeToEvents(callback: (event: EventMessage) => void): Promise<void>;
	subscribeToStream(options: StreamSubscriptionOptions, callback: (event: EventMessage) => void): Promise<EventStream>;
	unsubscribeFromStream(stream: EventStream): Promise<void>;
}
