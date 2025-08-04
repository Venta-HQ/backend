import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionHealthService } from './connection-health.service';

// Mock Redis
const mockRedis = {
	decr: vi.fn(),
	del: vi.fn(),
	expire: vi.fn(),
	get: vi.fn(),
	hgetall: vi.fn(),
	hset: vi.fn(),
	incr: vi.fn(),
	keys: vi.fn(),
	smembers: vi.fn(),
	ttl: vi.fn(),
	zadd: vi.fn(),
	zrem: vi.fn(),
};

// Mock EventsService
const mockEventsService = {
	publishEvent: vi.fn(),
};

describe('ConnectionHealthService', () => {
	let service: ConnectionHealthService;
	let module: TestingModule;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				ConnectionHealthService,
				{
					provide: 'default_IORedisModuleConnectionToken',
					useValue: mockRedis,
				},
				{
					provide: 'IEventsService',
					useValue: mockEventsService,
				},
			],
		}).compile();

		service = module.get<ConnectionHealthService>(ConnectionHealthService);

		// Ensure the service has access to the mocked dependencies
		(service as any).redis = mockRedis;
		(service as any).eventsService = mockEventsService;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('recordConnection', () => {
		it('should record user connection successfully', async () => {
			const socketId = 'socket-123';
			const userId = 'user-456';

			mockRedis.hset.mockResolvedValue(1);
			mockRedis.expire.mockResolvedValue(1);
			mockRedis.incr.mockResolvedValue(1);
			mockEventsService.publishEvent.mockResolvedValue(undefined);

			await service.recordConnection(socketId, userId);

			expect(mockRedis.hset).toHaveBeenCalledWith(`connection:${socketId}`, {
				connectedAt: expect.any(Number),
				lastActivity: expect.any(Number),
				socketId,
				type: 'user',
				userId,
				vendorId: '',
			});
			expect(mockRedis.expire).toHaveBeenCalledWith(`connection:${socketId}`, 86400);
			expect(mockRedis.incr).toHaveBeenCalledWith('metrics:connections:user:total');
			expect(mockRedis.incr).toHaveBeenCalledWith('metrics:connections:active');
			expect(mockRedis.incr).toHaveBeenCalledWith('metrics:connections:total');
			expect(mockEventsService.publishEvent).toHaveBeenCalledWith('websocket.connection', {
				socketId,
				timestamp: expect.any(String),
				type: 'user',
				userId,
				vendorId: undefined,
			});
		});

		it('should record vendor connection successfully', async () => {
			const socketId = 'socket-123';
			const vendorId = 'vendor-456';

			mockRedis.hset.mockResolvedValue(1);
			mockRedis.expire.mockResolvedValue(1);
			mockRedis.incr.mockResolvedValue(1);
			mockEventsService.publishEvent.mockResolvedValue(undefined);

			await service.recordConnection(socketId, undefined, vendorId);

			expect(mockRedis.hset).toHaveBeenCalledWith(`connection:${socketId}`, {
				connectedAt: expect.any(Number),
				lastActivity: expect.any(Number),
				socketId,
				type: 'vendor',
				userId: '',
				vendorId,
			});
			expect(mockRedis.incr).toHaveBeenCalledWith('metrics:connections:vendor:total');
		});

		it('should handle Redis errors gracefully', async () => {
			const socketId = 'socket-123';
			const userId = 'user-456';

			mockRedis.hset.mockRejectedValue(new Error('Redis error'));

			await expect(service.recordConnection(socketId, userId)).resolves.toBeUndefined();
		});
	});

	describe('recordDisconnection', () => {
		it('should record user disconnection successfully', async () => {
			const socketId = 'socket-123';
			const connectionData = {
				connectedAt: Date.now() - 60000, // 1 minute ago
				socketId,
				type: 'user',
				userId: 'user-456',
				vendorId: '',
			};

			mockRedis.hgetall.mockResolvedValue(connectionData);
			mockRedis.incr.mockResolvedValue(1);
			mockRedis.decr.mockResolvedValue(1);
			mockRedis.del.mockResolvedValue(1);
			mockEventsService.publishEvent.mockResolvedValue(undefined);

			await service.recordDisconnection(socketId);

			expect(mockRedis.hgetall).toHaveBeenCalledWith(`connection:${socketId}`);
			expect(mockRedis.incr).toHaveBeenCalledWith('metrics:disconnections:user:total');
			expect(mockRedis.incr).toHaveBeenCalledWith('metrics:disconnections:total');
			expect(mockRedis.decr).toHaveBeenCalledWith('metrics:connections:active');
			expect(mockRedis.del).toHaveBeenCalledWith(`connection:${socketId}`);
			expect(mockEventsService.publishEvent).toHaveBeenCalledWith('websocket.disconnection', {
				duration: expect.any(Number),
				socketId,
				timestamp: expect.any(String),
				type: 'user',
				userId: 'user-456',
				vendorId: '',
			});
		});

		it('should handle missing connection data', async () => {
			const socketId = 'socket-123';

			mockRedis.hgetall.mockResolvedValue({});

			await service.recordDisconnection(socketId);

			expect(mockRedis.hgetall).toHaveBeenCalledWith(`connection:${socketId}`);
			expect(mockRedis.incr).not.toHaveBeenCalled();
		});

		it('should handle Redis errors gracefully', async () => {
			const socketId = 'socket-123';

			mockRedis.hgetall.mockRejectedValue(new Error('Redis error'));

			await expect(service.recordDisconnection(socketId)).resolves.toBeUndefined();
		});
	});

	describe('recordError', () => {
		it('should record error successfully', async () => {
			const socketId = 'socket-123';
			const error = 'Test error';

			mockRedis.incr.mockResolvedValue(1);
			mockEventsService.publishEvent.mockResolvedValue(undefined);

			await service.recordError(socketId, error);

			expect(mockRedis.incr).toHaveBeenCalledWith('metrics:errors:total');
			expect(mockRedis.incr).toHaveBeenCalledWith('metrics:errors:last_hour');
			expect(mockEventsService.publishEvent).toHaveBeenCalledWith('websocket.error', {
				context: undefined,
				error,
				socketId,
				timestamp: expect.any(String),
			});
		});

		it('should record error with context', async () => {
			const socketId = 'socket-123';
			const error = 'Test error';
			const context = { userId: 'user-456' };

			mockRedis.incr.mockResolvedValue(1);
			mockEventsService.publishEvent.mockResolvedValue(undefined);

			await service.recordError(socketId, error, context);

			expect(mockEventsService.publishEvent).toHaveBeenCalledWith('websocket.error', {
				context,
				error,
				socketId,
				timestamp: expect.any(String),
			});
		});
	});

	describe('updateActivity', () => {
		it('should update last activity timestamp', async () => {
			const socketId = 'socket-123';

			mockRedis.hset.mockResolvedValue(1);

			await service.updateActivity(socketId);

			expect(mockRedis.hset).toHaveBeenCalledWith(`connection:${socketId}`, 'lastActivity', expect.any(Number));
		});
	});

	describe('getMetrics', () => {
		it('should return correct metrics', async () => {
			mockRedis.get
				.mockResolvedValueOnce('100') // totalConnections
				.mockResolvedValueOnce('50') // activeConnections
				.mockResolvedValueOnce('30') // userConnections
				.mockResolvedValueOnce('20') // vendorConnections
				.mockResolvedValueOnce('10') // disconnectionsLastHour
				.mockResolvedValueOnce('5') // errorsLastHour
				.mockResolvedValueOnce('30000') // avgUserDuration
				.mockResolvedValueOnce('25000'); // avgVendorDuration

			const result = await service.getMetrics();

			expect(result).toEqual({
				activeConnections: 50,
				avgConnectionDuration: 27500,
				disconnectionsLastHour: 10,
				errorsLastHour: 5,
				totalConnections: 100,
				userConnections: 30,
				vendorConnections: 20,
			});
		});

		it('should handle missing metrics gracefully', async () => {
			mockRedis.get.mockResolvedValue(null);

			const result = await service.getMetrics();

			expect(result).toEqual({
				activeConnections: 0,
				avgConnectionDuration: 0,
				disconnectionsLastHour: 0,
				errorsLastHour: 0,
				totalConnections: 0,
				userConnections: 0,
				vendorConnections: 0,
			});
		});

		it('should handle Redis errors gracefully', async () => {
			mockRedis.get.mockRejectedValue(new Error('Redis error'));

			const result = await service.getMetrics();

			expect(result).toEqual({
				activeConnections: 0,
				avgConnectionDuration: 0,
				disconnectionsLastHour: 0,
				errorsLastHour: 0,
				totalConnections: 0,
				userConnections: 0,
				vendorConnections: 0,
			});
		});
	});

	describe('getActiveConnections', () => {
		it('should return active connections for specific type', async () => {
			const keys = ['connection:socket1', 'connection:socket2'];
			const connectionData1 = { socketId: 'socket1', type: 'user' };
			const connectionData2 = { socketId: 'socket2', type: 'vendor' };

			mockRedis.keys.mockResolvedValue(keys);
			mockRedis.hgetall.mockResolvedValueOnce(connectionData1).mockResolvedValueOnce(connectionData2);

			const result = await service.getActiveConnections('user');

			expect(result).toEqual(['socket1']);
			expect(mockRedis.keys).toHaveBeenCalledWith('connection:*');
		});

		it('should return all active connections when type not specified', async () => {
			const keys = ['connection:socket1', 'connection:socket2'];
			const connectionData1 = { socketId: 'socket1', type: 'user' };
			const connectionData2 = { socketId: 'socket2', type: 'vendor' };

			mockRedis.keys.mockResolvedValue(keys);
			mockRedis.hgetall.mockResolvedValueOnce(connectionData1).mockResolvedValueOnce(connectionData2);

			const result = await service.getActiveConnections();

			expect(result).toEqual(['socket1', 'socket2']);
		});

		it('should handle Redis errors gracefully', async () => {
			mockRedis.keys.mockRejectedValue(new Error('Redis error'));

			const result = await service.getActiveConnections();

			expect(result).toEqual([]);
		});
	});

	describe('cleanupOldMetrics', () => {
		it('should cleanup old metrics successfully', async () => {
			const oldConnections = ['connection:socket1', 'connection:socket2'];
			const connectionData1 = { lastActivity: Date.now() - 90000000 }; // Very old
			const connectionData2 = { lastActivity: Date.now() - 1000000 }; // Recent

			mockRedis.del.mockResolvedValue(1);
			mockRedis.keys.mockResolvedValue(oldConnections);
			mockRedis.hgetall.mockResolvedValueOnce(connectionData1).mockResolvedValueOnce(connectionData2);

			await service.cleanupOldMetrics();

			expect(mockRedis.del).toHaveBeenCalledWith('metrics:disconnections:last_hour');
			expect(mockRedis.del).toHaveBeenCalledWith('metrics:errors:last_hour');
			expect(mockRedis.del).toHaveBeenCalledWith('connection:socket1'); // Old connection
			expect(mockRedis.del).not.toHaveBeenCalledWith('connection:socket2'); // Recent connection
		});
	});
});
