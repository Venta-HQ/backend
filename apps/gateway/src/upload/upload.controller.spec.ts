import { vi } from 'vitest';
import { errors } from '../../../../test/helpers/test-utils';
import { UploadController } from './upload.controller';

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
				buffer: Buffer.from('test image data'),
				encoding: '7bit',
				fieldname: 'image',
				mimetype: 'image/jpeg',
				originalname: 'test.jpg',
				size: 1024,
			};

			const mockUploadResult = {
				key: 'uploads/test.jpg',
				size: 1024,
				url: 'https://example.com/uploads/test.jpg',
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
				buffer: Buffer.alloc(10 * 1024 * 1024), // 10MB
				encoding: '7bit',
				fieldname: 'image',
				mimetype: 'image/jpeg',
				originalname: 'large.jpg',
				size: 10 * 1024 * 1024,
			};

			const mockUploadResult = {
				key: 'uploads/large.jpg',
				size: 10 * 1024 * 1024,
				url: 'https://example.com/uploads/large.jpg',
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
					buffer: Buffer.from('test image data'),
					encoding: '7bit',
					fieldname: 'image',
					mimetype: `image/${format === 'jpg' ? 'jpeg' : format}`,
					originalname: `test.${format}`,
					size: 1024,
				};

				const mockUploadResult = {
					key: `uploads/test.${format}`,
					size: 1024,
					url: `https://example.com/uploads/test.${format}`,
				};

				mockUploadService.uploadImage.mockResolvedValue(mockUploadResult);

				const result = await controller.uploadImage(mockFile);

				expect(result).toEqual(mockUploadResult);
				expect(mockUploadService.uploadImage).toHaveBeenCalledWith(mockFile);
			}
		});

		it('should handle upload errors', async () => {
			const mockFile = {
				buffer: Buffer.from('test image data'),
				encoding: '7bit',
				fieldname: 'image',
				mimetype: 'image/jpeg',
				originalname: 'error.jpg',
				size: 1024,
			};

			const mockError = new Error('Upload failed');
			mockUploadService.uploadImage.mockRejectedValue(mockError);

			await expect(controller.uploadImage(mockFile)).rejects.toThrow();
			expect(mockUploadService.uploadImage).toHaveBeenCalledWith(mockFile);
		});
	});
});
