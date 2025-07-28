import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tsconfigPaths()],
	resolve: {
		alias: {
			'@app/apitypes': resolve(__dirname, 'libs/apitypes/src'),
			'@app/nest/errors': resolve(__dirname, 'libs/nest/errors'),
			'@app/nest/filters': resolve(__dirname, 'libs/nest/filters'),
			'@app/nest/guards': resolve(__dirname, 'libs/nest/guards'),
			'@app/nest/modules': resolve(__dirname, 'libs/nest/modules'),
			'@app/nest/pipes': resolve(__dirname, 'libs/nest/pipes'),
			'@app/proto': resolve(__dirname, 'libs/proto/src'),
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
				'test/',
				'**/*.spec.ts',
				'**/*.test.ts',
			],
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
		},
		environment: 'node',
		globals: true,
		setupFiles: ['./test/setup.ts'],
	},
});
