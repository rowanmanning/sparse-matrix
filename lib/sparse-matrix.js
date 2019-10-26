/**
 * @rowanmanning/sparse-matrix module
 * @module @rowanmanning/sparse-matrix
 */
'use strict';

const clone = require('rfdc')();
const EventEmitter = require('eventemitter3');

/**
 * Represents a sparse matrix.
 */
const SparseMatrix = module.exports = class SparseMatrix extends EventEmitter {

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
	 * @param {Array<Cell>} cells
	 *     Predefined cells to add to the matrix.
	 */
	constructor(options) {
		super();
		const {
			defaultData,
			rowCount,
			columnCount,
			cells
		} = SparseMatrix._applyDefaultOptions(options);
		this._cellMap = {};
		this._cells = [];
		this._defaultData = defaultData;
		this._rowCount = rowCount;
		this._firstRow = 0;
		this._lastRow = rowCount - 1;
		this._columnCount = columnCount;
		this._firstColumn = 0;
		this._lastColumn = columnCount - 1;
		if (cells.length) {
			for (const cell of cells) {
				this.set(cell.x, cell.y, cell.data);
			}
		}
	}

	/**
	 * Get the default cell data.
	 *
	 * @type {Object}
	 */
	get defaultData() {
		return this._defaultData;
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
	 * @returns {SparseMatrixExport}
	 *     Returns the matrix represented as an Object.
	 */
	toJSON() {
		return this.export();
	}

	/**
	 * Custom inspect utility.
	 *
	 * @access public
	 * @returns {SparseMatrixExport}
	 *     Returns the matrix represented as an Object.
	 */
	[Symbol.for('nodejs.util.inspect.custom')]() {
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
	 * @fires SparseMatrix#set
	 * @fires SparseMatrix#update
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
	 * @fires SparseMatrix#get
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
	 * @fires SparseMatrix#delete
	 * @fires SparseMatrix#update
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
	 * @returns {SparseMatrixExport}
	 *     Returns the matrix represented as an Object.
	 */
	export() {
		return {
			defaultData: this._defaultData,
			rowCount: this._rowCount,
			columnCount: this._columnCount,
			cells: clone(this._cells)
		};
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
		return (Number.isInteger(x) && x >= this._firstColumn && x <= this._lastColumn);
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
		const eventData = {x, y, data: cell.data};
		this.emit('set', eventData);
		this.emit('update', eventData);
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
		this.emit('get', {x, y, data});
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
		const eventData = {x, y, data: undefined};
		this.emit('delete', eventData);
		this.emit('update', eventData);
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
		this._cells.forEach(({x, y}, index) => {
			callbackFn(this._get(x, y), index);
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
				`X must be an integer between ${this._firstColumn} and ${this._lastColumn}`
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
		options = Object.assign({}, SparseMatrix._defaultOptions, options);
		assertIsPlainObject(
			options.defaultData,
			'The defaultData option must be a plain object'
		);
		assertIsPositiveInteger(
			options.rowCount,
			'The rowCount option must be a positive integer'
		);
		assertIsPositiveInteger(
			options.columnCount,
			'The columnCount option must be a positive integer'
		);
		assertIsArray(
			options.cells,
			'The cells option must be an array'
		);
		if (options.cells.length) {
			options.cells.forEach(cell => {
				assertIsPlainObject(
					cell,
					'Each cell in the cells option must be a plain object'
				);
			});
		}
		return options;
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
	columnCount: 30,
	cells: []
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
 * Assert that a value is a positive integer, throwing if not.
 *
 * @access private
 * @param {*} value
 *     The value to check.
 * @param {String} message
 *     The error message to throw if `value` is a positive integer.
 * @returns {undefined}
 *     Returns nothing.
 * @throws {TypeError}
 *     Throws if `value` is a positive integer.
 */
function assertIsPositiveInteger(value, message) {
	if (!isPositiveInteger(value)) {
		throw new TypeError(message);
	}
}

/**
 * Check whether a value is a positive integer.
 *
 * @access private
 * @param {*} value
 *     The value to check.
 * @returns {Boolean}
 *     Returns whether `value` is a positive integer.
 */
function isPositiveInteger(value) {
	return (
		Number.isInteger(value) &&
		value > 0
	);
}

/**
 * Assert that a value is an array, throwing if not.
 *
 * @access private
 * @param {*} value
 *     The value to check.
 * @param {String} message
 *     The error message to throw if `value` is not an array.
 * @returns {undefined}
 *     Returns nothing.
 * @throws {TypeError}
 *     Throws if `value` is not an array.
 */
function assertIsArray(value, message) {
	if (!Array.isArray(value)) {
		throw new TypeError(message);
	}
}

/**
 * @typedef {Object} SparseMatrixExport
 * @property {Object} defaultData
 *     The default data to use if a cell does not have any data.
 * @property {Number} rowCount
 *     The number of rows in the matrix.
 * @property {Number} columnCount
 *     The number of columns in the matrix.
 * @property {Array<Cell>} cells
 *     The defined cells in the matrix.
 */

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

/**
 * Cell update event.
 *
 * @event SparseMatrix#update
 * @type {Cell}
 */

/**
 * Cell set event.
 *
 * @event SparseMatrix#set
 * @type {Cell}
 */

/**
 * Cell delete event.
 *
 * @event SparseMatrix#delete
 * @type {Cell}
 */

/**
 * Cell get event.
 *
 * @event SparseMatrix#get
 * @type {Cell}
 */
