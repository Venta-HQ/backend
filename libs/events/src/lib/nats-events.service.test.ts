import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EventMessage, EventStream } from './events.interface';
import { NatsEventsService } from './nats-events.service';

// Mock NATS
vi.mock('nats', () => ({
	connect: vi.fn(),
	StringCodec: vi.fn(() => ({
		encode: vi.fn((data) => Buffer.from(data)),
		decode: vi.fn((data) => data.toString()),
	})),
}));

describe('NatsEventsService', () => {
	let service: NatsEventsService;
	let mockNatsConnection: any;
	let mockSubscription: any;
	let mockConfigService: any;

	beforeEach(async () => {
		// Create mock NATS connection with async iterable subscription
		mockSubscription = {
			unsubscribe: vi.fn(),
			[Symbol.asyncIterator]: () => ({
				next: () => Promise.resolve({ done: true, value: undefined }),
			}),
		};

		mockNatsConnection = {
			publish: vi.fn(),
			subscribe: vi.fn(() => mockSubscription),
			closed: vi.fn(() => false),
			close: vi.fn(),
		};

		// Create mock config service
		mockConfigService = {
			get: vi.fn((key: string, defaultValue?: string) => {
				if (key === 'NATS_URL') return 'nats://localhost:4222';
				return defaultValue;
			}),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				NatsEventsService,
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
			],
		}).compile();

		service = module.get<NatsEventsService>(NatsEventsService);

		// Mock the connect method to return our mock connection
		const { connect } = await import('nats');
		vi.mocked(connect).mockResolvedValue(mockNatsConnection);

		// Manually set the connection to avoid initialization issues
		(service as any).nc = mockNatsConnection;
	});

	afterEach(async () => {
		vi.clearAllMocks();
	});

	describe('publishEvent', () => {
		it('should publish an event successfully', async () => {
			const eventData = { id: '123', name: 'Test Vendor' };
			const eventType = 'vendor.created';

			await service.publishEvent(eventType, eventData);

			expect(mockNatsConnection.publish).toHaveBeenCalledWith('events.vendor.created', expect.any(Buffer));
		});

		it('should handle publish errors gracefully', async () => {
			vi.mocked(mockNatsConnection.publish).mockRejectedValue(new Error('Publish failed'));

			const eventData = { id: '123', name: 'Test Vendor' };
			const eventType = 'vendor.created';

			await expect(service.publishEvent(eventType, eventData)).rejects.toThrow('Publish failed');
		});
	});

	describe('subscribeToStream', () => {
		it('should create a stream subscription successfully', async () => {
			const options = {
				streamName: 'test-stream',
				eventTypes: ['vendor.created', 'vendor.updated'],
				groupName: 'test-group',
			};

			const callback = vi.fn();

			const stream = await service.subscribeToStream(options, callback);

			expect(stream).toBeDefined();
			expect(stream.streamName).toBe('test-stream');
			expect(stream.eventTypes).toEqual(['vendor.created', 'vendor.updated']);
			expect(mockNatsConnection.subscribe).toHaveBeenCalledWith('events.vendor.created.vendor.updated', {
				queue: 'test-group',
			});
		});

		it('should create stream with wildcard event types', async () => {
			const options = {
				streamName: 'wildcard-stream',
				eventTypes: ['*'],
			};

			const callback = vi.fn();

			const stream = await service.subscribeToStream(options, callback);

			expect(stream.eventTypes).toEqual(['*']);
			expect(mockNatsConnection.subscribe).toHaveBeenCalledWith('events.*', { queue: 'default-group' });
		});

		it('should use default stream name if not provided', async () => {
			const options = {
				eventTypes: ['vendor.created'],
			};

			const callback = vi.fn();

			const stream = await service.subscribeToStream(options, callback);

			expect(stream.streamName).toBe('default-stream');
		});
	});

	describe('unsubscribeFromStream', () => {
		it('should unsubscribe from stream successfully', async () => {
			const stream: EventStream = {
				streamName: 'test-stream',
				eventTypes: ['vendor.created'],
				subscription: mockSubscription,
			};

			await service.unsubscribeFromStream(stream);

			expect(mockSubscription.unsubscribe).toHaveBeenCalled();
		});

		it('should handle unsubscribe errors gracefully', async () => {
			vi.mocked(mockSubscription.unsubscribe).mockImplementation(() => {
				throw new Error('Unsubscribe failed');
			});

			const stream: EventStream = {
				streamName: 'test-stream',
				eventTypes: ['vendor.created'],
				subscription: mockSubscription,
			};

			// Should throw error
			await expect(service.unsubscribeFromStream(stream)).rejects.toThrow('Unsubscribe failed');
		});
	});

	describe('getActiveStreams', () => {
		it('should return active streams', async () => {
			const options = {
				streamName: 'test-stream',
				eventTypes: ['vendor.created'],
			};

			const callback = vi.fn();

			await service.subscribeToStream(options, callback);

			const activeStreams = service.getActiveStreams();

			expect(activeStreams).toHaveLength(1);
			expect(activeStreams[0].streamName).toBe('test-stream');
		});
	});

	describe('healthCheck', () => {
		it('should return healthy status when connected', async () => {
			vi.mocked(mockNatsConnection.closed).mockReturnValue(false);

			const health = await service.healthCheck();

			expect(health.connected).toBe(true);
			expect(health.status).toBe('connected');
		});

		it('should return unhealthy status when disconnected', async () => {
			vi.mocked(mockNatsConnection.closed).mockReturnValue(true);

			const health = await service.healthCheck();

			expect(health.connected).toBe(false);
			expect(health.status).toBe('disconnected');
		});
	});

	describe('module lifecycle', () => {
		it('should clean up streams on module destroy', async () => {
			const options = {
				streamName: 'test-stream',
				eventTypes: ['vendor.created'],
			};

			const callback = vi.fn();

			await service.subscribeToStream(options, callback);

			// Verify stream is active
			expect(service.getActiveStreams()).toHaveLength(1);

			// Destroy module
			await service.onModuleDestroy();

			// Verify streams are cleaned up
			expect(service.getActiveStreams()).toHaveLength(0);
			expect(mockNatsConnection.close).toHaveBeenCalled();
		});
	});
});
