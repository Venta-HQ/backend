import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tsconfigPaths()],
	resolve: {
		alias: {
			'@app/apitypes': resolve(__dirname, 'libs/apitypes/src'),
			'@app/auth': resolve(__dirname, 'libs/auth/src'),
			'@app/config': resolve(__dirname, 'libs/config/src'),
			'@app/database': resolve(__dirname, 'libs/database/src'),
			'@app/errors': resolve(__dirname, 'libs/errors/src'),
			'@app/events': resolve(__dirname, 'libs/events/src'),
			'@app/grpc': resolve(__dirname, 'libs/grpc/src'),
			'@app/logger': resolve(__dirname, 'libs/logger/src'),
			'@app/redis': resolve(__dirname, 'libs/redis/src'),
			'@app/search': resolve(__dirname, 'libs/search/src'),
			'@app/upload': resolve(__dirname, 'libs/upload/src'),
			'@app/utils': resolve(__dirname, 'libs/utils/src'),
			'@app/validation': resolve(__dirname, 'libs/validation/src'),
			'@app/proto': resolve(__dirname, 'libs/proto/src/lib'),
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
