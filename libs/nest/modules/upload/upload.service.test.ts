import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
// Import after mocking
import { UploadService } from './upload.service';

// Mock cloudinary
const { mockConfig, mockUploadStream } = vi.hoisted(() => ({
	mockConfig: vi.fn(),
	mockUploadStream: vi.fn(),
}));

vi.mock('cloudinary', () => ({
	v2: {
		config: mockConfig,
		uploader: {
			upload_stream: mockUploadStream,
		},
	},
}));

// Mock buffer-to-stream
const { mockToStream } = vi.hoisted(() => ({
	mockToStream: vi.fn(),
}));

vi.mock('buffer-to-stream', () => mockToStream);

describe('UploadService', () => {
	let uploadService: UploadService;
	const mockApiKey = 'test-api-key';
	const mockApiSecret = 'test-api-secret';
	const mockCloudName = 'test-cloud-name';

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock Logger
		vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
		vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

		// Mock stream functionality
		const mockStream = {
			on: vi.fn().mockReturnThis(),
			pipe: vi.fn().mockReturnThis(),
		};
		mockToStream.mockReturnValue(mockStream);

		uploadService = new UploadService(mockApiKey, mockApiSecret, mockCloudName);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('constructor', () => {
		it('should create service with API credentials', () => {
			expect(uploadService).toBeDefined();
		});

		it('should configure Cloudinary with provided credentials', () => {
			expect(mockConfig).toHaveBeenCalledWith({
				api_key: mockApiKey,
				api_secret: mockApiSecret,
				cloud_name: mockCloudName,
			});
		});

		it('should handle empty credentials gracefully', () => {
			expect(() => new UploadService('', '', '')).not.toThrow();
		});
	});

	describe('uploadImage', () => {
		it('should upload image successfully', async () => {
			const mockFile: Express.Multer.File = {
				buffer: Buffer.from('test-image-data'),
				destination: '',
				encoding: '7bit',
				fieldname: 'image',
				filename: '',
				mimetype: 'image/jpeg',
				originalname: 'test.jpg',
				path: '',
				size: 1024,
				stream: null as any,
			};

			const expectedResponse = {
				format: 'jpg',
				height: 600,
				public_id: 'test-image',
				secure_url: 'https://res.cloudinary.com/test/image/upload/test-image.jpg',
				url: 'https://res.cloudinary.com/test/image/upload/test-image.jpg',
				width: 800,
			};

			mockUploadStream.mockImplementation((callback) => {
				callback(null, expectedResponse);
				return { pipe: vi.fn() };
			});

			const result = await uploadService.uploadImage(mockFile);

			expect(result).toEqual(expectedResponse);
		});

		it('should handle upload errors', async () => {
			const mockFile: Express.Multer.File = {
				buffer: Buffer.from('test-image-data'),
				destination: '',
				encoding: '7bit',
				fieldname: 'image',
				filename: '',
				mimetype: 'image/jpeg',
				originalname: 'test.jpg',
				path: '',
				size: 1024,
				stream: null as any,
			};

			const uploadError = new Error('Upload failed');

			mockUploadStream.mockImplementation((callback) => {
				callback(uploadError, null);
				return { pipe: vi.fn() };
			});

			await expect(uploadService.uploadImage(mockFile)).rejects.toThrow('Upload failed');
		});

		it('should handle different image formats', async () => {
			const mockFile: Express.Multer.File = {
				buffer: Buffer.from('test-png-data'),
				destination: '',
				encoding: '7bit',
				fieldname: 'image',
				filename: '',
				mimetype: 'image/png',
				originalname: 'test.png',
				path: '',
				size: 2048,
				stream: null as any,
			};

			const expectedResponse = {
				format: 'png',
				height: 800,
				public_id: 'test-png',
				secure_url: 'https://res.cloudinary.com/test/image/upload/test-png.png',
				url: 'https://res.cloudinary.com/test/image/upload/test-png.png',
				width: 1200,
			};

			mockUploadStream.mockImplementation((callback) => {
				callback(null, expectedResponse);
				return { pipe: vi.fn() };
			});

			const result = await uploadService.uploadImage(mockFile);

			expect(result).toEqual(expectedResponse);
		});

		it('should handle large files', async () => {
			const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
			const mockFile: Express.Multer.File = {
				buffer: largeBuffer,
				destination: '',
				encoding: '7bit',
				fieldname: 'image',
				filename: '',
				mimetype: 'image/jpeg',
				originalname: 'large.jpg',
				path: '',
				size: 10 * 1024 * 1024,
				stream: null as any,
			};

			const expectedResponse = {
				format: 'jpg',
				height: 1080,
				public_id: 'large-image',
				secure_url: 'https://res.cloudinary.com/test/image/upload/large-image.jpg',
				url: 'https://res.cloudinary.com/test/image/upload/large-image.jpg',
				width: 1920,
			};

			mockUploadStream.mockImplementation((callback) => {
				callback(null, expectedResponse);
				return { pipe: vi.fn() };
			});

			const result = await uploadService.uploadImage(mockFile);

			expect(result).toEqual(expectedResponse);
		});

		it('should handle empty file buffer', async () => {
			const mockFile: Express.Multer.File = {
				buffer: Buffer.alloc(0),
				destination: '',
				encoding: '7bit',
				fieldname: 'image',
				filename: '',
				mimetype: 'image/jpeg',
				originalname: 'empty.jpg',
				path: '',
				size: 0,
				stream: null as any,
			};

			const expectedResponse = {
				format: 'jpg',
				height: 0,
				public_id: 'empty-image',
				secure_url: 'https://res.cloudinary.com/test/image/upload/empty-image.jpg',
				url: 'https://res.cloudinary.com/test/image/upload/empty-image.jpg',
				width: 0,
			};

			mockUploadStream.mockImplementation((callback) => {
				callback(null, expectedResponse);
				return { pipe: vi.fn() };
			});

			const result = await uploadService.uploadImage(mockFile);

			expect(result).toEqual(expectedResponse);
		});
	});

	describe('edge cases', () => {
		it('should handle invalid file types', async () => {
			const mockFile: Express.Multer.File = {
				buffer: Buffer.from('invalid-data'),
				destination: '',
				encoding: '7bit',
				fieldname: 'file',
				filename: '',
				mimetype: 'text/plain',
				originalname: 'test.txt',
				path: '',
				size: 100,
				stream: null as any,
			};

			const expectedResponse = {
				format: 'txt',
				height: 0,
				public_id: 'invalid-file',
				secure_url: 'https://res.cloudinary.com/test/image/upload/invalid-file.txt',
				url: 'https://res.cloudinary.com/test/image/upload/invalid-file.txt',
				width: 0,
			};

			mockUploadStream.mockImplementation((callback) => {
				callback(null, expectedResponse);
				return { pipe: vi.fn() };
			});

			const result = await uploadService.uploadImage(mockFile);

			expect(result).toEqual(expectedResponse);
		});
	});

	describe('error handling', () => {
		it('should handle Cloudinary configuration errors', () => {
			mockConfig.mockImplementation(() => {
				throw new Error('Configuration failed');
			});

			expect(() => new UploadService('invalid', 'invalid', 'invalid')).toThrow('Configuration failed');
		});

		it('should handle network errors during upload', async () => {
			const mockFile: Express.Multer.File = {
				buffer: Buffer.from('test-data'),
				destination: '',
				encoding: '7bit',
				fieldname: 'image',
				filename: '',
				mimetype: 'image/jpeg',
				originalname: 'test.jpg',
				path: '',
				size: 1024,
				stream: null as any,
			};

			const networkError = new Error('Network error');

			mockUploadStream.mockImplementation((callback) => {
				callback(networkError, null);
				return { pipe: vi.fn() };
			});

			await expect(uploadService.uploadImage(mockFile)).rejects.toThrow('Network error');
		});

		it('should handle timeout errors', async () => {
			const mockFile: Express.Multer.File = {
				buffer: Buffer.from('test-data'),
				destination: '',
				encoding: '7bit',
				fieldname: 'image',
				filename: '',
				mimetype: 'image/jpeg',
				originalname: 'test.jpg',
				path: '',
				size: 1024,
				stream: null as any,
			};

			const timeoutError = new Error('Request timeout');

			mockUploadStream.mockImplementation((callback) => {
				callback(timeoutError, null);
				return { pipe: vi.fn() };
			});

			await expect(uploadService.uploadImage(mockFile)).rejects.toThrow('Request timeout');
		});
	});

	describe('performance considerations', () => {
		it('should handle multiple concurrent uploads', async () => {
			const mockFiles: Express.Multer.File[] = [
				{
					buffer: Buffer.from('file1'),
					destination: '',
					encoding: '7bit',
					fieldname: 'image',
					filename: '',
					mimetype: 'image/jpeg',
					originalname: 'file1.jpg',
					path: '',
					size: 1024,
					stream: null as any,
				},
				{
					buffer: Buffer.from('file2'),
					destination: '',
					encoding: '7bit',
					fieldname: 'image',
					filename: '',
					mimetype: 'image/jpeg',
					originalname: 'file2.jpg',
					path: '',
					size: 1024,
					stream: null as any,
				},
			];

			const expectedResponse = {
				format: 'jpg',
				height: 600,
				public_id: 'test-image',
				secure_url: 'https://res.cloudinary.com/test/image/upload/test-image.jpg',
				url: 'https://res.cloudinary.com/test/image/upload/test-image.jpg',
				width: 800,
			};

			mockUploadStream.mockImplementation((callback) => {
				callback(null, expectedResponse);
				return { pipe: vi.fn() };
			});

			const uploadPromises = mockFiles.map((file) => uploadService.uploadImage(file));
			const results = await Promise.all(uploadPromises);

			expect(results).toHaveLength(2);
			expect(results[0]).toEqual(expectedResponse);
			expect(results[1]).toEqual(expectedResponse);
		});

		it('should not create memory leaks with repeated uploads', async () => {
			const mockFile: Express.Multer.File = {
				buffer: Buffer.from('test-data'),
				destination: '',
				encoding: '7bit',
				fieldname: 'image',
				filename: '',
				mimetype: 'image/jpeg',
				originalname: 'test.jpg',
				path: '',
				size: 1024,
				stream: null as any,
			};

			const expectedResponse = {
				format: 'jpg',
				height: 600,
				public_id: 'test-image',
				secure_url: 'https://res.cloudinary.com/test/image/upload/test-image.jpg',
				url: 'https://res.cloudinary.com/test/image/upload/test-image.jpg',
				width: 800,
			};

			mockUploadStream.mockImplementation((callback) => {
				callback(null, expectedResponse);
				return { pipe: vi.fn() };
			});

			// Perform multiple uploads
			for (let i = 0; i < 10; i++) {
				await uploadService.uploadImage(mockFile);
			}

			expect(mockUploadStream).toHaveBeenCalledTimes(10);
		});
	});
});
