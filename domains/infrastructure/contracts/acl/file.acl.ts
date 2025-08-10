import { AppError, ErrorCodes } from '@venta/nest/errors';

/**
 * File Management ACL
 * Handles validation and transformation for file upload/management operations
 */

// Domain types (normalized)
export interface FileUpload {
	filename: string;
	mimetype: string;
	buffer: Buffer;
	size: number;
}

export interface FileUploadResult {
	url: string;
	publicId: string;
	format: string;
	bytes: number;
	createdAt: string;
}

export interface CloudinaryUploadOptions {
	folder?: string;
	transformation?: string;
	tags?: string[];
	context?: Record<string, string>;
}

/**
 * File Upload ACL
 * Validates and transforms file upload requests
 */
export class FileUploadACL {
	// HTTP → Domain (inbound)
	static validate(file: any): void {
		if (!file) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'file',
				message: 'File is required',
			});
		}
		if (!file.filename) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'filename',
				message: 'Filename is required',
			});
		}
		if (!file.buffer || !(file.buffer instanceof Buffer)) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'buffer',
				message: 'Valid file buffer is required',
			});
		}
		if (!file.mimetype) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'mimetype',
				message: 'File MIME type is required',
			});
		}
	}

	static toDomain(file: any): FileUpload {
		this.validate(file);

		return {
			filename: file.filename,
			mimetype: file.mimetype,
			buffer: file.buffer,
			size: file.size || file.buffer.length,
		};
	}
}

/**
 * Cloudinary Upload Options ACL
 * Validates and transforms Cloudinary upload configuration
 */
export class CloudinaryOptionsACL {
	// HTTP → Domain (inbound)
	static validate(options: any): void {
		if (options && typeof options !== 'object') {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'options',
				message: 'Upload options must be an object',
			});
		}
	}

	static toDomain(options: any = {}): CloudinaryUploadOptions {
		this.validate(options);

		return {
			folder: options.folder,
			transformation: options.transformation,
			tags: Array.isArray(options.tags) ? options.tags : undefined,
			context: options.context && typeof options.context === 'object' ? options.context : undefined,
		};
	}
}
