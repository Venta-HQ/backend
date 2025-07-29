import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma.module';
import { PrismaService } from './prisma.service';

// Mock PrismaService
vi.mock('./prisma.service', () => ({
	PrismaService: vi.fn(),
}));

describe('PrismaModule', () => {
	let mockConfigService: any;

	beforeEach(() => {
		vi.clearAllMocks();

		mockConfigService = {
			get: vi.fn(),
		} as any;

		(PrismaService as any).mockImplementation(() => ({}));
	});

	describe('register', () => {
		it('should return a dynamic module with correct configuration', () => {
			const module = PrismaModule.register();

			expect(module).toEqual({
				exports: [PrismaService],
				global: true,
				imports: [expect.any(Function)], // ConfigModule
				module: PrismaModule,
				providers: [
					{
						inject: [ConfigService],
						provide: PrismaService,
						useFactory: expect.any(Function),
					},
				],
			});
		});

		it('should be a global module', () => {
			const module = PrismaModule.register();

			expect(module.global).toBe(true);
		});

		it('should export PrismaService', () => {
			const module = PrismaModule.register();

			expect(module.exports).toContain(PrismaService);
		});

		it('should have a provider for PrismaService', () => {
			const module = PrismaModule.register();

			expect(module.providers).toHaveLength(1);
			expect((module.providers[0] as any).provide).toBe(PrismaService);
			expect((module.providers[0] as any).inject).toEqual([ConfigService]);
		});
	});

	describe('useFactory', () => {
		let useFactory: (configService: any) => any;

		beforeEach(() => {
			const module = PrismaModule.register();
			useFactory = (module.providers[0] as any).useFactory;
		});

		it('should create PrismaService with valid configuration', () => {
			const databaseUrl = 'postgresql://user:pass@localhost:5432/db';
			const pulseApiKey = 'pulse-api-key';

			// Set up mock to return the same values for all calls
			mockConfigService.get.mockImplementation((key: string) => {
				if (key === 'DATABASE_URL') return databaseUrl;
				if (key === 'PULSE_API_KEY') return pulseApiKey;
				return undefined;
			});

			const result = useFactory(mockConfigService);

			expect(PrismaService).toHaveBeenCalledWith(databaseUrl, pulseApiKey);
			expect(result).toBeDefined();
		});

		it('should throw error when DATABASE_URL is missing', () => {
			mockConfigService.get.mockImplementation((key: string) => {
				if (key === 'DATABASE_URL') return undefined;
				if (key === 'PULSE_API_KEY') return 'pulse-api-key';
				return undefined;
			});

			expect(() => useFactory(mockConfigService)).toThrow('DATABASE_URL required');
		});

		it('should throw error when PULSE_API_KEY is missing', () => {
			mockConfigService.get.mockImplementation((key: string) => {
				if (key === 'DATABASE_URL') return 'postgresql://user:pass@localhost:5432/db';
				if (key === 'PULSE_API_KEY') return undefined;
				return undefined;
			});

			expect(() => useFactory(mockConfigService)).toThrow('PULSE_API_KEY required');
		});

		it('should throw error when both DATABASE_URL and PULSE_API_KEY are missing', () => {
			mockConfigService.get.mockImplementation((key: string) => {
				if (key === 'DATABASE_URL') return undefined;
				if (key === 'PULSE_API_KEY') return undefined;
				return undefined;
			});

			expect(() => useFactory(mockConfigService)).toThrow('DATABASE_URL required');
		});

		it('should handle empty string values', () => {
			mockConfigService.get.mockImplementation((key: string) => {
				if (key === 'DATABASE_URL') return '';
				if (key === 'PULSE_API_KEY') return '';
				return undefined;
			});

			expect(() => useFactory(mockConfigService)).toThrow('DATABASE_URL required');
		});

		it('should handle null values', () => {
			mockConfigService.get.mockImplementation((key: string) => {
				if (key === 'DATABASE_URL') return null;
				if (key === 'PULSE_API_KEY') return null;
				return undefined;
			});

			expect(() => useFactory(mockConfigService)).toThrow('DATABASE_URL required');
		});

		it('should create PrismaService when config provides valid values', () => {
			const databaseUrl = 'postgresql://user:pass@localhost:5432/db';
			const pulseApiKey = 'pulse-api-key';

			mockConfigService.get.mockImplementation((key: string) => {
				if (key === 'DATABASE_URL') return databaseUrl;
				if (key === 'PULSE_API_KEY') return pulseApiKey;
				return undefined;
			});

			const result = useFactory(mockConfigService);

			expect(PrismaService).toHaveBeenCalledWith(databaseUrl, pulseApiKey);
			expect(result).toBeDefined();
		});

		it('should handle empty strings from config service', () => {
			// Test the actual behavior when config returns empty strings
			mockConfigService.get
				.mockReturnValueOnce('') // DATABASE_URL
				.mockReturnValueOnce(''); // PULSE_API_KEY

			expect(() => useFactory(mockConfigService)).toThrow('DATABASE_URL required');
		});

		it('should handle nullish coalescing operator correctly', () => {
			// Test that the ?? operator works as expected
			mockConfigService.get
				.mockReturnValueOnce(undefined) // DATABASE_URL
				.mockReturnValueOnce(undefined); // PULSE_API_KEY

			expect(() => useFactory(mockConfigService)).toThrow('DATABASE_URL required');
		});

		it('should call config service with correct keys', () => {
			mockConfigService.get
				.mockReturnValueOnce('postgresql://user:pass@localhost:5432/db')
				.mockReturnValueOnce('pulse-api-key');

			useFactory(mockConfigService);

			expect(mockConfigService.get).toHaveBeenCalledWith('DATABASE_URL');
			expect(mockConfigService.get).toHaveBeenCalledWith('PULSE_API_KEY');
		});

		it('should call config service in correct order', () => {
			mockConfigService.get
				.mockReturnValueOnce('postgresql://user:pass@localhost:5432/db')
				.mockReturnValueOnce('pulse-api-key');

			useFactory(mockConfigService);

			expect(mockConfigService.get.mock.calls[0][0]).toBe('DATABASE_URL');
			expect(mockConfigService.get.mock.calls[1][0]).toBe('PULSE_API_KEY');
		});
	});

	describe('module structure', () => {
		it('should import ConfigModule', () => {
			const module = PrismaModule.register();

			expect(module.imports).toHaveLength(1);
			expect(module.imports[0]).toBeDefined();
		});

		it('should have correct module reference', () => {
			const module = PrismaModule.register();

			expect(module.module).toBe(PrismaModule);
		});

		it('should have exactly one provider', () => {
			const module = PrismaModule.register();

			expect(module.providers).toHaveLength(1);
		});

		it('should have exactly one export', () => {
			const module = PrismaModule.register();

			expect(module.exports).toHaveLength(1);
		});
	});
});
