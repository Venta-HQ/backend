import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		setupFiles: ['./test/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
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
		},
		include: [
			'libs/**/*.spec.ts',
			'libs/**/*.test.ts',
			'apps/**/*.spec.ts',
			'apps/**/*.test.ts',
		],
	},
	resolve: {
		alias: {
			'@app/nest/modules': resolve(__dirname, './libs/nest/modules'),
			'@app/nest/guards': resolve(__dirname, './libs/nest/guards'),
			'@app/nest/filters': resolve(__dirname, './libs/nest/filters'),
			'@app/nest/errors': resolve(__dirname, './libs/nest/errors'),
			'@app/nest/pipes': resolve(__dirname, './libs/nest/pipes'),
			'@app/proto': resolve(__dirname, './libs/proto/src'),
			'@app/proto/location': resolve(__dirname, './libs/proto/src/lib/location'),
			'@app/proto/user': resolve(__dirname, './libs/proto/src/lib/user'),
			'@app/proto/vendor': resolve(__dirname, './libs/proto/src/lib/vendor'),
			'@app/apitypes': resolve(__dirname, './libs/apitypes/src'),
			'@app/utils': resolve(__dirname, './libs/utils/src'),
		},
	},
}); 