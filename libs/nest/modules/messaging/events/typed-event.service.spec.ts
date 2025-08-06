import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RequestContextService } from '../../networking/request-context';
import { EventService } from './typed-event.service';

describe('EventService', () => {
	let service: EventService;
	let mockNatsClient: any;
	let mockRequestContextService: any;
	let mockConfigService: any;

	beforeEach(async () => {
		mockNatsClient = {
			emit: vi.fn().mockResolvedValue(undefined),
		} as any;

		mockRequestContextService = {
			get: vi.fn(),
			getRequestId: vi.fn(),
		} as any;

		mockConfigService = {
			get: vi.fn().mockReturnValue('test-service'),
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
				{
					provide: ConfigService,
					useValue: mockConfigService,
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
			mockRequestContextService.getRequestId.mockReturnValue('req-123');

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
			mockRequestContextService.getRequestId.mockReturnValue('req-456');

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
			mockRequestContextService.getRequestId.mockReturnValue('req-789');

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
			mockRequestContextService.getRequestId.mockReturnValue('req-456');

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

		it('should use correlationId from metadata when provided', async () => {
			mockRequestContextService.getRequestId.mockReturnValue('req-123');

			// Manually set the requestContextService since it's optional
			(service as any).requestContextService = mockRequestContextService;

			await service.emit('vendor.created', mockVendor, {
				correlationId: 'custom-correlation-id',
			});

			expect(mockNatsClient.emit).toHaveBeenCalledWith('vendor.created', {
				correlationId: 'custom-correlation-id',
				data: mockVendor,
				eventId: expect.any(String),
				source: expect.any(String),
				timestamp: expect.any(String),
				version: '1.0',
			});
		});

		it('should fallback to request context correlationId when metadata not provided', async () => {
			mockRequestContextService.getRequestId.mockReturnValue('req-context-id');

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
			mockRequestContextService.getRequestId.mockReturnValue(undefined);

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
			mockRequestContextService.getRequestId.mockReturnValue('req-123');

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

		it('should use service name from ConfigService', async () => {
			mockRequestContextService.getRequestId.mockReturnValue('req-123');

			// Manually set the services since they're optional
			(service as any).requestContextService = mockRequestContextService;
			(service as any).configService = mockConfigService;
			// Update the appName since it was set in constructor
			(service as any).appName = mockConfigService.get('APP_NAME');

			await service.emit('vendor.created', mockVendor);

			const emittedEvent = mockNatsClient.emit.mock.calls[0][1];
			expect(emittedEvent.source).toBe('test-service');
		});

		it('should validate data against schema when schema exists', async () => {
			mockRequestContextService.getRequestId.mockReturnValue('req-123');

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

		it('should handle validation errors gracefully', async () => {
			mockRequestContextService.getRequestId.mockReturnValue('req-123');

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
			mockRequestContextService.getRequestId.mockReturnValue('req-123');

			// Manually set the requestContextService since it's optional
			(service as any).requestContextService = mockRequestContextService;

			mockNatsClient.emit.mockRejectedValue(new Error('NATS connection failed'));

			await expect(service.emit('vendor.created', mockVendor)).rejects.toThrow('NATS connection failed');
		});

		it('should handle unknown event subjects gracefully', async () => {
			mockRequestContextService.getRequestId.mockReturnValue('req-123');

			// Manually set the requestContextService since it's optional
			(service as any).requestContextService = mockRequestContextService;

			await service.emit('unknown.event' as any, mockVendor);

			expect(mockNatsClient.emit).toHaveBeenCalledWith('unknown.event', {
				correlationId: 'req-123',
				data: mockVendor,
				eventId: expect.any(String),
				source: expect.any(String),
				timestamp: expect.any(String),
				version: '1.0',
			});
		});
	});

	describe('event structure validation', () => {
		it('should create events with correct structure', async () => {
			mockRequestContextService.getRequestId.mockReturnValue('req-123');

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
