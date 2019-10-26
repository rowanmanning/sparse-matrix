'use strict';

module.exports = {
	extends: '@rowanmanning/eslint-config/es2018',
	rules: {
		'id-length': [
			'error',
			{
				min: 2,
				exceptions: [
					'_',
					'$',
					'i',
					'x',
					'y'
				]
			}
		],
		'no-underscore-dangle': 'off',
		'object-property-newline': 'off',
		'max-statements': [
			'warn',
			{
				max: 20
			}
		]
	}
};
