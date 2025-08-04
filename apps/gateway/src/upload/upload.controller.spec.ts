import { 
  createMockRequest,
  sampleData,
  errors 
} from '../../../../test/helpers';
import { vi } from 'vitest';
import { UploadController } from './upload.controller';
import { UploadService } from '@app/nest/modules';
import { AppError, ErrorCodes } from '@app/nest/errors';

// Mock the upload service
vi.mock('@app/nest/modules', () => ({
  UploadService: vi.fn(),
}));

describe('UploadController', () => {
  let controller: UploadController;
  let mockUploadService: any;

  beforeEach(() => {
    mockUploadService = {
      uploadImage: vi.fn(),
    };
    controller = new UploadController(mockUploadService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'test-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('fake-image-data'),
      };

      const mockUploadResult = {
        url: 'https://example.com/uploads/test-image.jpg',
        key: 'uploads/test-image.jpg',
        size: 1024,
      };

      mockUploadService.uploadImage.mockResolvedValue(mockUploadResult);

      const result = await controller.uploadImage(mockFile);

      expect(result).toEqual(mockUploadResult);
      expect(mockUploadService.uploadImage).toHaveBeenCalledWith(mockFile);
    });

    it('should handle upload service errors', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'test-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('fake-image-data'),
      };

      const mockError = new Error('Upload failed: Invalid file format');
      mockUploadService.uploadImage.mockRejectedValue(mockError);

      await expect(controller.uploadImage(mockFile)).rejects.toThrow();
      expect(mockUploadService.uploadImage).toHaveBeenCalledWith(mockFile);
    });

    it('should handle large file uploads', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'large-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024, // 10MB
        buffer: Buffer.alloc(10 * 1024 * 1024),
      };

      const mockUploadResult = {
        url: 'https://example.com/uploads/large-image.jpg',
        key: 'uploads/large-image.jpg',
        size: 10 * 1024 * 1024,
      };

      mockUploadService.uploadImage.mockResolvedValue(mockUploadResult);

      const result = await controller.uploadImage(mockFile);

      expect(result).toEqual(mockUploadResult);
      expect(mockUploadService.uploadImage).toHaveBeenCalledWith(mockFile);
    });

    it('should handle different image formats', async () => {
      const imageFormats = [
        { mimetype: 'image/jpeg', originalname: 'test.jpg' },
        { mimetype: 'image/png', originalname: 'test.png' },
        { mimetype: 'image/gif', originalname: 'test.gif' },
        { mimetype: 'image/webp', originalname: 'test.webp' },
      ];

      for (const format of imageFormats) {
        const mockFile = {
          fieldname: 'image',
          originalname: format.originalname,
          encoding: '7bit',
          mimetype: format.mimetype,
          size: 1024,
          buffer: Buffer.from('fake-image-data'),
        };

        const mockUploadResult = {
          url: `https://example.com/uploads/${format.originalname}`,
          key: `uploads/${format.originalname}`,
          size: 1024,
        };

        mockUploadService.uploadImage.mockResolvedValue(mockUploadResult);

        const result = await controller.uploadImage(mockFile);

        expect(result).toEqual(mockUploadResult);
        expect(mockUploadService.uploadImage).toHaveBeenCalledWith(mockFile);
      }
    });

    it('should handle missing file data', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: '',
        encoding: '7bit',
        mimetype: '',
        size: 0,
        buffer: Buffer.alloc(0),
      };

      const mockError = new Error('No file data provided');
      mockUploadService.uploadImage.mockRejectedValue(mockError);

      await expect(controller.uploadImage(mockFile)).rejects.toThrow();
      expect(mockUploadService.uploadImage).toHaveBeenCalledWith(mockFile);
    });

    it('should handle upload service throwing non-Error objects', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'test-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('fake-image-data'),
      };

      const mockError = 'String error instead of Error object';
      mockUploadService.uploadImage.mockRejectedValue(mockError);

      await expect(controller.uploadImage(mockFile)).rejects.toThrow();
      expect(mockUploadService.uploadImage).toHaveBeenCalledWith(mockFile);
    });
  });
}); 