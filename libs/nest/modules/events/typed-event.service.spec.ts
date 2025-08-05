import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { RequestContextService } from '../request-context';
import { EventService } from './typed-event.service';

describe('EventService', () => {
	let service: EventService;
	let mockNatsClient: any;
	let mockRequestContextService: any;

	beforeEach(async () => {
		mockNatsClient = {
			emit: vi.fn().mockResolvedValue(undefined),
		} as any;

		mockRequestContextService = {
			get: vi.fn(),
		} as any;

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				EventService,
				{
					provide: 'NATS_SERVICE',
					useValue: mockNatsClient,
				},
				{
					provide: RequestContextService,
					useValue: mockRequestContextService,
				},
			],
		}).compile();

		service = module.get<EventService>(EventService);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('emit', () => {
		const mockVendor = {
			createdAt: new Date('2024-01-01'),
			description: 'Test Description',
			email: 'test@example.com',
			id: 'vendor-123',
			lat: 40.7128,
			long: -74.006,
			name: 'Test Vendor',
			open: true,
			phone: '+1234567890',
			primaryImage: 'https://example.com/image.jpg',
			updatedAt: new Date('2024-01-01'),
			website: 'https://example.com',
		};

		it('should emit vendor.created event successfully', async () => {
			mockRequestContextService.get.mockImplementation((key: string) => {
				if (key === 'requestId') return 'req-123';
				return undefined;
			});

			// Manually set the requestContextService since it's optional
			(service as any).requestContextService = mockRequestContextService;

			await service.emit('vendor.created', mockVendor);

			expect(mockNatsClient.emit).toHaveBeenCalledWith('vendor.created', {
				correlationId: 'req-123',
				data: mockVendor,
				eventId: expect.any(String),
				source: expect.any(String),
				timestamp: expect.any(String),
				version: '1.0',
			});
		});

		it('should emit vendor.updated event successfully', async () => {
			mockRequestContextService.get.mockImplementation((key: string) => {
				if (key === 'requestId') return 'req-456';
				return undefined;
			});

			// Manually set the requestContextService since it's optional
			(service as any).requestContextService = mockRequestContextService;

			await service.emit('vendor.updated', mockVendor);

			expect(mockNatsClient.emit).toHaveBeenCalledWith('vendor.updated', {
				correlationId: 'req-456',
				data: mockVendor,
				eventId: expect.any(String),
				source: expect.any(String),
				timestamp: expect.any(String),
				version: '1.0',
			});
		});

		it('should emit vendor.deleted event successfully', async () => {
			mockRequestContextService.get.mockImplementation((key: string) => {
				if (key === 'requestId') return 'req-789';
				return undefined;
			});

			// Manually set the requestContextService since it's optional
			(service as any).requestContextService = mockRequestContextService;

			await service.emit('vendor.deleted', mockVendor);

			expect(mockNatsClient.emit).toHaveBeenCalledWith('vendor.deleted', {
				correlationId: 'req-789',
				data: mockVendor,
				eventId: expect.any(String),
				source: expect.any(String),
				timestamp: expect.any(String),
				version: '1.0',
			});
		});

		it('should emit vendor.updated event successfully', async () => {
			mockRequestContextService.get.mockImplementation((key: string) => {
				if (key === 'requestId') return 'req-location';
				return undefined;
			});

			// Manually set the requestContextService since it's optional
			(service as any).requestContextService = mockRequestContextService;

			const locationData = {
				id: 'vendor-123',
				lat: 40.7128,
				long: -74.006,
			};

			await service.emit('vendor.updated', locationData);

			expect(mockNatsClient.emit).toHaveBeenCalledWith('vendor.updated', {
				correlationId: 'req-location',
				data: locationData,
				eventId: expect.any(String),
				source: expect.any(String),
				timestamp: expect.any(String),
				version: '1.0',
			});
		});

		it('should use metadata correlationId when provided', async () => {
			const metadata = {
				correlationId: 'custom-correlation-id',
				source: 'custom-source',
				version: '2.0',
			};

			await service.emit('vendor.created', mockVendor, metadata);

			expect(mockNatsClient.emit).toHaveBeenCalledWith('vendor.created', {
				correlationId: 'custom-correlation-id',
				data: mockVendor,
				eventId: expect.any(String),
				source: 'custom-source',
				timestamp: expect.any(String),
				version: '2.0',
			});
		});

		it('should fallback to request context correlationId when metadata not provided', async () => {
			mockRequestContextService.get.mockImplementation((key: string) => {
				if (key === 'requestId') return 'req-context-id';
				return undefined;
			});

			// Manually set the requestContextService since it's optional
			(service as any).requestContextService = mockRequestContextService;

			await service.emit('vendor.created', mockVendor);

			expect(mockNatsClient.emit).toHaveBeenCalledWith('vendor.created', {
				correlationId: 'req-context-id',
				data: mockVendor,
				eventId: expect.any(String),
				source: expect.any(String),
				timestamp: expect.any(String),
				version: '1.0',
			});
		});

		it('should handle undefined request context gracefully', async () => {
			mockRequestContextService.get.mockReturnValue(undefined);

			await service.emit('vendor.created', mockVendor);

			expect(mockNatsClient.emit).toHaveBeenCalledWith('vendor.created', {
				correlationId: undefined,
				data: mockVendor,
				eventId: expect.any(String),
				source: expect.any(String),
				timestamp: expect.any(String),
				version: '1.0',
			});
		});

		it('should generate unique event IDs for each emission', async () => {
			mockRequestContextService.get.mockReturnValue('req-123');

			await service.emit('vendor.created', mockVendor);
			await service.emit('vendor.updated', mockVendor);

			const calls = mockNatsClient.emit.mock.calls;
			expect(calls).toHaveLength(2);

			const eventId1 = calls[0][1].eventId;
			const eventId2 = calls[1][1].eventId;

			expect(eventId1).not.toBe(eventId2);
			expect(typeof eventId1).toBe('string');
			expect(typeof eventId2).toBe('string');
		});

		it('should use service name from environment or default', async () => {
			mockRequestContextService.get.mockImplementation((key: string) => {
				if (key === 'requestId') return 'req-123';
				return undefined;
			});

			// Manually set the requestContextService since it's optional
			(service as any).requestContextService = mockRequestContextService;

			await service.emit('vendor.created', mockVendor);

			const emittedEvent = mockNatsClient.emit.mock.calls[0][1];
			expect(emittedEvent.source).toBe('unknown-service'); // Default when SERVICE_NAME not set
		});

		it('should validate data against schema when schema exists', async () => {
			mockRequestContextService.get.mockImplementation((key: string) => {
				if (key === 'requestId') return 'req-123';
				return undefined;
			});

			// Manually set the requestContextService since it's optional
			(service as any).requestContextService = mockRequestContextService;

			// This should pass validation since mockVendor matches the schema
			await service.emit('vendor.created', mockVendor);

			expect(mockNatsClient.emit).toHaveBeenCalled();
		});

		it('should handle validation errors gracefully', async () => {
			mockRequestContextService.get.mockImplementation((key: string) => {
				if (key === 'requestId') return 'req-123';
				return undefined;
			});

			// Manually set the requestContextService since it's optional
			(service as any).requestContextService = mockRequestContextService;

			// Invalid data that doesn't match schema
			const invalidData = {
				id: 123, // Should be string
				name: null, // Should be string
			};

			await expect(service.emit('vendor.created', invalidData as any)).rejects.toThrow();
		});

		it('should handle NATS client errors', async () => {
			mockRequestContextService.get.mockImplementation((key: string) => {
				if (key === 'requestId') return 'req-123';
				return undefined;
			});

			// Manually set the requestContextService since it's optional
			(service as any).requestContextService = mockRequestContextService;
			mockNatsClient.emit.mockRejectedValue(new Error('NATS connection failed'));

			await expect(service.emit('vendor.created', mockVendor)).rejects.toThrow('NATS connection failed');
		});

		it('should handle unknown event subjects gracefully', async () => {
			mockRequestContextService.get.mockImplementation((key: string) => {
				if (key === 'requestId') return 'req-123';
				return undefined;
			});

			// Manually set the requestContextService since it's optional
			(service as any).requestContextService = mockRequestContextService;

			// This should work even if the subject doesn't have a schema
			await service.emit('unknown.event' as any, { test: 'data' });

			expect(mockNatsClient.emit).toHaveBeenCalledWith('unknown.event', {
				correlationId: 'req-123',
				data: { test: 'data' },
				eventId: expect.any(String),
				source: expect.any(String),
				timestamp: expect.any(String),
				version: '1.0',
			});
		});
	});

	describe('event structure validation', () => {
		it('should create events with correct structure', async () => {
			mockRequestContextService.get.mockImplementation((key: string) => {
				if (key === 'requestId') return 'req-123';
				return undefined;
			});

			// Manually set the requestContextService since it's optional
			(service as any).requestContextService = mockRequestContextService;

			await service.emit('vendor.created', {
				createdAt: new Date('2024-01-01'),
				description: 'Test Description',
				email: 'test@example.com',
				id: 'vendor-123',
				lat: 40.7128,
				long: -74.006,
				name: 'Test Vendor',
				open: true,
				phone: '+1234567890',
				primaryImage: 'https://example.com/image.jpg',
				updatedAt: new Date('2024-01-01'),
				website: 'https://example.com',
			});

			const emittedEvent = mockNatsClient.emit.mock.calls[0][1];

			expect(emittedEvent).toMatchObject({
				correlationId: 'req-123',
				data: expect.any(Object),
				eventId: expect.any(String),
				source: expect.any(String),
				timestamp: expect.any(String),
				version: '1.0',
			});

			// Verify timestamp is ISO string
			expect(new Date(emittedEvent.timestamp).toISOString()).toBe(emittedEvent.timestamp);
		});
	});
});
