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
