import { describe, expect, it } from 'vitest';
import { ProtoPathUtil } from './proto-path.util';

describe('ProtoPathUtil', () => {
	it('resolves file name to absolute path and returns proto root', () => {
		const p = ProtoPathUtil.resolveProtoPath('shared/index.proto');
		expect(typeof p).toBe('string');
		const root = ProtoPathUtil.getProtoRoot();
		expect(typeof root).toBe('string');
	});
});
