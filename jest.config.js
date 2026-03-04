module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleFileExtensions: ['ts', 'js'],
	testMatch: ['**/test/**/*.test.ts'],
	transform: {
		'^.+\\.ts$': 'ts-jest',
	},
	collectCoverageFrom: [
		'credentials/**/*.ts',
		'nodes/**/*.ts',
		'shared/**/*.ts',
		'!**/index.ts',
	],
};
