import { VendorService } from './vendor.service';
import { 
  mockPrisma, 
  data,
  errors,
  clearMocks 
} from '../../../../test/helpers/test-utils';

describe('VendorService', () => {
  let service: VendorService;
  let prisma: any;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new VendorService(prisma);
  });

  afterEach(() => {
    clearMocks();
  });

  describe('getUserVendors', () => {
    it('should return user vendors successfully', async () => {
      const userId = 'user_123';
      const mockVendors = [
        data.vendor({ id: 'vendor_1', name: 'Test Vendor 1' }),
        data.vendor({ id: 'vendor_2', name: 'Test Vendor 2' }),
      ];

      prisma.db.vendor.findMany.mockResolvedValue(mockVendors);

      const result = await service.getUserVendors(userId);

      expect(result).toEqual(mockVendors);
      expect(prisma.db.vendor.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
        },
        where: {
          owner: {
            id: 'user_123',
          },
        },
      });
    });

    it('should return empty array when user has no vendors', async () => {
      const userId = 'user_123';

      prisma.db.vendor.findMany.mockResolvedValue([]);

      const result = await service.getUserVendors(userId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(prisma.db.vendor.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
        },
        where: {
          owner: {
            id: 'user_123',
          },
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      const userId = 'user_123';
      const dbError = errors.database('Database connection failed');
      prisma.db.vendor.findMany.mockRejectedValue(dbError);

      await expect(service.getUserVendors(userId)).rejects.toThrow('Database connection failed');
      expect(prisma.db.vendor.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
        },
        where: {
          owner: {
            id: 'user_123',
          },
        },
      });
    });


  });
}); 