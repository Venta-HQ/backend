import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { ClerkModule } from './clerk.module';
import { ClerkService } from './clerk.service';

// Mock ClerkService
vi.mock('./clerk.service', () => ({
	ClerkService: vi.fn(),
}));

describe('ClerkModule', () => {
	let mockConfigService: any;

	beforeEach(() => {
		vi.clearAllMocks();

		mockConfigService = {
			get: vi.fn(),
		} as any;

		(ClerkService as any).mockImplementation(() => ({}));
	});

	describe('register', () => {
		it('should return a dynamic module with correct configuration', () => {
			const module = ClerkModule.register();

			expect(module).toEqual({
				exports: [ClerkService],
				global: true,
				imports: [expect.any(Function)], // ConfigModule
				module: ClerkModule,
				providers: [
					{
						inject: [ConfigService],
						provide: ClerkService,
						useFactory: expect.any(Function),
					},
				],
			});
		});

		it('should be a global module', () => {
			const module = ClerkModule.register();

			expect(module.global).toBe(true);
		});

		it('should export ClerkService', () => {
			const module = ClerkModule.register();

			expect(module.exports).toContain(ClerkService);
		});

		it('should have a provider for ClerkService', () => {
			const module = ClerkModule.register();

			expect(module.providers).toHaveLength(1);
			expect((module.providers[0] as any).provide).toBe(ClerkService);
			expect((module.providers[0] as any).inject).toEqual([ConfigService]);
		});
	});

	describe('useFactory', () => {
		let useFactory: (configService: any) => any;

		beforeEach(() => {
			const module = ClerkModule.register();
			useFactory = (module.providers[0] as any).useFactory;
		});

		it('should create ClerkService with valid configuration', () => {
			const secretKey = 'test-secret-key';

			mockConfigService.get.mockReturnValue(secretKey);

			const result = useFactory(mockConfigService);

			expect(ClerkService).toHaveBeenCalledWith(secretKey);
			expect(result).toBeDefined();
		});

		it('should call config service with CLERK_SECRET_KEY', () => {
			const secretKey = 'test-secret-key';
			mockConfigService.get.mockReturnValue(secretKey);

			useFactory(mockConfigService);

			expect(mockConfigService.get).toHaveBeenCalledWith('CLERK_SECRET_KEY');
		});

		it('should handle undefined secret key', () => {
			mockConfigService.get.mockReturnValue(undefined);

			const result = useFactory(mockConfigService);

			expect(ClerkService).toHaveBeenCalledWith(undefined);
			expect(result).toBeDefined();
		});

		it('should handle null secret key', () => {
			mockConfigService.get.mockReturnValue(null);

			const result = useFactory(mockConfigService);

			expect(ClerkService).toHaveBeenCalledWith(null);
			expect(result).toBeDefined();
		});

		it('should handle empty string secret key', () => {
			mockConfigService.get.mockReturnValue('');

			const result = useFactory(mockConfigService);

			expect(ClerkService).toHaveBeenCalledWith('');
			expect(result).toBeDefined();
		});

		it('should handle different secret key formats', () => {
			const secretKeys = [
				'sk_test_1234567890abcdef',
				'sk_live_1234567890abcdef',
				'custom-secret-key',
				'',
				null,
				undefined,
			];

			secretKeys.forEach((secretKey) => {
				mockConfigService.get.mockReturnValue(secretKey);
				const result = useFactory(mockConfigService);

				expect(ClerkService).toHaveBeenCalledWith(secretKey);
				expect(result).toBeDefined();
			});
		});
	});

	describe('module structure', () => {
		it('should import ConfigModule', () => {
			const module = ClerkModule.register();

			expect(module.imports).toHaveLength(1);
			expect(module.imports[0]).toBeDefined();
		});

		it('should have correct module reference', () => {
			const module = ClerkModule.register();

			expect(module.module).toBe(ClerkModule);
		});

		it('should have exactly one provider', () => {
			const module = ClerkModule.register();

			expect(module.providers).toHaveLength(1);
		});

		it('should have exactly one export', () => {
			const module = ClerkModule.register();

			expect(module.exports).toHaveLength(1);
		});
	});

	describe('edge cases', () => {
		let useFactory: (configService: any) => any;

		beforeEach(() => {
			const module = ClerkModule.register();
			useFactory = (module.providers[0] as any).useFactory;
		});

		it('should handle config service throwing errors', () => {
			const error = new Error('Config service error');
			mockConfigService.get.mockImplementation(() => {
				throw error;
			});

			expect(() => useFactory(mockConfigService)).toThrow('Config service error');
		});

		it('should handle config service returning non-string values', () => {
			const testCases = [
				{ expected: 123, value: 123 },
				{ expected: true, value: true },
				{ expected: false, value: false },
				{ expected: {}, value: {} },
				{ expected: [], value: [] },
			];

			testCases.forEach(({ expected, value }) => {
				mockConfigService.get.mockReturnValue(value);
				const result = useFactory(mockConfigService);

				expect(ClerkService).toHaveBeenCalledWith(expected);
				expect(result).toBeDefined();
			});
		});
	});
});
