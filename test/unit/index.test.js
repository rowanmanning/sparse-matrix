'use strict';

const assert = require('proclaim');

describe('index', () => {
	let index;
	let SparseMatrix;

	beforeEach(() => {
		index = require('../../index');
		SparseMatrix = require('../../lib/sparse-matrix');
	});

	it('aliases `lib/sparse-matrix`', () => {
		assert.strictEqual(index, SparseMatrix);
	});

});
