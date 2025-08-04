import { vi } from 'vitest';
import { UploadController } from './upload.controller';
import { errors } from '../../../../test/helpers/test-utils';

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
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test image data'),
        size: 1024,
      };

      const mockUploadResult = {
        url: 'https://example.com/uploads/test.jpg',
        key: 'uploads/test.jpg',
        size: 1024,
      };

      mockUploadService.uploadImage.mockResolvedValue(mockUploadResult);

      const result = await controller.uploadImage(mockFile);

      expect(result).toEqual(mockUploadResult);
      expect(mockUploadService.uploadImage).toHaveBeenCalledWith(mockFile);
    });

    it('should handle missing file', async () => {
      const mockFile = undefined;

      // Mock the service to throw an error when file is undefined
      mockUploadService.uploadImage.mockRejectedValue(new Error('File is required'));

      await expect(controller.uploadImage(mockFile)).rejects.toThrow('File is required');
    });

    it('should handle large files', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'large.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.alloc(10 * 1024 * 1024), // 10MB
        size: 10 * 1024 * 1024,
      };

      const mockUploadResult = {
        url: 'https://example.com/uploads/large.jpg',
        key: 'uploads/large.jpg',
        size: 10 * 1024 * 1024,
      };

      mockUploadService.uploadImage.mockResolvedValue(mockUploadResult);

      const result = await controller.uploadImage(mockFile);

      expect(result).toEqual(mockUploadResult);
      expect(mockUploadService.uploadImage).toHaveBeenCalledWith(mockFile);
    });

    it('should handle different image formats', async () => {
      const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

      for (const format of imageFormats) {
        const mockFile = {
          fieldname: 'image',
          originalname: `test.${format}`,
          encoding: '7bit',
          mimetype: `image/${format === 'jpg' ? 'jpeg' : format}`,
          buffer: Buffer.from('test image data'),
          size: 1024,
        };

        const mockUploadResult = {
          url: `https://example.com/uploads/test.${format}`,
          key: `uploads/test.${format}`,
          size: 1024,
        };

        mockUploadService.uploadImage.mockResolvedValue(mockUploadResult);

        const result = await controller.uploadImage(mockFile);

        expect(result).toEqual(mockUploadResult);
        expect(mockUploadService.uploadImage).toHaveBeenCalledWith(mockFile);
      }
    });

    it('should handle upload errors', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'error.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test image data'),
        size: 1024,
      };

      const mockError = new Error('Upload failed');
      mockUploadService.uploadImage.mockRejectedValue(mockError);

      await expect(controller.uploadImage(mockFile)).rejects.toThrow();
      expect(mockUploadService.uploadImage).toHaveBeenCalledWith(mockFile);
    });
  });
}); 