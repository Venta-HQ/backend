import { ConfigService } from '@nestjs/config';

export function getAllowedUploadMimes(
	config: ConfigService,
	key: string = 'UPLOAD_ALLOWED_MIME',
	fallback: string = 'image/jpeg,image/png,image/webp',
): string[] {
	return (config.get<string>(key) || fallback)
		.split(',')
		.map((t) => t.trim())
		.filter(Boolean);
}

export function getMaxUploadSize(
	config: ConfigService,
	key: string = 'UPLOAD_MAX_FILE_SIZE',
	fallbackBytes: number = 5 * 1024 * 1024,
): number {
	const v = Number(config.get<string>(key));
	return Number.isFinite(v) && v > 0 ? v : fallbackBytes;
}
