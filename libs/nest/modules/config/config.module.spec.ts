import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigModule } from './config.module';

describe('ConfigModule', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('module registration', () => {
		it('should register as a global module', async () => {
			const module = await Test.createTestingModule({
				imports: [ConfigModule],
			}).compile();

			expect(module).toBeDefined();
		});

		it('should export ConfigService', async () => {
			const module = await Test.createTestingModule({
				imports: [ConfigModule],
			}).compile();

			const configService = module.get('ConfigService');
			expect(configService).toBeDefined();
		});
	});
}); 