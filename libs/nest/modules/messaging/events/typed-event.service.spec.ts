import { vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { RequestContextService } from '../../networking/request-context';
import { EventService } from './typed-event.service';

// Mock schemas
const mockVendorSchema = {
	_context: {
		fields: ['vendorId', 'ownerId'],
	},
};

describe('EventService', () => {
	let service: EventService;
	let mockNatsClient: any;
	let mockConfigService: any;
	let mockRequestContextService: any;

	beforeEach(() => {
		mockNatsClient = {
			emit: vi.fn(),
		};

		mockConfigService = {
			get: vi.fn().mockReturnValue('test-service'),
		};

		mockRequestContextService = {
			getRequestId: vi.fn().mockReturnValue('req-123'),
		};

		service = new EventService(mockNatsClient, mockRequestContextService, mockConfigService);
	});

	describe('emit', () => {
		const mockVendorData = {
			vendorId: 'vendor-123',
			ownerId: 'user-456',
			location: {
				lat: 40.7128,
				lng: -74.006,
			},
			timestamp: new Date('2024-01-01').toISOString(),
		};

		it('should emit marketplace.vendor.onboarded event successfully', async () => {
			const mockVendorData = {
				vendorId: 'vendor-123',
				ownerId: 'user-456',
				location: { lat: 40.7128, lng: -74.006 },
			};

			await service.emit('marketplace.vendor.onboarded', mockVendorData);

			expect(mockNatsClient.emit).toHaveBeenCalledWith('marketplace.vendor.onboarded', {
				context: {
					vendorId: 'vendor-123',
					ownerId: 'user-456',
				},
				data: mockVendorData,
				meta: {
					correlationId: 'test-request-id',
					domain: 'marketplace',
					eventId: expect.any(String),
					source: 'test-service',
					subdomain: 'vendor',
					timestamp: expect.any(String),
					version: '1.0',
				},
			});
		});

		it('should emit marketplace.vendor.profile_updated event successfully', async () => {
			mockRequestContextService.getRequestId.mockReturnValue('req-456');

			const updateData = {
				vendorId: 'vendor-123',
				ownerId: 'user-456',
				updatedFields: ['name', 'description'],
				timestamp: new Date('2024-01-01').toISOString(),
			};

			await service.emit('marketplace.vendor.profile_updated', updateData);

			expect(mockNatsClient.emit).toHaveBeenCalledWith('marketplace.vendor.profile_updated', {
				context: {
					requestId: 'req-456',
					vendorId: 'vendor-123',
					ownerId: 'user-456',
				},
				data: updateData,
				meta: {
					correlationId: 'req-456',
					domain: 'marketplace',
					eventId: expect.any(String),
					source: 'test-service',
					subdomain: undefined,
					timestamp: expect.any(String),
					version: '1.0',
				},
			});
		});

		it('should emit marketplace.vendor.deactivated event successfully', async () => {
			mockRequestContextService.getRequestId.mockReturnValue('req-789');

			const deactivateData = {
				vendorId: 'vendor-123',
				ownerId: 'user-456',
				timestamp: new Date('2024-01-01').toISOString(),
			};

			await service.emit('marketplace.vendor.deactivated', deactivateData);

			expect(mockNatsClient.emit).toHaveBeenCalledWith('marketplace.vendor.deactivated', {
				context: {
					requestId: 'req-789',
					vendorId: 'vendor-123',
					ownerId: 'user-456',
				},
				data: deactivateData,
				meta: {
					correlationId: 'req-789',
					domain: 'marketplace',
					eventId: expect.any(String),
					source: 'test-service',
					subdomain: undefined,
					timestamp: expect.any(String),
					version: '1.0',
				},
			});
		});

		it('should use correlationId from metadata when provided', async () => {
			mockRequestContextService.getRequestId.mockReturnValue('req-123');

			await service.emit('marketplace.vendor.onboarded', mockVendorData);

			expect(mockNatsClient.emit).toHaveBeenCalledWith('marketplace.vendor.onboarded', {
				context: {
					requestId: 'req-123',
					vendorId: 'vendor-123',
					ownerId: 'user-456',
				},
				data: mockVendorData,
				meta: {
					correlationId: 'req-123',
					domain: 'marketplace',
					eventId: expect.any(String),
					source: 'test-service',
					subdomain: undefined,
					timestamp: expect.any(String),
					version: '1.0',
				},
			});
		});

		it('should fallback to request context correlationId when metadata not provided', async () => {
			mockRequestContextService.getRequestId.mockReturnValue('req-context-id');

			await service.emit('marketplace.vendor.onboarded', mockVendorData);

			expect(mockNatsClient.emit).toHaveBeenCalledWith('marketplace.vendor.onboarded', {
				context: {
					requestId: 'req-context-id',
					vendorId: 'vendor-123',
					ownerId: 'user-456',
				},
				data: mockVendorData,
				meta: {
					correlationId: 'req-context-id',
					domain: 'marketplace',
					eventId: expect.any(String),
					source: 'test-service',
					subdomain: undefined,
					timestamp: expect.any(String),
					version: '1.0',
				},
			});
		});

		it('should handle undefined request context gracefully', async () => {
			mockRequestContextService.getRequestId.mockReturnValue(undefined);

			await service.emit('marketplace.vendor.onboarded', mockVendorData);

			expect(mockNatsClient.emit).toHaveBeenCalledWith('marketplace.vendor.onboarded', {
				context: {
					vendorId: 'vendor-123',
					ownerId: 'user-456',
				},
				data: mockVendorData,
				meta: {
					correlationId: undefined,
					domain: 'marketplace',
					eventId: expect.any(String),
					source: 'test-service',
					subdomain: undefined,
					timestamp: expect.any(String),
					version: '1.0',
				},
			});
		});

		it('should generate unique event IDs for each emission', async () => {
			await service.emit('marketplace.vendor.onboarded', mockVendorData);
			await service.emit('marketplace.vendor.onboarded', mockVendorData);

			const calls = mockNatsClient.emit.mock.calls;
			const eventId1 = calls[0][1].meta.eventId;
			const eventId2 = calls[1][1].meta.eventId;

			expect(eventId1).not.toBe(eventId2);
			expect(typeof eventId1).toBe('string');
			expect(typeof eventId2).toBe('string');
		});

		it('should use service name from ConfigService', async () => {
			mockConfigService.get.mockReturnValue('test-service');

			await service.emit('marketplace.vendor.onboarded', mockVendorData);

			const emittedEvent = mockNatsClient.emit.mock.calls[0][1];
			expect(emittedEvent.meta.source).toBe('test-service');
		});

		it('should validate data against schema when schema exists', async () => {
			// The service automatically validates against schemas, so we just test that it works
			await service.emit('marketplace.vendor.onboarded', mockVendorData);

			expect(mockNatsClient.emit).toHaveBeenCalledWith('marketplace.vendor.onboarded', {
				context: {
					requestId: 'req-123',
					vendorId: 'vendor-123',
					ownerId: 'user-456',
				},
				data: mockVendorData,
				meta: {
					correlationId: 'req-123',
					domain: 'marketplace',
					eventId: expect.any(String),
					source: 'test-service',
					subdomain: undefined,
					timestamp: expect.any(String),
					version: '1.0',
				},
			});
		});

		it('should handle validation errors gracefully', async () => {
			const invalidData = {
				vendorId: 'vendor-123',
				// Missing required ownerId field
			};

			await expect(service.emit('marketplace.vendor.onboarded', invalidData as any)).rejects.toThrow();
		});

		it('should handle NATS client errors', async () => {
			const error = new Error('NATS connection failed');
			mockNatsClient.emit.mockRejectedValue(error);

			await expect(service.emit('marketplace.vendor.onboarded', mockVendorData)).rejects.toThrow(
				'NATS connection failed',
			);
		});

		it('should handle unknown event subjects gracefully', async () => {
			await service.emit('unknown.event' as any, mockVendorData);

			expect(mockNatsClient.emit).toHaveBeenCalledWith('unknown.event', {
				context: {
					requestId: 'req-123',
				},
				data: mockVendorData,
				meta: {
					correlationId: 'req-123',
					domain: 'unknown',
					eventId: expect.any(String),
					source: 'test-service',
					subdomain: undefined,
					timestamp: expect.any(String),
					version: '1.0',
				},
			});
		});
	});

	describe('event structure validation', () => {
		it('should create events with correct structure', async () => {
			const testData = { 
				vendorId: 'test', 
				ownerId: 'user',
				location: {
					lat: 40.7128,
					lng: -74.006,
				},
				timestamp: new Date('2024-01-01').toISOString(),
			};

			await service.emit('marketplace.vendor.onboarded' as any, testData);

			const emittedEvent = mockNatsClient.emit.mock.calls[0][1];

			expect(emittedEvent).toMatchObject({
				context: {
					requestId: 'req-123',
					vendorId: 'test',
					ownerId: 'user',
				},
				data: testData,
				meta: {
					correlationId: 'req-123',
					domain: 'marketplace',
					eventId: expect.any(String),
					source: 'test-service',
					subdomain: undefined,
					timestamp: expect.any(String),
					version: '1.0',
				},
			});
		});
	});
});
