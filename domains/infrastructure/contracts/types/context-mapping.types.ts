/**
 * Infrastructure Domain Context Mapping Types
 *
 * These types define the context mapping interfaces for the infrastructure domain
 * when communicating with other bounded contexts.
 */

import { z } from 'zod';

// ============================================================================
// Infrastructure Domain Types
// ============================================================================

export namespace Infrastructure {
	/**
	 * File upload metadata
	 */
	export interface FileMetadata {
		/** Original filename */
		filename: string;
		/** File size in bytes */
		size: number;
		/** File MIME type */
		mimeType: string;
		/** User who uploaded the file */
		uploadedBy: string;
		/** Upload timestamp */
		timestamp: string;
	}

	/**
	 * File upload result
	 */
	export interface FileUploadResult {
		/** Generated file ID */
		fileId: string;
		/** Public URL to access the file */
		url: string;
		/** File metadata */
		metadata: FileMetadata;
		/** Storage provider (e.g., 'cloudinary', 's3') */
		provider: string;
		/** Upload timestamp */
		timestamp: string;
	}

	/**
	 * File operation type
	 */
	export type FileOperation = 'upload' | 'download' | 'delete' | 'update';

	/**
	 * File context type
	 */
	export type FileContext = 'vendor_profile' | 'user_profile' | 'product_image' | 'document';
}
