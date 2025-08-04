import { VendorService } from './vendor.service';
import { 
  createMockPrismaService, 
  sampleData,
  errors,
  clearAllMocks 
} from '../../../../test/helpers';

describe('VendorService', () => {
  let service: VendorService;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = createMockPrismaService();
    service = new VendorService(mockPrismaService);
  });

  afterEach(() => {
    clearAllMocks();
  });

  describe('getUserVendors', () => {
    it('should return user vendors successfully', async () => {
      const userId = 'user_123';
      const expectedVendors = [
        sampleData.vendor({ id: 'vendor_1', name: 'Vendor 1' }),
        sampleData.vendor({ id: 'vendor_2', name: 'Vendor 2' }),
      ];

      mockPrismaService.db.vendor.findMany.mockResolvedValue(expectedVendors);

      const result = await service.getUserVendors(userId);

      expect(result).toEqual(expectedVendors);
      expect(mockPrismaService.db.vendor.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
        },
        where: {
          owner: {
            id: userId,
          },
        },
      });
    });

    it('should return empty array when user has no vendors', async () => {
      const userId = 'user_with_no_vendors';

      mockPrismaService.db.vendor.findMany.mockResolvedValue([]);

      const result = await service.getUserVendors(userId);

      expect(result).toEqual([]);
      expect(mockPrismaService.db.vendor.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
        },
        where: {
          owner: {
            id: userId,
          },
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      const userId = 'user_123';
      const dbError = errors.database('Database connection failed');
      mockPrismaService.db.vendor.findMany.mockRejectedValue(dbError);

      await expect(service.getUserVendors(userId)).rejects.toThrow('Database connection failed');
      expect(mockPrismaService.db.vendor.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
        },
        where: {
          owner: {
            id: userId,
          },
        },
      });
    });

    it('should handle null userId gracefully', async () => {
      const userId = null as any;
      const expectedVendors = [];

      mockPrismaService.db.vendor.findMany.mockResolvedValue(expectedVendors);

      const result = await service.getUserVendors(userId);

      expect(result).toEqual(expectedVendors);
      expect(mockPrismaService.db.vendor.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
        },
        where: {
          owner: {
            id: userId,
          },
        },
      });
    });

    it('should handle undefined userId gracefully', async () => {
      const userId = undefined as any;
      const expectedVendors = [];

      mockPrismaService.db.vendor.findMany.mockResolvedValue(expectedVendors);

      const result = await service.getUserVendors(userId);

      expect(result).toEqual(expectedVendors);
      expect(mockPrismaService.db.vendor.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
        },
        where: {
          owner: {
            id: userId,
          },
        },
      });
    });
  });
}); 