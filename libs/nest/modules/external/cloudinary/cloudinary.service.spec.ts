import { describe, expect, it, vi } from 'vitest';
import { CloudinaryService } from './cloudinary.service';

vi.mock('cloudinary', () => {
	return {
		v2: {
			config: vi.fn(),
			uploader: {
				upload_stream: vi.fn((opts: any, cb: any) => ({ end: (b: Buffer) => cb(null, { public_id: 'id' }) })),
			},
		},
	};
});

describe('CloudinaryService', () => {
	it('uploads buffer and returns response', async () => {
		const svc = new CloudinaryService({ get: vi.fn() } as any, { setContext: vi.fn() } as any);
		const res = await svc.uploadBuffer(Buffer.from('a'));
		expect(res).toMatchObject({ public_id: 'id' });
	});
});
