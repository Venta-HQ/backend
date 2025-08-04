import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigModule } from './config.module';
import { ConfigService } from '@nestjs/config';

describe('ConfigModule', () => {
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

			// The ConfigModule exports the ConfigService from @nestjs/config
			const configService = module.get(ConfigService);
			expect(configService).toBeDefined();
			expect(configService).toBeInstanceOf(ConfigService);
		});
	});
}); 