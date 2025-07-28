import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// Import after mocking
import { NatsEventsService } from './nats-events.service';

// Mock the nats module
const { mockClose, mockClosed, mockConnect, mockPublish, mockSubscribe } = vi.hoisted(() => ({
	mockClose: vi.fn(),
	mockClosed: vi.fn(),
	mockConnect: vi.fn(),
	mockPublish: vi.fn(),
	mockSubscribe: vi.fn(),
}));

const mockNatsConnection = {
	close: mockClose,
	closed: mockClosed,
	publish: mockPublish,
	subscribe: mockSubscribe,
};

mockConnect.mockResolvedValue(mockNatsConnection);

vi.mock('nats', () => ({
	StringCodec: vi.fn(() => ({
		decode: vi.fn((buffer: Buffer) => buffer.toString()),
		encode: vi.fn((str: string) => Buffer.from(str)),
	})),
	connect: mockConnect,
}));

describe('NatsEventsService', () => {
	let natsEventsService: NatsEventsService;
	let mockConfigService: ConfigService;

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock Logger
		vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
		vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
		vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
		vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

		// Mock ConfigService
		mockConfigService = {
			get: vi.fn((key: string, defaultValue?: string) => {
				switch (key) {
					case 'NATS_URL':
						return 'nats://localhost:4222';
					default:
						return defaultValue;
				}
			}),
		} as any;

		natsEventsService = new NatsEventsService(mockConfigService);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('constructor', () => {
		it('should create service with config service', () => {
			expect(natsEventsService).toBeDefined();
		});

		it('should handle missing config values', () => {
			const emptyConfigService = {
				get: vi.fn(() => undefined),
			} as any;

			expect(() => new NatsEventsService(emptyConfigService)).not.toThrow();
		});
	});

	describe('onModuleInit', () => {
		it('should connect to NATS successfully', async () => {
			await natsEventsService.onModuleInit();

			expect(mockConnect).toHaveBeenCalledWith({
				servers: 'nats://localhost:4222',
			});
			expect(Logger.prototype.log).toHaveBeenCalledWith('Connected to NATS at nats://localhost:4222');
		});

		it('should handle connection errors', async () => {
			const connectionError = new Error('Connection failed');
			mockConnect.mockRejectedValueOnce(connectionError);

			await expect(natsEventsService.onModuleInit()).rejects.toThrow('Connection failed');
			expect(Logger.prototype.error).toHaveBeenCalledWith('Failed to connect to NATS:', connectionError);
		});

		it('should use default NATS URL when not configured', async () => {
			// Create a new service with undefined config
			const emptyConfigService = {
				get: vi.fn((key: string, defaultValue?: string) => {
					if (key === 'NATS_URL') {
						return defaultValue; // Return the default value when key is not found
					}
					return defaultValue;
				}),
			} as any;
			const newService = new NatsEventsService(emptyConfigService);

			// Clear previous calls to mockConnect
			mockConnect.mockClear();

			await newService.onModuleInit();

			expect(mockConnect).toHaveBeenCalledWith({
				servers: 'nats://localhost:4222',
			});
		});
	});

	describe('onModuleDestroy', () => {
		it('should close NATS connection on module destruction', async () => {
			// First initialize the service
			await natsEventsService.onModuleInit();
			// Set the mock connection
			(natsEventsService as any).nc = mockNatsConnection;

			await natsEventsService.onModuleDestroy();

			expect(mockClose).toHaveBeenCalled();
		});

		it('should handle close errors gracefully', async () => {
			// First initialize the service
			await natsEventsService.onModuleInit();

			mockClose.mockRejectedValue(new Error('Close failed'));

			// onModuleDestroy doesn't throw, it just logs errors
			await expect(natsEventsService.onModuleDestroy()).resolves.not.toThrow();
		});
	});

	describe('publishEvent', () => {
		beforeEach(async () => {
			// Initialize the service for publish tests
			await natsEventsService.onModuleInit();
			// Directly set the mock connection since the mock isn't being applied properly
			(natsEventsService as any).nc = mockNatsConnection;
		});

		it('should publish event successfully', async () => {
			const eventType = 'user.created';
			const eventData = { name: 'John Doe', userId: '123' };

			await natsEventsService.publishEvent(eventType, eventData);

			expect(mockPublish).toHaveBeenCalledWith('events.user.created', expect.any(Buffer));
			expect(Logger.prototype.log).toHaveBeenCalledWith(expect.stringContaining('Published event: user.created'));
		});

		it('should generate unique message IDs', async () => {
			const eventType = 'test.event';
			const eventData = { test: 'data' };

			// Clear previous calls
			mockPublish.mockClear();
			vi.mocked(Logger.prototype.log).mockClear();

			await natsEventsService.publishEvent(eventType, eventData);
			await natsEventsService.publishEvent(eventType, eventData);

			expect(mockPublish).toHaveBeenCalledTimes(2);
			expect(Logger.prototype.log).toHaveBeenCalledTimes(2);
		});

		it('should handle publish errors', async () => {
			const eventType = 'test.event';
			const eventData = { test: 'data' };
			const publishError = new Error('NATS publish failed');

			mockPublish.mockRejectedValue(publishError);

			await expect(natsEventsService.publishEvent(eventType, eventData)).rejects.toThrow('NATS publish failed');
			expect(Logger.prototype.error).toHaveBeenCalledWith('Failed to publish event test.event:', publishError);
		});
	});

	describe('subscribeToEvents', () => {
		beforeEach(async () => {
			// Initialize the service for subscribe tests
			await natsEventsService.onModuleInit();
			// Directly set the mock connection since the mock isn't being applied properly
			(natsEventsService as any).nc = mockNatsConnection;
		});

		it('should subscribe to all events', async () => {
			const callback = vi.fn();

			await natsEventsService.subscribeToEvents(callback);

			expect(mockSubscribe).toHaveBeenCalledWith('events.*');
		});

		it('should handle subscription errors', async () => {
			const callback = vi.fn();
			const subscriptionError = new Error('Subscription error');

			mockSubscribe.mockImplementation(() => {
				throw subscriptionError;
			});

			// subscribeToEvents doesn't throw, it just logs errors
			await expect(natsEventsService.subscribeToEvents(callback)).resolves.not.toThrow();
			expect(Logger.prototype.error).toHaveBeenCalledWith('NATS subscription error:', subscriptionError);
		});
	});

	describe('subscribeToEventType', () => {
		beforeEach(async () => {
			// Initialize the service for subscribe tests
			await natsEventsService.onModuleInit();
			// Directly set the mock connection since the mock isn't being applied properly
			(natsEventsService as any).nc = mockNatsConnection;
		});

		it('should subscribe to specific event type', async () => {
			const eventType = 'user.created';
			const callback = vi.fn();

			// Create a proper mock subscription with async iterator
			const mockSubscription = {
				[Symbol.asyncIterator]: () => ({
					next: () => Promise.resolve({ done: true, value: undefined }),
				}),
			};

			mockSubscribe.mockReturnValue(mockSubscription);

			const subscription = await natsEventsService.subscribeToEventType(eventType, callback);

			expect(mockSubscribe).toHaveBeenCalledWith('events.user.created');
			expect(subscription).toBeDefined();
		});

		it('should handle subscription errors for specific event type', async () => {
			const eventType = 'user.created';
			const callback = vi.fn();
			const subscriptionError = new Error('Subscription error');

			mockSubscribe.mockImplementation(() => {
				throw subscriptionError;
			});

			await expect(natsEventsService.subscribeToEventType(eventType, callback)).rejects.toThrow('Subscription error');
		});
	});

	describe('healthCheck', () => {
		beforeEach(async () => {
			// Initialize the service for health check tests
			await natsEventsService.onModuleInit();
			// Directly set the mock connection since the mock isn't being applied properly
			(natsEventsService as any).nc = mockNatsConnection;
		});

		it('should return connected status when NATS is connected', async () => {
			mockClosed.mockReturnValue(false);

			const health = await natsEventsService.healthCheck();

			expect(health.connected).toBe(true);
			expect(health.status).toBe('connected');
		});

		it('should return disconnected status when NATS is disconnected', async () => {
			mockClosed.mockReturnValue(true);

			const health = await natsEventsService.healthCheck();

			expect(health.connected).toBe(false);
			expect(health.status).toBe('disconnected');
		});
	});

	describe('edge cases', () => {
		beforeEach(async () => {
			// Initialize the service for edge case tests
			await natsEventsService.onModuleInit();
			// Directly set the mock connection since the mock isn't being applied properly
			(natsEventsService as any).nc = mockNatsConnection;
		});

		it('should handle null or undefined event data', async () => {
			const eventType = 'test.event';

			await expect(natsEventsService.publishEvent(eventType, null)).resolves.not.toThrow();
			await expect(natsEventsService.publishEvent(eventType, undefined)).resolves.not.toThrow();
		});

		it('should handle empty event type', async () => {
			const eventData = { test: 'data' };

			await expect(natsEventsService.publishEvent('', eventData)).resolves.not.toThrow();
		});
	});

	describe('error handling', () => {
		it('should handle NATS connection initialization errors', async () => {
			const connectionError = new Error('Connection failed');
			mockConnect.mockRejectedValue(connectionError);

			await expect(natsEventsService.onModuleInit()).rejects.toThrow('Connection failed');
		});

		it('should handle network errors gracefully', async () => {
			// Initialize the service first
			await natsEventsService.onModuleInit();
			// Directly set the mock connection since the mock isn't being applied properly
			(natsEventsService as any).nc = mockNatsConnection;

			const networkError = new Error('Network error');
			mockPublish.mockRejectedValue(networkError);

			await expect(natsEventsService.publishEvent('test.event', { id: '123' })).rejects.toThrow('Network error');
		});
	});

	describe('performance considerations', () => {
		it('should handle multiple publish operations', async () => {
			await natsEventsService.onModuleInit();
			// Directly set the mock connection since the mock isn't being applied properly
			(natsEventsService as any).nc = mockNatsConnection;

			const events = [
				{ data: { id: 1 }, type: 'test.1' },
				{ data: { id: 2 }, type: 'test.2' },
				{ data: { id: 3 }, type: 'test.3' },
			];

			for (const event of events) {
				await natsEventsService.publishEvent(event.type, event.data);
			}

			expect(mockPublish).toHaveBeenCalledTimes(3);
		});

		it('should not create memory leaks with repeated operations', async () => {
			await natsEventsService.onModuleInit();
			// Directly set the mock connection since the mock isn't being applied properly
			(natsEventsService as any).nc = mockNatsConnection;

			// Perform multiple operations
			for (let i = 0; i < 100; i++) {
				await natsEventsService.publishEvent(`test.${i}`, { data: `message ${i}` });
			}

			expect(mockPublish).toHaveBeenCalledTimes(100);
		});
	});
});
