/**
 * @rowanmanning/sparse-matrix module
 * @module @rowanmanning/sparse-matrix
 */
'use strict';

const clone = require('rfdc')();

/**
 * Represents a sparse matrix.
 */
module.exports = class SparseMatrix {

	constructor(options) {
		const {defaultData, height, width} = this.constructor.applyDefaultOptions(options);
		this._cellMap = {};
		this._cells = [];
		this._defaultData = defaultData;
		this._height = height;
		this._maxX = width - 1;
		this._maxY = height - 1;
		this._minX = 0;
		this._minY = 0;
		this._width = width;
	}

	toJSON() {
		return this.export();
	}

	set(x, y, data) {
		this._assertValidCoordinates(x, y);
		if (data !== undefined) {
			assertIsPlainObject(data, 'Data must be a plain object');
		}
		return this._set(x, y, data);
	}

	get(x, y) {
		this._assertValidCoordinates(x, y);
		return this._get(x, y);
	}

	has(x, y) {
		this._assertValidCoordinates(x, y);
		return this._has(x, y);
	}

	delete(x, y) {
		this._assertValidCoordinates(x, y);
		return this._delete(x, y);
	}

	forEach(callbackFn, definedCellsOnly = false) {
		const loop = (definedCellsOnly ? this._eachDefinedCell : this._eachCell);
		loop.call(this, callbackFn);
	}

	export() {
		return clone(this._cells);
	}

	import(cells) {
		if (!Array.isArray(cells)) {
			throw new TypeError('Imported cells must be an array');
		}
		cells.forEach(cell => {
			assertIsPlainObject(cell, 'Imported cells must be plain objects');
			const {x, y, data} = cell;
			this.set(x, y, data);
		});
		return this;
	}

	isValidX(x) {
		return (Number.isInteger(x) && x >= this._minX && x <= this._maxX);
	}

	isValidY(y) {
		return (Number.isInteger(y) && y >= this._minY && y <= this._maxY);
	}

	_set(x, y, data) {
		let cell;
		if (data === undefined) {
			return this._delete(x, y);
		}
		if (!this._cellMap[x]) {
			this._cellMap[x] = {};
		}
		if (this._cellMap[x][y]) {
			cell = this._cellMap[x][y];
		} else {
			cell = this._cellMap[x][y] = {x, y};
			this._cells.push(cell);
		}
		cell.data = clone(data);
		return this;
	}

	_get(x, y) {
		if (this._has(x, y)) {
			return clone(this._cellMap[x][y]);
		}
		return clone({x, y, data: this._defaultData});
	}

	_has(x, y) {
		return Boolean(this._cellMap[x] && this._cellMap[x][y]);
	}

	_delete(x, y) {
		if (this._cellMap[x] && this._cellMap[x][y]) {
			this._cells.splice(this._cells.indexOf(this._cellMap[x][y]), 1);
			delete this._cellMap[x][y];
		}
		return this;
	}

	_eachCell(callbackFn) {
		let index = 0;
		for (let x = 0; x < this._width; x += 1) {
			for (let y = 0; y < this._height; y += 1) {
				callbackFn(this._get(x, y), index);
				index += 1;
			}
		}
	}

	_eachDefinedCell(callbackFn) {
		this._cells.forEach((cell, index) => {
			callbackFn(clone(cell), index);
		});
	}

	_assertValidX(x) {
		if (!this.isValidX(x)) {
			throw new RangeError(`X must be an integer between ${this._minX} and ${this._maxX}`);
		}
	}

	_assertValidY(y) {
		if (!this.isValidY(y)) {
			throw new RangeError(`Y must be an integer between ${this._minY} and ${this._maxY}`);
		}
	}

	_assertValidCoordinates(x, y) {
		this._assertValidX(x);
		this._assertValidY(y);
	}

	static applyDefaultOptions(options) {
		return Object.assign({}, this.defaultOptions, options);
	}

};

module.exports.defaultOptions = {
	defaultData: {},
	height: 30,
	width: 30
};

function assertIsPlainObject(value, message) {
	if (!isPlainObject(value)) {
		throw new TypeError(message);
	}
}

function isPlainObject(value) {
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value) &&
		Object.prototype.toString(value) === '[object Object]'
	);
}
