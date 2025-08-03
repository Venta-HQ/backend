import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NatsEventsService } from './nats-events.service';
import { EventMessage, EventSourcingOptions } from './events.interface';

// Mock NATS
vi.mock('nats', () => {
	const mockNatsConnection = {
		publish: vi.fn().mockResolvedValue(undefined),
		subscribe: vi.fn().mockReturnValue({
			unsubscribe: vi.fn(),
		}),
		closed: vi.fn().mockReturnValue(false),
		close: vi.fn().mockResolvedValue(undefined),
	};

	const mockConnect = vi.fn().mockResolvedValue(mockNatsConnection);

	return {
		connect: mockConnect,
		StringCodec: vi.fn().mockReturnValue({
			encode: vi.fn().mockReturnValue(Buffer.from('test')),
			decode: vi.fn().mockReturnValue('{"test":"data"}'),
		}),
	};
});

describe('NatsEventsService - Event Sourcing', () => {
	let service: NatsEventsService;
	let configService: ConfigService;

	const mockEventSourcingOptions: EventSourcingOptions = {
		enableAuditLog: true,
		enableEventReplay: true,
		enableStateReconstruction: true,
		eventRetentionDays: 30,
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				NatsEventsService,
				{
					provide: ConfigService,
					useValue: {
						get: vi.fn().mockReturnValue('nats://localhost:4222'),
					},
				},
			],
		}).compile();

		service = module.get<NatsEventsService>(NatsEventsService);
		configService = module.get<ConfigService>(ConfigService);

		// Mock the NATS connection to avoid actual connection
		(service as any).nc = {
			publish: vi.fn().mockResolvedValue(undefined),
			subscribe: vi.fn().mockReturnValue({
				unsubscribe: vi.fn(),
			}),
			closed: vi.fn().mockReturnValue(false),
			close: vi.fn().mockResolvedValue(undefined),
		};
	});

	afterEach(async () => {
		vi.clearAllMocks();
	});

	describe('Event Sourcing with Aggregates', () => {
		it('should publish events with aggregate information', async () => {
			const eventData = { name: 'Test User', email: 'test@example.com' };
			const aggregateOptions = {
				aggregateId: 'user-123',
				aggregateType: 'user',
				userId: 'clerk-456',
				metadata: { source: 'clerk' },
			};

			await service.publishEvent('user.created', eventData, aggregateOptions);

			// Verify the event was stored for replay
			const events = await service.getEventsForAggregate('user-123', 'user');
			expect(events).toHaveLength(1);
			expect(events[0]).toMatchObject({
				type: 'user.created',
				aggregateId: 'user-123',
				aggregateType: 'user',
				version: 1,
				userId: 'clerk-456',
				data: eventData,
				metadata: { source: 'clerk' },
			});
		});

		it('should increment aggregate versions correctly', async () => {
			const eventData = { name: 'Test User' };
			const aggregateOptions = {
				aggregateId: 'user-123',
				aggregateType: 'user',
			};

			// Publish multiple events for the same aggregate
			await service.publishEvent('user.created', eventData, aggregateOptions);
			await service.publishEvent('user.updated', eventData, aggregateOptions);
			await service.publishEvent('user.deleted', eventData, aggregateOptions);

			const events = await service.getEventsForAggregate('user-123', 'user');
			expect(events).toHaveLength(3);
			expect(events[0].version).toBe(1);
			expect(events[1].version).toBe(2);
			expect(events[2].version).toBe(3);
		});

		it('should handle events without aggregate information', async () => {
			const eventData = { message: 'System event' };

			await service.publishEvent('system.notification', eventData);

			// Event should not be stored for replay
			const events = await service.getEventsForAggregate('user-123', 'user');
			expect(events).toHaveLength(0);
		});
	});

	describe('Event Replay', () => {
		beforeEach(async () => {
			// Set up test events
			await service.publishEvent('user.created', { name: 'User 1' }, {
				aggregateId: 'user-1',
				aggregateType: 'user',
				userId: 'clerk-1',
			});

			await service.publishEvent('user.updated', { name: 'User 1 Updated' }, {
				aggregateId: 'user-1',
				aggregateType: 'user',
				userId: 'clerk-1',
			});

			await service.publishEvent('vendor.created', { name: 'Vendor 1' }, {
				aggregateId: 'vendor-1',
				aggregateType: 'vendor',
				userId: 'clerk-2',
			});
		});

		it('should replay events for specific aggregate', async () => {
			const events = await service.replayEvents({
				aggregateId: 'user-1',
				aggregateType: 'user',
			});

			expect(events).toHaveLength(2);
			expect(events[0].type).toBe('user.created');
			expect(events[1].type).toBe('user.updated');
		});

		it('should filter events by type', async () => {
			const events = await service.replayEvents({
				eventTypes: ['user.created'],
			});

			expect(events).toHaveLength(1);
			expect(events[0].type).toBe('user.created');
		});

		it('should filter events by timestamp range', async () => {
			const now = new Date();
			const past = new Date(now.getTime() - 1000);
			const future = new Date(now.getTime() + 1000);

			const events = await service.replayEvents({
				fromTimestamp: past.toISOString(),
				toTimestamp: future.toISOString(),
			});

			expect(events.length).toBeGreaterThan(0);
		});

		it('should limit results', async () => {
			const events = await service.replayEvents({
				limit: 1,
			});

			expect(events).toHaveLength(1);
		});
	});

	describe('State Reconstruction', () => {
		beforeEach(async () => {
			// Set up events for state reconstruction
			await service.publishEvent('user.created', { name: 'John Doe', email: 'john@example.com' }, {
				aggregateId: 'user-1',
				aggregateType: 'user',
			});

			await service.publishEvent('user.updated', { name: 'John Smith', email: 'john@example.com' }, {
				aggregateId: 'user-1',
				aggregateType: 'user',
			});

			await service.publishEvent('user.updated', { name: 'John Smith', email: 'john.smith@example.com' }, {
				aggregateId: 'user-1',
				aggregateType: 'user',
			});
		});

		it('should reconstruct state from events', async () => {
			const initialState = { name: '', email: '' };

			const reducer = (state: any, event: EventMessage) => {
				switch (event.type) {
					case 'user.created':
					case 'user.updated':
						return { ...state, ...event.data };
					default:
						return state;
				}
			};

			const finalState = await service.reconstructState(
				'user-1',
				'user',
				initialState,
				reducer
			);

			expect(finalState).toEqual({
				name: 'John Smith',
				email: 'john.smith@example.com',
			});
		});

		it('should handle empty event history', async () => {
			const initialState = { name: '', email: '' };
			const reducer = (state: any, event: EventMessage) => state;

			const finalState = await service.reconstructState(
				'nonexistent-user',
				'user',
				initialState,
				reducer
			);

			expect(finalState).toEqual(initialState);
		});
	});

	describe('Event History', () => {
		beforeEach(async () => {
			// Set up test events
			await service.publishEvent('user.created', { name: 'User 1' }, {
				aggregateId: 'user-1',
				aggregateType: 'user',
			});

			await service.publishEvent('vendor.created', { name: 'Vendor 1' }, {
				aggregateId: 'vendor-1',
				aggregateType: 'vendor',
			});
		});

		it('should get events for specific aggregate', async () => {
			const events = await service.getEventHistory('user-1', 'user');
			expect(events).toHaveLength(1);
			expect(events[0].aggregateId).toBe('user-1');
			expect(events[0].aggregateType).toBe('user');
		});

		it('should get all events when no aggregate specified', async () => {
			const events = await service.getEventHistory();
			expect(events.length).toBeGreaterThanOrEqual(2);
		});

		it('should sort events by timestamp', async () => {
			const events = await service.getEventHistory();
			for (let i = 1; i < events.length; i++) {
				const prevTime = new Date(events[i - 1].timestamp).getTime();
				const currTime = new Date(events[i].timestamp).getTime();
				expect(prevTime).toBeLessThanOrEqual(currTime);
			}
		});
	});

	describe('Event Retention', () => {
		it('should respect event retention policy', async () => {
			// Create service with short retention
			const shortRetentionService = new NatsEventsService(
				configService,
				{ eventRetentionDays: 1 }
			);

			// Mock NATS connection for this service too
			(shortRetentionService as any).nc = {
				publish: vi.fn().mockResolvedValue(undefined),
				subscribe: vi.fn().mockReturnValue({
					unsubscribe: vi.fn(),
				}),
				closed: vi.fn().mockReturnValue(false),
				close: vi.fn().mockResolvedValue(undefined),
			};

			// Add old event (simulated)
			const oldEvent: EventMessage = {
				data: { name: 'Old User' },
				timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
				type: 'user.created',
				aggregateId: 'user-old',
				aggregateType: 'user',
			};

			// Manually add to store (simulating old event)
			(shortRetentionService as any).storeEventForReplay(oldEvent);

			// Add new event
			await shortRetentionService.publishEvent('user.created', { name: 'New User' }, {
				aggregateId: 'user-new',
				aggregateType: 'user',
			});

			const events = await shortRetentionService.getEventHistory();
			expect(events.length).toBe(1); // Only new event should remain
			expect(events[0].aggregateId).toBe('user-new');
		});
	});
}); 