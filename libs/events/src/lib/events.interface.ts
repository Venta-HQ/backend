export interface EventMessage {
	data: any;
	messageId?: string;
	timestamp: string;
	type: string;
}

export interface IEventsService {
	healthCheck(): Promise<{ connected: boolean; status: string }>;
	publishEvent<T>(eventType: string, data: T): Promise<void>;
	subscribeToEventType(eventType: string, callback: (event: EventMessage) => void): Promise<any>;
	subscribeToEvents(callback: (event: EventMessage) => void): Promise<void>;
}
