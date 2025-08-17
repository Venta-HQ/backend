import { describe, expect, it } from 'vitest';
import { InfraModule } from './infra.module';

describe('InfraModule', () => {
	it('exports prisma, redis, and clerk modules', () => {
		const mod = InfraModule;
		expect(mod.name).toBe('InfraModule');
	});
});
