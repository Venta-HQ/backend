import { defineConfig } from 'vite';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig(() => ({
	root: __dirname,
	cacheDir: '../../node_modules/.vite/libs/utils',
	plugins: [nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
	// Uncomment this if you are using workers.
	// worker: {
	//  plugins: [ nxViteTsPaths() ],
	// },
	test: {
		watch: false,
		globals: true,
		environment: 'node',
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		reporters: ['default'],
		coverage: {
			reportsDirectory: '../../coverage/libs/utils',
			provider: 'v8' as const,
		},
		// Suppress unhandled rejection warnings for retry tests
		onConsoleLog(log, type) {
			if (log.includes('PromiseRejectionHandledWarning')) {
				return false;
			}
		},
		// Suppress unhandled rejections for retry tests
		onUnhandledRejection(reason, promise) {
			// Ignore unhandled rejections in retry tests
			return false;
		},
	},
}));
