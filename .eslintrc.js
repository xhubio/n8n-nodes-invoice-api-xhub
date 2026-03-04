module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: './tsconfig.json',
		tsconfigRootDir: __dirname,
	},
	plugins: ['@typescript-eslint', 'n8n-nodes-base'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:n8n-nodes-base/nodes',
		'plugin:n8n-nodes-base/credentials',
	],
	ignorePatterns: ['dist/**', 'node_modules/**', '*.js'],
	rules: {
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		'n8n-nodes-base/node-execute-block-missing-continue-on-fail': 'off',
		// Allow HTTP URLs for external documentation (community nodes)
		'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
	},
};
