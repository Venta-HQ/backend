module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		project: './tsconfig.json',
	},
	plugins: ['@typescript-eslint'],
	extends: [
		'eslint:recommended',
		'@typescript-eslint/recommended',
		'@typescript-eslint/recommended-requiring-type-checking',
	],
	rules: {
		// Enforce event emission pattern
		'@typescript-eslint/no-explicit-any': 'error',
		'@typescript-eslint/explicit-function-return-type': 'error',
		// Prevent direct NATS usage outside EventService
		'no-restricted-imports': [
			'error',
			{
				patterns: [
					{
						group: ['@nestjs/microservices'],
						message: 'Use EventService for event emission instead of direct NATS usage',
					},
				],
			},
		],
	},
};
