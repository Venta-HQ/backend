import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'@app/apitypes': resolve(__dirname, './libs/apitypes/src'),
			'@app/eventtypes': resolve(__dirname, './libs/eventtypes/src'),
			'@app/nest/errors': resolve(__dirname, './libs/nest/errors'),
			'@app/nest/filters': resolve(__dirname, './libs/nest/filters'),
			'@app/nest/guards': resolve(__dirname, './libs/nest/guards'),
			'@app/nest/modules': resolve(__dirname, './libs/nest/modules'),
			'@app/nest/pipes': resolve(__dirname, './libs/nest/pipes'),
			'@app/proto': resolve(__dirname, './libs/proto/src/lib/domains'),
			'@app/utils': resolve(__dirname, './libs/utils/src'),
			'@test/helpers': resolve(__dirname, './test/helpers'),
			'@domains/marketplace': resolve(__dirname, './domains/marketplace'),
			'@domains/location-services': resolve(__dirname, './domains/location-services'),
			'@domains/communication': resolve(__dirname, './domains/communication'),
			'@domains/infrastructure': resolve(__dirname, './domains/infrastructure'),
			'@test/helpers': resolve(__dirname, './test/helpers'),
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
