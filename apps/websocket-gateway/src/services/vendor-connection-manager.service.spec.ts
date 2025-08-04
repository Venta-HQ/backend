import { VendorConnectionManagerService } from './vendor-connection-manager.service';
import { 
  mockEvents, 
  data,
  errors,
  clearMocks 
} from '../../../../test/helpers/test-utils';
import * as retryUtil from '@app/utils';

// Mock the retry utility
vi.mock('@app/utils', () => ({
  retryOperation: vi.fn().mockImplementation(async (operation: () => Promise<any>) => {
    return await operation();
  }),
}));

describe('VendorConnectionManagerService', () => {
  let service: VendorConnectionManagerService;
  let redis: any;
  let eventsService: any;

  beforeEach(() => {
    redis = {
      set: vi.fn(),
      get: vi.fn(),
      del: vi.fn(),
      sadd: vi.fn(),
      srem: vi.fn(),
      smembers: vi.fn(),
      zrem: vi.fn(),
    };
    eventsService = mockEvents();
    service = new VendorConnectionManagerService(redis, eventsService);
  });

  afterEach(() => {
    clearMocks();
  });

  describe('registerVendor', () => {
    it('should register vendor connection successfully', async () => {
      redis.set.mockResolvedValue('OK');
      eventsService.publishEvent.mockResolvedValue(undefined);

      await service.registerVendor('vendor-123', 'socket-123');

      expect(redis.set).toHaveBeenCalledWith('vendor:vendor-123:socketId', 'socket-123');
      expect(redis.set).toHaveBeenCalledWith('socket:socket-123:vendorId', 'vendor-123');
      expect(redis.set).toHaveBeenCalledWith(
        'vendor_connection:socket-123',
        expect.stringContaining('"socketId":"socket-123"')
      );
      expect(eventsService.publishEvent).toHaveBeenCalledWith('websocket.vendor.connected', {
        socketId: 'socket-123',
        timestamp: expect.any(String),
        vendorId: 'vendor-123',
      });
    });

    it('should handle Redis errors', async () => {
      const redisError = new Error('Redis connection failed');
      redis.set.mockRejectedValue(redisError);

      await expect(service.registerVendor('vendor-123', 'socket-123')).rejects.toThrow('Redis connection failed');
    });

    it('should handle event publishing errors', async () => {
      redis.set.mockResolvedValue('OK');
      const eventError = new Error('Event publishing failed');
      eventsService.publishEvent.mockRejectedValue(eventError);

      await expect(service.registerVendor('vendor-123', 'socket-123')).rejects.toThrow('Event publishing failed');
    });
  });

  describe('handleDisconnect', () => {
    it('should handle vendor disconnection successfully', async () => {
      const connectionInfo = {
        connectedAt: new Date(),
        socketId: 'socket-123',
        vendorId: 'vendor-123',
      };
      redis.get.mockResolvedValue(JSON.stringify(connectionInfo));
      redis.smembers.mockResolvedValue(['user-1', 'user-2', 'user-3']);
      redis.srem.mockResolvedValue(1);
      redis.del.mockResolvedValue(1);
      redis.zrem.mockResolvedValue(1);
      eventsService.publishEvent.mockResolvedValue(undefined);

      await service.handleDisconnect('socket-123');

      expect(redis.get).toHaveBeenCalledWith('vendor_connection:socket-123');
      expect(redis.smembers).toHaveBeenCalledWith('room:vendor-123:users');
      expect(redis.zrem).toHaveBeenCalledWith('vendor_locations', 'vendor-123');
      expect(redis.del).toHaveBeenCalledWith('vendor:vendor-123:socketId');
      expect(redis.del).toHaveBeenCalledWith('socket:socket-123:vendorId');
      expect(redis.del).toHaveBeenCalledWith('room:vendor-123:users');
      expect(redis.del).toHaveBeenCalledWith('vendor_connection:socket-123');
      expect(redis.srem).toHaveBeenCalledWith('user:user-1:rooms', 'vendor-123');
      expect(redis.srem).toHaveBeenCalledWith('user:user-2:rooms', 'vendor-123');
      expect(redis.srem).toHaveBeenCalledWith('user:user-3:rooms', 'vendor-123');
      expect(eventsService.publishEvent).toHaveBeenCalledWith('websocket.vendor.disconnected', {
        affectedUsers: ['user-1', 'user-2', 'user-3'],
        socketId: 'socket-123',
        timestamp: expect.any(String),
        vendorId: 'vendor-123',
      });
    });

    it('should handle disconnection when no connection info found', async () => {
      redis.get.mockResolvedValue(null);

      await service.handleDisconnect('socket-123');

      expect(redis.get).toHaveBeenCalledWith('vendor_connection:socket-123');
      expect(eventsService.publishEvent).not.toHaveBeenCalled();
    });

    it('should handle disconnection when vendor has no users', async () => {
      const connectionInfo = {
        connectedAt: new Date(),
        socketId: 'socket-123',
        vendorId: 'vendor-123',
      };
      redis.get.mockResolvedValue(JSON.stringify(connectionInfo));
      redis.smembers.mockResolvedValue([]);
      redis.del.mockResolvedValue(1);
      redis.zrem.mockResolvedValue(1);
      eventsService.publishEvent.mockResolvedValue(undefined);

      await service.handleDisconnect('socket-123');

      expect(eventsService.publishEvent).toHaveBeenCalledWith('websocket.vendor.disconnected', {
        affectedUsers: [],
        socketId: 'socket-123',
        timestamp: expect.any(String),
        vendorId: 'vendor-123',
      });
    });

    it('should handle Redis errors during disconnection', async () => {
      const connectionInfo = {
        connectedAt: new Date(),
        socketId: 'socket-123',
        vendorId: 'vendor-123',
      };
      redis.get.mockResolvedValue(JSON.stringify(connectionInfo));
      const redisError = new Error('Redis connection failed');
      redis.smembers.mockRejectedValue(redisError);

      await expect(service.handleDisconnect('socket-123')).rejects.toThrow('Redis connection failed');
    });
  });

  describe('getVendorRoomUsers', () => {
    it('should return vendor room users successfully', async () => {
      const users = ['user-1', 'user-2', 'user-3'];
      redis.smembers.mockResolvedValue(users);

      const result = await service.getVendorRoomUsers('vendor-123');

      expect(redis.smembers).toHaveBeenCalledWith('room:vendor-123:users');
      expect(result).toEqual(users);
    });

    it('should return empty array when vendor has no users', async () => {
      redis.smembers.mockResolvedValue([]);

      const result = await service.getVendorRoomUsers('vendor-123');

      expect(result).toEqual([]);
    });

    it('should handle Redis errors', async () => {
      const redisError = new Error('Redis connection failed');
      redis.smembers.mockRejectedValue(redisError);

      await expect(service.getVendorRoomUsers('vendor-123')).rejects.toThrow('Redis connection failed');
    });
  });

  describe('getConnectionInfo', () => {
    it('should return connection info when found', async () => {
      const connectionInfo = {
        connectedAt: new Date().toISOString(),
        socketId: 'socket-123',
        vendorId: 'vendor-123',
      };
      redis.get.mockResolvedValue(JSON.stringify(connectionInfo));

      const result = await service.getConnectionInfo('socket-123');

      expect(redis.get).toHaveBeenCalledWith('vendor_connection:socket-123');
      expect(result).toEqual(connectionInfo);
    });

    it('should return null when connection info not found', async () => {
      redis.get.mockResolvedValue(null);

      const result = await service.getConnectionInfo('socket-123');

      expect(result).toBeNull();
    });

    it('should handle Redis errors', async () => {
      const redisError = new Error('Redis connection failed');
      redis.get.mockRejectedValue(redisError);

      await expect(service.getConnectionInfo('socket-123')).rejects.toThrow('Redis connection failed');
    });
  });

  describe('getVendorSocketId', () => {
    it('should return socket ID when found', async () => {
      redis.get.mockResolvedValue('socket-123');

      const result = await service.getVendorSocketId('vendor-123');

      expect(redis.get).toHaveBeenCalledWith('vendor:vendor-123:socketId');
      expect(result).toBe('socket-123');
    });

    it('should return null when socket ID not found', async () => {
      redis.get.mockResolvedValue(null);

      const result = await service.getVendorSocketId('vendor-123');

      expect(result).toBeNull();
    });

    it('should handle Redis errors', async () => {
      const redisError = new Error('Redis connection failed');
      redis.get.mockRejectedValue(redisError);

      await expect(service.getVendorSocketId('vendor-123')).rejects.toThrow('Redis connection failed');
    });
  });

  describe('getSocketVendorId', () => {
    it('should return vendor ID when found', async () => {
      redis.get.mockResolvedValue('vendor-123');

      const result = await service.getSocketVendorId('socket-123');

      expect(redis.get).toHaveBeenCalledWith('socket:socket-123:vendorId');
      expect(result).toBe('vendor-123');
    });

    it('should return null when vendor ID not found', async () => {
      redis.get.mockResolvedValue(null);

      const result = await service.getSocketVendorId('socket-123');

      expect(result).toBeNull();
    });

    it('should handle Redis errors', async () => {
      const redisError = new Error('Redis connection failed');
      redis.get.mockRejectedValue(redisError);

      await expect(service.getSocketVendorId('socket-123')).rejects.toThrow('Redis connection failed');
    });
  });
}); 