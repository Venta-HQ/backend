import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'@venta/apitypes': resolve(__dirname, './libs/apitypes/src'),
			'@venta/eventtypes': resolve(__dirname, './libs/eventtypes/src'),
			'@venta/nest/errors': resolve(__dirname, './libs/nest/errors'),
			'@venta/nest/filters': resolve(__dirname, './libs/nest/filters'),
			'@venta/nest/guards': resolve(__dirname, './libs/nest/guards'),
			'@venta/nest/modules': resolve(__dirname, './libs/nest/modules'),

			'@venta/nest/pipes': resolve(__dirname, './libs/nest/pipes'),
			'@venta/proto': resolve(__dirname, './libs/proto/src/lib/domains'),
			'@venta/utils': resolve(__dirname, './libs/utils/src'),
			'@venta/test/helpers': resolve(__dirname, './test/helpers'),
			'@venta/domains/marketplace': resolve(__dirname, './domains/marketplace'),
			'@venta/domains/location-services': resolve(__dirname, './domains/location-services'),
			'@venta/domains/communication': resolve(__dirname, './domains/communication'),
			'@venta/domains/infrastructure': resolve(__dirname, './domains/infrastructure'),
		},
	},
	test: {
		coverage: {
			exclude: [
				'node_modules/',
				'dist/',
				'coverage/',
				'**/*.d.ts',
				'**/*.config.*',
				'**/test/**',
				'**/tests/**',
				'**/__tests__/**',
				'**/*.spec.ts',
				'**/*.test.ts',
			],
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
		},
		environment: 'node',
		globals: true,
		include: ['libs/**/*.spec.ts', 'libs/**/*.test.ts', 'apps/**/*.spec.ts', 'apps/**/*.test.ts'],
		setupFiles: ['./test/setup.ts'],
	},
});
