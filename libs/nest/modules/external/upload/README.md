# Upload Module

## Purpose

The Upload module provides file upload and media management capabilities for the Venta backend system. It includes Cloudinary integration for file storage, image processing, media asset management, and secure file handling with validation and optimization.

## Overview

This module provides:

- Cloudinary integration for cloud-based file storage
- File upload and processing capabilities
- Image optimization and transformation
- Media asset management and retrieval
- File type and size validation
- Secure upload handling and processing
- CDN delivery and caching

## Usage

### Module Registration

Register the upload module in your service:

```typescript
import { UploadModule } from '@venta/nest/modules/upload';

@Module({
	imports: [UploadModule],
	// ... other module configuration
})
export class YourServiceModule {}
```

### Service Injection

Inject UploadService for file handling operations:

```typescript
import { UploadService } from '@venta/nest/modules/upload';

@Injectable()
export class YourService {
	constructor(private readonly uploadService: UploadService) {}

	async uploadFile(file: Express.Multer.File) {
		const result = await this.uploadService.uploadFile(file);
		return result;
	}

	async uploadImage(file: Express.Multer.File, options?: any) {
		const result = await this.uploadService.uploadImage(file, options);
		return result;
	}
}
```

### File Upload Operations

Perform file upload operations:

```typescript
// Upload any file type
async uploadFile(file: Express.Multer.File) {
  const result = await this.uploadService.uploadFile(file);
  return {
    url: result.url,
    publicId: result.publicId,
    format: result.format,
    size: result.size
  };
}

// Upload image with optimization
async uploadImage(file: Express.Multer.File, options?: any) {
  const result = await this.uploadService.uploadImage(file, {
    transformation: {
      width: 800,
      height: 600,
      crop: 'fill',
      quality: 'auto'
    },
    ...options
  });
  return result;
}

// Upload with custom folder
async uploadToFolder(file: Express.Multer.File, folder: string) {
  const result = await this.uploadService.uploadFile(file, {
    folder: folder
  });
  return result;
}
```

### Image Transformations

Apply image transformations and optimizations:

```typescript
// Resize and crop image
async resizeImage(publicId: string, width: number, height: number) {
  const result = await this.uploadService.transformImage(publicId, {
    width: width,
    height: height,
    crop: 'fill',
    gravity: 'auto'
  });
  return result;
}

// Apply filters and effects
async applyFilters(publicId: string, filters: any) {
  const result = await this.uploadService.transformImage(publicId, {
    effect: filters.effect,
    brightness: filters.brightness,
    contrast: filters.contrast
  });
  return result;
}

// Generate thumbnail
async generateThumbnail(publicId: string) {
  const result = await this.uploadService.transformImage(publicId, {
    width: 150,
    height: 150,
    crop: 'thumb',
    gravity: 'face'
  });
  return result;
}
```

### File Management

Manage uploaded files:

```typescript
// Delete file
async deleteFile(publicId: string) {
  const result = await this.uploadService.deleteFile(publicId);
  return result;
}

// Get file information
async getFileInfo(publicId: string) {
  const result = await this.uploadService.getFileInfo(publicId);
  return result;
}

// Update file metadata
async updateFileMetadata(publicId: string, metadata: any) {
  const result = await this.uploadService.updateFileMetadata(publicId, metadata);
  return result;
}
```

### File Validation

Validate uploaded files:

```typescript
// Validate file type
async validateFileType(file: Express.Multer.File) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new AppError('Invalid file type', ErrorCodes.BAD_REQUEST);
  }
}

// Validate file size
async validateFileSize(file: Express.Multer.File, maxSize: number) {
  if (file.size > maxSize) {
    throw new AppError('File too large', ErrorCodes.BAD_REQUEST);
  }
}

// Complete file validation
async validateFile(file: Express.Multer.File) {
  await this.validateFileType(file);
  await this.validateFileSize(file, 5 * 1024 * 1024); // 5MB
  return true;
}
```

### Controller Integration

Integrate with controllers for file uploads:

```typescript
@Controller('upload')
export class UploadController {
	constructor(private readonly uploadService: UploadService) {}

	@Post('file')
	@UseInterceptors(FileInterceptor('file'))
	async uploadFile(@UploadedFile() file: Express.Multer.File) {
		await this.uploadService.validateFile(file);
		const result = await this.uploadService.uploadFile(file);
		return result;
	}

	@Post('image')
	@UseInterceptors(FileInterceptor('image'))
	async uploadImage(@UploadedFile() file: Express.Multer.File) {
		await this.uploadService.validateFile(file);
		const result = await this.uploadService.uploadImage(file);
		return result;
	}
}
```

### Environment Configuration

Configure Cloudinary and upload settings:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Upload Settings
UPLOAD_MAX_FILE_SIZE=5242880
UPLOAD_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif
UPLOAD_DEFAULT_FOLDER=venta-uploads

# Image Processing
IMAGE_MAX_WIDTH=1920
IMAGE_MAX_HEIGHT=1080
IMAGE_QUALITY=auto
IMAGE_FORMAT=auto
```

## Key Benefits

- **Scalability**: Cloud-based file storage and processing
- **Performance**: Image optimization and CDN delivery
- **Security**: File validation and secure upload handling
- **Flexibility**: Support for various file types and formats
- **Reliability**: Cloudinary's robust infrastructure
- **Optimization**: Automatic image optimization and transformation
- **CDN**: Global content delivery network for fast access

## Dependencies

- **Cloudinary** for cloud-based file storage and processing
- **NestJS** for module framework and dependency injection
- **Multer** for file upload handling
- **TypeScript** for type definitions and compile-time safety
