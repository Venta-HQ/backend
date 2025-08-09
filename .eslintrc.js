module.exports = {
	root: true,
	env: { node: true },
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		tsconfigRootDir: __dirname,
		// Keep type-aware rules optional; if you enable them, point to real tsconfig files only
		// project: ['./tsconfig.json', './domains/**/tsconfig*.json', './libs/**/tsconfig*.json'],
	},
	plugins: ['@typescript-eslint'],
	extends: [
		'plugin:@typescript-eslint/recommended',
		// Enable later when ready for type-aware rules
		// 'plugin:@typescript-eslint/recommended-requiring-type-checking',
		'prettier',
	],
	ignorePatterns: [
		// build outputs
		'dist',
		'coverage',
		'**/node_modules/**',
		// generated/codegen outputs
		'**/generated/**',
		'**/*.gen.ts',
		'**/*.pb.ts',
		'**/*.grpc.ts',
		'**/*.proto.ts',
		'**/proto/**',
		'test/**',

		// Temporarily ignored
		'**/*.spec.ts',
	],
	rules: {
		'@typescript-eslint/no-explicit-any': 'off',
		// Underscore-prefixed vars/args are treated as intentionally unused
		'@typescript-eslint/no-unused-vars': [
			'warn',
			{
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_',
				ignoreRestSiblings: true,
			},
		],
		// '@typescript-eslint/explicit-function-return-type': 'error',
		'@typescript-eslint/no-namespace': 'off',
	},
	overrides: [
		{
			files: ['**/*.spec.ts', '**/*.test.ts'],
			rules: {
				'@typescript-eslint/no-explicit-any': 'off',
				'@typescript-eslint/no-empty-function': 'off',
				'@typescript-eslint/ban-ts-comment': 'off',
			},
		},
	],
};
