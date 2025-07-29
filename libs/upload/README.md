# Upload Library

This library provides file upload and storage utilities for the Venta backend services.

## Overview

The upload library handles file uploads, storage management, and file processing. It provides a clean interface for managing file uploads, including validation, storage, and retrieval of uploaded files.

## Features

- **File Upload Handling**: Process and validate file uploads
- **Storage Management**: Manage file storage and retrieval
- **File Validation**: Validate file types, sizes, and content
- **Upload Progress**: Track upload progress and status
- **File Processing**: Process and transform uploaded files

## Usage

### File Uploads

Handle file uploads with validation and processing.

```typescript
import { UploadService } from '@app/upload';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FileService {
	constructor(private readonly uploadService: UploadService) {}

	async uploadFile(file: Express.Multer.File, userId: string) {
		// Validate file
		await this.uploadService.validateFile(file, {
			maxSize: 5 * 1024 * 1024, // 5MB
			allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
		});

		// Process and store file
		const result = await this.uploadService.upload(file, {
			folder: `users/${userId}/uploads`,
			generateThumbnail: true,
			optimize: true,
		});

		return {
			fileId: result.id,
			url: result.url,
			thumbnailUrl: result.thumbnailUrl,
			size: result.size,
		};
	}
}
```

### File Storage

Store and retrieve files with proper organization and access control.

```typescript
import { UploadService } from '@app/upload';

@Injectable()
export class DocumentService {
	constructor(private readonly uploadService: UploadService) {}

	async storeDocument(file: Express.Multer.File, metadata: DocumentMetadata) {
		const document = await this.uploadService.upload(file, {
			folder: 'documents',
			metadata: {
				userId: metadata.userId,
				documentType: metadata.type,
				tags: metadata.tags,
			},
		});

		// Save document reference to database
		await this.prisma.document.create({
			data: {
				id: document.id,
				userId: metadata.userId,
				filename: document.filename,
				url: document.url,
				size: document.size,
				type: metadata.type,
			},
		});

		return document;
	}

	async getDocument(documentId: string) {
		const document = await this.prisma.document.findUnique({
			where: { id: documentId },
		});

		if (!document) {
			throw new Error('Document not found');
		}

		return await this.uploadService.getFile(documentId);
	}
}
```

### File Validation

Validate uploaded files for type, size, and content safety.

```typescript
import { UploadService } from '@app/upload';

@Injectable()
export class ImageService {
	constructor(private readonly uploadService: UploadService) {}

	async uploadProfileImage(file: Express.Multer.File, userId: string) {
		// Validate image file
		await this.uploadService.validateFile(file, {
			maxSize: 2 * 1024 * 1024, // 2MB
			allowedTypes: ['image/jpeg', 'image/png'],
			dimensions: {
				minWidth: 100,
				minHeight: 100,
				maxWidth: 2000,
				maxHeight: 2000,
			},
		});

		// Process image (resize, compress)
		const processedFile = await this.uploadService.processImage(file, {
			resize: { width: 400, height: 400 },
			quality: 85,
			format: 'jpeg',
		});

		// Upload processed image
		return await this.uploadService.upload(processedFile, {
			folder: `users/${userId}/profile`,
			public: true,
		});
	}
}
```

## Dependencies

- Multer for file upload handling
- NestJS for framework integration
