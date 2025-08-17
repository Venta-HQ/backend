import { describe, expect, it } from 'vitest';
import { Metadata } from '@grpc/grpc-js';
import { extractAuthFromMetadata, extractGrpcRequestMetadata, extractRequestIdFromMetadata } from './grpc.util';

describe('grpc.util', () => {
	it('extracts auth and request id from metadata', () => {
		const md = new Metadata();
		md.set('x-user-id', 'user-1');
		md.set('x-clerk-id', 'clerk-1');
		md.set('x-request-id', 'req-1');

		expect(extractAuthFromMetadata(md)).toEqual({ id: 'user-1', clerkId: 'clerk-1' });
		expect(extractRequestIdFromMetadata(md)).toBe('req-1');
		expect(extractGrpcRequestMetadata(md)).toEqual({ user: { id: 'user-1', clerkId: 'clerk-1' }, requestId: 'req-1' });
	});

	it('returns null when not present', () => {
		const md = new Metadata();
		expect(extractAuthFromMetadata(md)).toBeNull();
		expect(extractRequestIdFromMetadata(md)).toBeNull();
		expect(extractGrpcRequestMetadata(md)).toEqual({ requestId: null });
	});
});
