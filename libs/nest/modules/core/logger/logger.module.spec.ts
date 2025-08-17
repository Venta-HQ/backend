import { describe, expect, it } from 'vitest';
import { LoggerModule } from './logger.module';

describe('LoggerModule', () => {
	it('exposes register() as a dynamic module', () => {
		const mod = LoggerModule.register();
		expect(mod.global).toBe(true);
		expect(mod.providers?.length).toBeGreaterThan(0);
		expect(mod.exports).toContainEqual(expect.any(Function));
	});
});
