import { UserConnectionManagerService } from './user-connection-manager.service';
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

describe('UserConnectionManagerService', () => {
  let service: UserConnectionManagerService;
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
    };
    eventsService = mockEvents();
    service = new UserConnectionManagerService(redis, eventsService);
  });

  afterEach(() => {
    clearMocks();
  });

  describe('registerUser', () => {
    it('should register user connection successfully', async () => {
      redis.set.mockResolvedValue('OK');
      eventsService.publishEvent.mockResolvedValue(undefined);

      await service.registerUser('user-123', 'socket-123');

      expect(redis.set).toHaveBeenCalledWith('user:user-123:socketId', 'socket-123');
      expect(redis.set).toHaveBeenCalledWith('socket:socket-123:userId', 'user-123');
      expect(redis.set).toHaveBeenCalledWith(
        'user_connection:socket-123',
        expect.stringContaining('"socketId":"socket-123"')
      );
      expect(eventsService.publishEvent).toHaveBeenCalledWith('websocket.user.connected', {
        socketId: 'socket-123',
        timestamp: expect.any(String),
        userId: 'user-123',
      });
    });

    it('should handle Redis errors', async () => {
      const redisError = new Error('Redis connection failed');
      redis.set.mockRejectedValue(redisError);

      await expect(service.registerUser('user-123', 'socket-123')).rejects.toThrow('Redis connection failed');
    });

    it('should handle event publishing errors', async () => {
      redis.set.mockResolvedValue('OK');
      const eventError = new Error('Event publishing failed');
      eventsService.publishEvent.mockRejectedValue(eventError);

      await expect(service.registerUser('user-123', 'socket-123')).rejects.toThrow('Event publishing failed');
    });
  });

  describe('handleDisconnect', () => {
    it('should handle user disconnection successfully', async () => {
      const connectionInfo = {
        connectedAt: new Date(),
        socketId: 'socket-123',
        userId: 'user-123',
      };
      redis.get.mockResolvedValue(JSON.stringify(connectionInfo));
      redis.smembers.mockResolvedValue(['vendor-1', 'vendor-2']);
      redis.srem.mockResolvedValue(1);
      redis.del.mockResolvedValue(1);
      eventsService.publishEvent.mockResolvedValue(undefined);

      await service.handleDisconnect('socket-123');

      expect(redis.get).toHaveBeenCalledWith('user_connection:socket-123');
      expect(redis.smembers).toHaveBeenCalledWith('user:user-123:rooms');
      expect(redis.srem).toHaveBeenCalledWith('room:vendor-1:users', 'user-123');
      expect(redis.srem).toHaveBeenCalledWith('room:vendor-2:users', 'user-123');
      expect(redis.del).toHaveBeenCalledWith('user:user-123:socketId');
      expect(redis.del).toHaveBeenCalledWith('socket:socket-123:userId');
      expect(redis.del).toHaveBeenCalledWith('user:user-123:rooms');
      expect(redis.del).toHaveBeenCalledWith('user_connection:socket-123');
      expect(eventsService.publishEvent).toHaveBeenCalledWith('websocket.user.disconnected', {
        socketId: 'socket-123',
        timestamp: expect.any(String),
        userId: 'user-123',
      });
    });

    it('should handle disconnection when no connection info found', async () => {
      redis.get.mockResolvedValue(null);

      await service.handleDisconnect('socket-123');

      expect(redis.get).toHaveBeenCalledWith('user_connection:socket-123');
      expect(eventsService.publishEvent).not.toHaveBeenCalled();
    });

    it('should handle Redis errors during disconnection', async () => {
      const connectionInfo = {
        connectedAt: new Date(),
        socketId: 'socket-123',
        userId: 'user-123',
      };
      redis.get.mockResolvedValue(JSON.stringify(connectionInfo));
      const redisError = new Error('Redis connection failed');
      redis.smembers.mockRejectedValue(redisError);

      await expect(service.handleDisconnect('socket-123')).rejects.toThrow('Redis connection failed');
    });
  });

  describe('addUserToVendorRoom', () => {
    it('should add user to vendor room successfully', async () => {
      redis.sadd.mockResolvedValue(1);

      await service.addUserToVendorRoom('user-123', 'vendor-456');

      expect(redis.sadd).toHaveBeenCalledWith('user:user-123:rooms', 'vendor-456');
      expect(redis.sadd).toHaveBeenCalledWith('room:vendor-456:users', 'user-123');
    });

    it('should handle Redis errors', async () => {
      const redisError = new Error('Redis connection failed');
      redis.sadd.mockRejectedValue(redisError);

      await expect(service.addUserToVendorRoom('user-123', 'vendor-456')).rejects.toThrow('Redis connection failed');
    });
  });

  describe('removeUserFromVendorRoom', () => {
    it('should remove user from vendor room successfully', async () => {
      redis.srem.mockResolvedValue(1);

      await service.removeUserFromVendorRoom('user-123', 'vendor-456');

      expect(redis.srem).toHaveBeenCalledWith('user:user-123:rooms', 'vendor-456');
      expect(redis.srem).toHaveBeenCalledWith('room:vendor-456:users', 'user-123');
    });

    it('should handle Redis errors', async () => {
      const redisError = new Error('Redis connection failed');
      redis.srem.mockRejectedValue(redisError);

      await expect(service.removeUserFromVendorRoom('user-123', 'vendor-456')).rejects.toThrow('Redis connection failed');
    });
  });

  describe('getUserVendorRooms', () => {
    it('should return user vendor rooms successfully', async () => {
      const rooms = ['vendor-1', 'vendor-2', 'vendor-3'];
      redis.smembers.mockResolvedValue(rooms);

      const result = await service.getUserVendorRooms('user-123');

      expect(redis.smembers).toHaveBeenCalledWith('user:user-123:rooms');
      expect(result).toEqual(rooms);
    });

    it('should return empty array when user has no rooms', async () => {
      redis.smembers.mockResolvedValue([]);

      const result = await service.getUserVendorRooms('user-123');

      expect(result).toEqual([]);
    });

    it('should handle Redis errors', async () => {
      const redisError = new Error('Redis connection failed');
      redis.smembers.mockRejectedValue(redisError);

      await expect(service.getUserVendorRooms('user-123')).rejects.toThrow('Redis connection failed');
    });
  });

  describe('getConnectionInfo', () => {
    it('should return connection info when found', async () => {
      const connectionInfo = {
        connectedAt: new Date().toISOString(),
        socketId: 'socket-123',
        userId: 'user-123',
      };
      redis.get.mockResolvedValue(JSON.stringify(connectionInfo));

      const result = await service.getConnectionInfo('socket-123');

      expect(redis.get).toHaveBeenCalledWith('user_connection:socket-123');
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

  describe('getUserSocketId', () => {
    it('should return socket ID when found', async () => {
      redis.get.mockResolvedValue('socket-123');

      const result = await service.getUserSocketId('user-123');

      expect(redis.get).toHaveBeenCalledWith('user:user-123:socketId');
      expect(result).toBe('socket-123');
    });

    it('should return null when socket ID not found', async () => {
      redis.get.mockResolvedValue(null);

      const result = await service.getUserSocketId('user-123');

      expect(result).toBeNull();
    });

    it('should handle Redis errors', async () => {
      const redisError = new Error('Redis connection failed');
      redis.get.mockRejectedValue(redisError);

      await expect(service.getUserSocketId('user-123')).rejects.toThrow('Redis connection failed');
    });
  });

  describe('getSocketUserId', () => {
    it('should return user ID when found', async () => {
      redis.get.mockResolvedValue('user-123');

      const result = await service.getSocketUserId('socket-123');

      expect(redis.get).toHaveBeenCalledWith('socket:socket-123:userId');
      expect(result).toBe('user-123');
    });

    it('should return null when user ID not found', async () => {
      redis.get.mockResolvedValue(null);

      const result = await service.getSocketUserId('socket-123');

      expect(result).toBeNull();
    });

    it('should handle Redis errors', async () => {
      const redisError = new Error('Redis connection failed');
      redis.get.mockRejectedValue(redisError);

      await expect(service.getSocketUserId('socket-123')).rejects.toThrow('Redis connection failed');
    });
  });
}); 