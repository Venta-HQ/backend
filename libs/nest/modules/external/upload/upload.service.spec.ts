import { describe, expect, it, vi } from 'vitest';
import { UploadService } from './upload.service';

vi.mock('cloudinary', () => {
	return {
		v2: {
			config: vi.fn(),
			uploader: {
				upload_stream: vi.fn((cb: any) => ({ end: (_b: Buffer) => cb(null, { secure_url: 'u' }) })),
			},
		},
	};
});

vi.mock('buffer-to-stream', () => ({ default: (buf: Buffer) => ({ pipe: (dest: any) => dest.end(buf) }) }));

describe('UploadService', () => {
	it('uploads image via cloudinary stream', async () => {
		const svc = new UploadService('key', 'secret', 'cloud');
		const res = await svc.uploadImage({
			buffer: Buffer.from('x'),
			mimetype: 'image/png',
			originalname: 'a',
			size: 1,
		} as any);
		expect(res).toMatchObject({ secure_url: 'u' });
	});
});
