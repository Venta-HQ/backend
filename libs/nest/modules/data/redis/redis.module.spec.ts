import { describe, expect, it } from 'vitest';
import { RedisModule } from './redis.module';

describe('RedisModule', () => {
	it('is defined', () => {
		expect(RedisModule).toBeDefined();
	});
});
