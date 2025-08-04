import { VendorService } from './vendor.service';
import { 
  mockPrisma, 
  mockEvents, 
  data,
  errors,
  clearMocks 
} from '../../../test/helpers/test-utils';
import { AppError } from '@app/nest/errors';
import * as retryUtil from '@app/utils';

// Mock the retry utility
vi.mock('@app/utils', () => ({
  retryOperation: vi.fn().mockImplementation(async (operation: () => Promise<any>) => {
    return await operation();
  }),
}));

describe('VendorService', () => {
  let service: VendorService;
  let prisma: any;
  let eventsService: any;

  beforeEach(() => {
    prisma = mockPrisma();
    eventsService = mockEvents();
    service = new VendorService(prisma, eventsService);
  });

  afterEach(() => {
    clearMocks();
  });

  describe('getVendorById', () => {
    it('should return vendor when found', async () => {
      const mockVendor = data.vendor({ id: 'vendor_123' });
      prisma.db.vendor.findFirst.mockResolvedValue(mockVendor);

      const result = await service.getVendorById('vendor_123');

      expect(prisma.db.vendor.findFirst).toHaveBeenCalledWith({
        where: { id: 'vendor_123' },
      });
      expect(result).toEqual(mockVendor);
    });

    it('should return null when vendor not found', async () => {
      prisma.db.vendor.findFirst.mockResolvedValue(null);

      const result = await service.getVendorById('vendor_123');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const dbError = errors.database('Database connection failed');
      prisma.db.vendor.findFirst.mockRejectedValue(dbError);

      await expect(service.getVendorById('vendor_123')).rejects.toThrow('Database connection failed');
    });
  });

  describe('createVendor', () => {
    const createData = {
      name: 'Test Vendor',
      description: 'A test vendor',
      email: 'test@vendor.com',
      phone: '123-456-7890',
      website: 'https://testvendor.com',
      imageUrl: 'https://example.com/image.jpg',
      userId: 'user_123',
    };

    it('should create vendor successfully', async () => {
      const mockVendor = data.vendor({ id: 'vendor_123', ...createData });
      prisma.db.vendor.create.mockResolvedValue(mockVendor);
      eventsService.publishEvent.mockResolvedValue(undefined);

      const result = await service.createVendor(createData);

      expect(prisma.db.vendor.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Vendor',
          description: 'A test vendor',
          email: 'test@vendor.com',
          phone: '123-456-7890',
          website: 'https://testvendor.com',
          owner: {
            connect: {
              id: 'user_123',
            },
          },
          primaryImage: 'https://example.com/image.jpg',
        },
      });
      expect(eventsService.publishEvent).toHaveBeenCalledWith('vendor.created', {
        createdAt: mockVendor.createdAt,
        description: mockVendor.description,
        email: mockVendor.email,
        id: mockVendor.id,
        lat: mockVendor.lat,
        long: mockVendor.long,
        name: mockVendor.name,
        open: mockVendor.open,
        phone: mockVendor.phone,
        primaryImage: mockVendor.primaryImage,
        updatedAt: mockVendor.updatedAt,
        website: mockVendor.website,
      });
      expect(result).toBe('vendor_123');
    });

    it('should create vendor without imageUrl', async () => {
      const { imageUrl, ...dataWithoutImage } = createData;
      const mockVendor = data.vendor({ id: 'vendor_123', ...dataWithoutImage });
      prisma.db.vendor.create.mockResolvedValue(mockVendor);
      eventsService.publishEvent.mockResolvedValue(undefined);

      const result = await service.createVendor(dataWithoutImage);

      expect(prisma.db.vendor.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Vendor',
          description: 'A test vendor',
          email: 'test@vendor.com',
          phone: '123-456-7890',
          website: 'https://testvendor.com',
          owner: {
            connect: {
              id: 'user_123',
            },
          },
          primaryImage: undefined,
        },
      });
      expect(result).toBe('vendor_123');
    });

    it('should handle database errors', async () => {
      const dbError = errors.database('Database connection failed');
      prisma.db.vendor.create.mockRejectedValue(dbError);

      await expect(service.createVendor(createData)).rejects.toThrow('Database connection failed');
    });

    it('should handle event publishing errors', async () => {
      const mockVendor = data.vendor({ id: 'vendor_123', ...createData });
      prisma.db.vendor.create.mockResolvedValue(mockVendor);
      const eventError = new Error('Event publishing failed');
      eventsService.publishEvent.mockRejectedValue(eventError);

      await expect(service.createVendor(createData)).rejects.toThrow('Event publishing failed');
    });
  });

  describe('updateVendor', () => {
    const updateData = {
      name: 'Updated Vendor',
      description: 'An updated vendor',
      email: 'updated@vendor.com',
      phone: '987-654-3210',
      website: 'https://updatedvendor.com',
      imageUrl: 'https://example.com/updated-image.jpg',
    };

    it('should update vendor successfully', async () => {
      prisma.db.vendor.count.mockResolvedValue(1);
      const mockVendor = data.vendor({ id: 'vendor_123', ...updateData });
      prisma.db.vendor.update.mockResolvedValue(mockVendor);
      eventsService.publishEvent.mockResolvedValue(undefined);

      await service.updateVendor('vendor_123', 'user_123', updateData);

      expect(prisma.db.vendor.count).toHaveBeenCalledWith({
        where: { id: 'vendor_123', owner: { id: 'user_123' } },
      });
      expect(prisma.db.vendor.update).toHaveBeenCalledWith({
        data: {
          name: 'Updated Vendor',
          description: 'An updated vendor',
          email: 'updated@vendor.com',
          phone: '987-654-3210',
          website: 'https://updatedvendor.com',
          primaryImage: 'https://example.com/updated-image.jpg',
        },
        where: { id: 'vendor_123', owner: { id: 'user_123' } },
      });
      expect(eventsService.publishEvent).toHaveBeenCalledWith('vendor.updated', {
        createdAt: mockVendor.createdAt,
        description: mockVendor.description,
        email: mockVendor.email,
        id: mockVendor.id,
        lat: mockVendor.lat,
        long: mockVendor.long,
        name: mockVendor.name,
        open: mockVendor.open,
        phone: mockVendor.phone,
        primaryImage: mockVendor.primaryImage,
        updatedAt: mockVendor.updatedAt,
        website: mockVendor.website,
      });
    });

    it('should update vendor without imageUrl', async () => {
      const { imageUrl, ...dataWithoutImage } = updateData;
      prisma.db.vendor.count.mockResolvedValue(1);
      const mockVendor = data.vendor({ id: 'vendor_123', ...dataWithoutImage });
      prisma.db.vendor.update.mockResolvedValue(mockVendor);
      eventsService.publishEvent.mockResolvedValue(undefined);

      await service.updateVendor('vendor_123', 'user_123', dataWithoutImage);

      expect(prisma.db.vendor.update).toHaveBeenCalledWith({
        data: {
          name: 'Updated Vendor',
          description: 'An updated vendor',
          email: 'updated@vendor.com',
          phone: '987-654-3210',
          website: 'https://updatedvendor.com',
        },
        where: { id: 'vendor_123', owner: { id: 'user_123' } },
      });
    });

    it('should throw not found error when vendor does not exist', async () => {
      prisma.db.vendor.count.mockResolvedValue(0);

      await expect(service.updateVendor('vendor_123', 'user_123', updateData)).rejects.toThrow(AppError);
    });

    it('should throw not found error when user is not the owner', async () => {
      prisma.db.vendor.count.mockResolvedValue(0);

      await expect(service.updateVendor('vendor_123', 'different_user', updateData)).rejects.toThrow(AppError);
    });

    it('should handle database errors', async () => {
      prisma.db.vendor.count.mockResolvedValue(1);
      const dbError = errors.database('Database connection failed');
      prisma.db.vendor.update.mockRejectedValue(dbError);

      await expect(service.updateVendor('vendor_123', 'user_123', updateData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('deleteVendor', () => {
    it('should delete vendor successfully', async () => {
      const mockVendor = data.vendor({ id: 'vendor_123' });
      prisma.db.vendor.findFirst.mockResolvedValue(mockVendor);
      prisma.db.vendor.delete.mockResolvedValue(mockVendor);
      eventsService.publishEvent.mockResolvedValue(undefined);

      await service.deleteVendor('vendor_123', 'user_123');

      expect(prisma.db.vendor.findFirst).toHaveBeenCalledWith({
        where: { id: 'vendor_123', owner: { id: 'user_123' } },
      });
      expect(prisma.db.vendor.delete).toHaveBeenCalledWith({
        where: { id: 'vendor_123' },
      });
      expect(eventsService.publishEvent).toHaveBeenCalledWith('vendor.deleted', {
        createdAt: mockVendor.createdAt,
        description: mockVendor.description,
        email: mockVendor.email,
        id: mockVendor.id,
        lat: mockVendor.lat,
        long: mockVendor.long,
        name: mockVendor.name,
        open: mockVendor.open,
        phone: mockVendor.phone,
        primaryImage: mockVendor.primaryImage,
        updatedAt: mockVendor.updatedAt,
        website: mockVendor.website,
      });
    });

    it('should throw not found error when vendor does not exist', async () => {
      prisma.db.vendor.findFirst.mockResolvedValue(null);

      await expect(service.deleteVendor('vendor_123', 'user_123')).rejects.toThrow(AppError);
    });

    it('should throw not found error when user is not the owner', async () => {
      prisma.db.vendor.findFirst.mockResolvedValue(null);

      await expect(service.deleteVendor('vendor_123', 'different_user')).rejects.toThrow(AppError);
    });

    it('should handle database errors', async () => {
      const mockVendor = data.vendor({ id: 'vendor_123' });
      prisma.db.vendor.findFirst.mockResolvedValue(mockVendor);
      const dbError = errors.database('Database connection failed');
      prisma.db.vendor.delete.mockRejectedValue(dbError);

      await expect(service.deleteVendor('vendor_123', 'user_123')).rejects.toThrow('Database connection failed');
    });
  });
}); 