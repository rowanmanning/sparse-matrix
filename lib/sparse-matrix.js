/**
 * @rowanmanning/sparse-matrix module
 * @module @rowanmanning/sparse-matrix
 */
'use strict';

const clone = require('rfdc')();

/**
 * Represents a sparse matrix.
 */
const SparseMatrix = module.exports = class SparseMatrix {

	/**
	 * Class constructor.
	 *
	 * @access public
	 * @param {Object} [options={}]
	 *     An options object used to configure the matrix.
	 * @param {Object} [options.defaultData={}]
	 *     The default data to send if a cell does not have any data.
	 * @param {Number} [options.rowCount=30]
	 *     The number of rows in the matrix.
	 * @param {Number} [options.columnCount=30]
	 *     The number of columns in the matrix.
	 */
	constructor(options) {
		const {defaultData, rowCount, columnCount} = SparseMatrix._applyDefaultOptions(options);
		this._cellMap = {};
		this._cells = [];
		this._defaultData = defaultData;
		this._rowCount = rowCount;
		this._firstRow = 0;
		this._lastRow = rowCount - 1;
		this._columnCount = columnCount;
		this._firstCol = 0;
		this._lastCol = columnCount - 1;
	}

	/**
	 * Get the number of columns in the matrix.
	 *
	 * @type {Number}
	 */
	get columnCount() {
		return this._columnCount;
	}

	/**
	 * Get the number of rows in the matrix.
	 *
	 * @type {Number}
	 */
	get rowCount() {
		return this._rowCount;
	}

	/**
	 * Get the number of columns in the matrix.
	 *
	 * @type {Number}
	 */
	get width() {
		return this._columnCount;
	}

	/**
	 * Get the number of rows in the matrix.
	 *
	 * @type {Number}
	 */
	get height() {
		return this._rowCount;
	}

	/**
	 * Get a JSON representation of the matrix.
	 *
	 * @access public
	 * @returns {Array}
	 *     Returns the matrix as a JSON-safe array.
	 */
	toJSON() {
		return this.export();
	}

	/**
	 * Store some data in the cell at `x` and `y` coordinates.
	 *
	 * @access public
	 * @param {Number} x
	 *     The x coordinate. Must be a positive integer less than
	 *     number of columns in the matrix.
	 * @param {Number} y
	 *     The y coordinate. Must be a positive integer less than
	 *     number of columns in the matrix.
	 * @param {Object} data
	 *     The data to store in the cell. This overrides any
	 *     existing data.
	 * @returns {SparseMatrix}
	 *     Returns the sparse matrix instance.
	 * @throws {RangeError}
	 *     Throws if the `x` or `y` coordinate is out of bounds.
	 * @throws {TypeError}
	 *     Throws if `data` is not an object.
	 */
	set(x, y, data) {
		this._assertValidCoordinates(x, y);
		if (data !== undefined) {
			assertIsPlainObject(data, 'Data must be a plain object');
		}
		return this._set(x, y, data);
	}

	/**
	 * Get the cell at the `x` and `y` coordinates.
	 *
	 * @access public
	 * @param {Number} x
	 *     The x coordinate. Must be a positive integer less than
	 *     number of columns in the matrix.
	 * @param {Number} y
	 *     The y coordinate. Must be a positive integer less than
	 *     number of columns in the matrix.
	 * @returns {Cell}
	 *     Returns the requested cell.
	 * @throws {RangeError}
	 *     Throws if the `x` or `y` coordinate is out of bounds.
	 */
	get(x, y) {
		this._assertValidCoordinates(x, y);
		return this._get(x, y);
	}

	/**
	 * Get whether the cell at the `x` and `y` coordinates has data.
	 *
	 * @access public
	 * @param {Number} x
	 *     The x coordinate. Must be a positive integer less than
	 *     number of columns in the matrix.
	 * @param {Number} y
	 *     The y coordinate. Must be a positive integer less than
	 *     number of columns in the matrix.
	 * @returns {Boolean}
	 *     Returns whether the specified cell has data.
	 * @throws {RangeError}
	 *     Throws if the `x` or `y` coordinate is out of bounds.
	 */
	has(x, y) {
		this._assertValidCoordinates(x, y);
		return this._has(x, y);
	}

	/**
	 * Delete the cell at the `x` and `y` coordinates.
	 *
	 * @access public
	 * @param {Number} x
	 *     The x coordinate. Must be a positive integer less than
	 *     number of columns in the matrix.
	 * @param {Number} y
	 *     The y coordinate. Must be a positive integer less than
	 *     number of columns in the matrix.
	 * @returns {SparseMatrix}
	 *     Returns the sparse matrix instance.
	 * @throws {RangeError}
	 *     Throws if the `x` or `y` coordinate is out of bounds.
	 */
	delete(x, y) {
		this._assertValidCoordinates(x, y);
		return this._delete(x, y);
	}

	/**
	 * Execute a function on each cell in the matrix.
	 *
	 * @access public
	 * @param {ForEachCallback} callbackFn
	 *     The function to call for each cell.
	 * @param {Boolean} [definedCellsOnly=false]
	 *     Whether to only include cells which have data specified.
	 * @returns {undefined}
	 *     Returns nothing.
	 */
	forEach(callbackFn, definedCellsOnly = false) {
		const loop = (definedCellsOnly ? this._eachDefinedCell : this._eachCell);
		loop.call(this, callbackFn);
	}

	/**
	 * Export the matrix cell data in a format that can be re-imported.
	 *
	 * @access public
	 * @returns {Array}
	 *     Returns the matrix represented as an array.
	 */
	export() {
		return clone(this._cells);
	}

	/**
	 * Import an array of cells.
	 *
	 * @access public
	 * @param {Array<Cell>} cells
	 *     The cells to import.
	 * @returns {SparseMatrix}
	 *     Returns the sparse matrix instance.
	 * @throws {RangeError}
	 *     Throws if the `x` or `y` coordinate of any cell is out of bounds.
	 * @throws {TypeError}
	 *     Throws if the `data` of any cell is not an object.
	 * @throws {TypeError}
	 *     Throws if any of the cells are not objects.
	 * @throws {TypeError}
	 *     Throws if `cells` is not an array.
	 */
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

	/**
	 * Get whether the given `x` coordinate is valid.
	 *
	 * @access public
	 * @param {Number} x
	 *     The x coordinate. Must be a positive integer less than
	 *     number of columns in the matrix.
	 * @returns {Boolean}
	 *     Returns whether the coordinate is valid.
	 */
	isValidX(x) {
		return (Number.isInteger(x) && x >= this._firstCol && x <= this._lastCol);
	}

	/**
	 * Get whether the given `y` coordinate is valid.
	 *
	 * @access public
	 * @param {Number} y
	 *     The y coordinate. Must be a positive integer less than
	 *     number of columns in the matrix.
	 * @returns {Boolean}
	 *     Returns whether the coordinate is valid.
	 */
	isValidY(y) {
		return (Number.isInteger(y) && y >= this._firstRow && y <= this._lastRow);
	}

	/**
	 * Store some data in the cell at `x` and `y` coordinates.
	 *
	 * @access private
	 * @param {Number} x
	 *     {@see SparseMatrix#set}
	 * @param {Number} y
	 *     {@see SparseMatrix#set}
	 * @param {Object} data
	 *     {@see SparseMatrix#set}
	 * @returns {SparseMatrix}
	 *     Returns the sparse matrix instance.
	 */
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
		if (typeof this.transformSetData === 'function') {
			cell.data = this.transformSetData(cell.data);
		}
		return this;
	}

	/**
	 * Get the cell at the `x` and `y` coordinates.
	 *
	 * @access private
	 * @param {Number} x
	 *     {@see SparseMatrix#get}
	 * @param {Number} y
	 *     {@see SparseMatrix#get}
	 * @returns {Cell}
	 *     Returns the requested cell.
	 */
	_get(x, y) {
		let data;
		if (this._has(x, y)) {
			data = this._cellMap[x][y].data;
		} else {
			data = this._defaultData;
		}
		data = clone(data);
		if (typeof this.transformGetData === 'function') {
			data = this.transformGetData(data);
		}
		return {x, y, data};
	}

	/**
	 * Get whether the cell at the `x` and `y` coordinates has data.
	 *
	 * @access private
	 * @param {Number} x
	 *     {@see SparseMatrix#has}
	 * @param {Number} y
	 *     {@see SparseMatrix#has}
	 * @returns {Boolean}
	 *     Returns whether the specified cell has data.
	 */
	_has(x, y) {
		return Boolean(this._cellMap[x] && this._cellMap[x][y]);
	}

	/**
	 * Delete the cell at the `x` and `y` coordinates.
	 *
	 * @access private
	 * @param {Number} x
	 *     {@see SparseMatrix#delete}
	 * @param {Number} y
	 *     {@see SparseMatrix#delete}
	 * @returns {SparseMatrix}
	 *     Returns the sparse matrix instance.
	 */
	_delete(x, y) {
		if (this._cellMap[x] && this._cellMap[x][y]) {
			this._cells.splice(this._cells.indexOf(this._cellMap[x][y]), 1);
			delete this._cellMap[x][y];
		}
		return this;
	}

	/**
	 * Execute a function on each cell in the matrix.
	 *
	 * @access private
	 * @param {ForEachCallback} callbackFn
	 *     The function to call for each cell.
	 * @returns {undefined}
	 *     Returns nothing.
	 */
	_eachCell(callbackFn) {
		let index = 0;
		for (let x = 0; x < this._columnCount; x += 1) {
			for (let y = 0; y < this._rowCount; y += 1) {
				callbackFn(this._get(x, y), index);
				index += 1;
			}
		}
	}

	/**
	 * Execute a function on each cell in the matrix that has data defined.
	 *
	 * @access private
	 * @param {ForEachCallback} callbackFn
	 *     The function to call for each cell.
	 * @returns {undefined}
	 *     Returns nothing.
	 */
	_eachDefinedCell(callbackFn) {
		this._cells.forEach((cell, index) => {
			callbackFn(clone(cell), index);
		});
	}

	/**
	 * Assert that the given `x` coordinate is valid, throwing if it's not.
	 *
	 * @access private
	 * @param {Number} x
	 *     The x coordinate. Must be a positive integer less than
	 *     number of columns in the matrix.
	 * @returns {undefined}
	 *     Returns nothing.
	 * @throws {RangeError}
	 *     Throws if the `x` coordinate is out of bounds.
	 */
	_assertValidX(x) {
		if (!this.isValidX(x)) {
			throw new RangeError(
				`X must be an integer between ${this._firstCol} and ${this._lastCol}`
			);
		}
	}

	/**
	 * Assert that the given `y` coordinate is valid, throwing if it's not.
	 *
	 * @access private
	 * @param {Number} y
	 *     The y coordinate. Must be a positive integer less than
	 *     number of columns in the matrix.
	 * @returns {undefined}
	 *     Returns nothing.
	 * @throws {RangeError}
	 *     Throws if the `y` coordinate is out of bounds.
	 */
	_assertValidY(y) {
		if (!this.isValidY(y)) {
			throw new RangeError(
				`Y must be an integer between ${this._firstRow} and ${this._lastRow}`
			);
		}
	}

	/**
	 * Assert that the given `x` and `y` coordinates are valid,
	 * throwing if they're not.
	 *
	 * @access private
	 * @param {Number} x
	 *     The x coordinate. Must be a positive integer less than
	 *     number of columns in the matrix.
	 * @param {Number} y
	 *     The y coordinate. Must be a positive integer less than
	 *     number of columns in the matrix.
	 * @returns {undefined}
	 *     Returns nothing.
	 * @throws {RangeError}
	 *     Throws if the `x` or `y` coordinate is out of bounds.
	 */
	_assertValidCoordinates(x, y) {
		this._assertValidX(x);
		this._assertValidY(y);
	}

	/**
	 * Default user options.
	 *
	 * @access private
	 * @param {Object} [options={}]
	 *     {@see SparseMatrix#constructor}
	 * @returns {Object}
	 *     Returns the defaulted options.
	 */
	static _applyDefaultOptions(options) {
		return Object.assign({}, SparseMatrix._defaultOptions, options);
	}

};

/**
 * Default options to be used in construction of a sparse matrix.
 *
 * @access private
 * @type {Object}
 */
SparseMatrix._defaultOptions = {
	defaultData: {},
	rowCount: 30,
	columnCount: 30
};

/**
 * Assert that a value is a plain object, throwing if not.
 *
 * @access private
 * @param {*} value
 *     The value to check.
 * @param {String} message
 *     The error message to throw if `value` is not an object.
 * @returns {undefined}
 *     Returns nothing.
 * @throws {TypeError}
 *     Throws if `value` is not an object.
 */
function assertIsPlainObject(value, message) {
	if (!isPlainObject(value)) {
		throw new TypeError(message);
	}
}

/**
 * Check whether a value is a plain object.
 *
 * @access private
 * @param {*} value
 *     The value to check.
 * @returns {Boolean}
 *     Returns whether `value` is a plain object.
 */
function isPlainObject(value) {
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value) &&
		Object.prototype.toString(value) === '[object Object]'
	);
}

/**
 * @typedef {Object} Cell
 * @property {Number} x
 *     The x coordinate of the cell in the matrix.
 * @property {Number} y
 *     The y coordinate of the cell in the matrix.
 * @property {Object} data
 *     The data stored in the cell.
 */

/**
 * @callback ForEachCallback
 * @param {Cell} cell
 *     The current cell.
 * @param {Number} index
 *     The current iteration.
 * @returns {undefined}
 *     Returns nothing.
 */
