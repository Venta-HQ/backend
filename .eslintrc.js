module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: 'tsconfig.json',
		tsconfigRootDir: __dirname,
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint/eslint-plugin', 'sort-destructure-keys', 'sort-keys', 'typescript-sort-keys'],
	extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
	root: true,
	env: {
		node: true,
		jest: true,
	},
	ignorePatterns: ['*.config.js', '*.js', '*.json', 'scripts', 'dist', '*.yaml', '*.yml', 'libs/proto/src/lib/*'],
	rules: {
		'no-empty-function': 'off',
		'@typescript-eslint/no-empty-function': 'off',
		'@typescript-eslint/interface-name-prefix': 'off',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'prefer-const': 'error',
		'sort-destructure-keys/sort-destructure-keys': 'error',
		'sort-keys': 'off',
		'sort-keys/sort-keys-fix': 'error',
		'typescript-sort-keys/interface': 'error',
		'typescript-sort-keys/string-enum': 'error',
		'no-unused-vars': 'off',
		'@typescript-eslint/no-empty-interface': 'off',
		'@typescript-eslint/no-inferrable-types': 'off',
		'@typescript-eslint/no-non-null-assertion': 'off',
		'@typescript-eslint/no-shadow': 'error',
		'@typescript-eslint/no-unnecessary-type-constraint': 'off',
		'no-constant-condition': 'off',
		'no-extra-boolean-cast': 'off',
		'no-shadow': 'off',
		'@typescript-eslint/no-unused-vars': [
			'error',
			{
				argsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_',
				destructuredArrayIgnorePattern: '^_',
				ignoreRestSiblings: true,
				varsIgnorePattern: '^_',
			},
		],
	},
};
