'use strict';

const assert = require('proclaim');
const sinon = require('sinon');

describe('lib/sparse-matrix', () => {
	let SparseMatrix;

	beforeEach(() => {
		SparseMatrix = require('../../../lib/sparse-matrix');
	});

	describe('new SparseMatrix(options)', () => {
		let instance;
		let options;

		beforeEach(() => {
			sinon.spy(SparseMatrix, '_applyDefaultOptions');
			options = {
				defaultData: {isDefaultData: true},
				rowCount: 4,
				colCount: 4
			};
			instance = new SparseMatrix(options);
		});

		it('defaults the options', () => {
			assert.calledOnce(SparseMatrix._applyDefaultOptions);
			assert.calledWithExactly(SparseMatrix._applyDefaultOptions, options);
		});

		describe('.toJSON()', () => {
			let returnValue;

			beforeEach(() => {
				returnValue = instance.toJSON();
			});

			it('returns an array representing the cells', () => {
				assert.isArray(returnValue);
				assert.lengthEquals(returnValue, 0);
			});

			it('returns a copied array, not a reference to an internal', () => {
				returnValue.push(1);
				assert.notStrictEqual(instance.toJSON(), returnValue);
			});

		});

		describe('.set(x, y, data)', () => {
			let data;
			let returnValue;

			beforeEach(() => {
				sinon.stub(instance, '_assertValidCoordinates');
				data = {isSetData: true};
				returnValue = instance.set(1, 2, data);
			});

			it('asserts that `x` and `y` are valid coordinates', () => {
				assert.calledOnce(instance._assertValidCoordinates);
				assert.calledWithExactly(instance._assertValidCoordinates, 1, 2);
			});

			it('adds the cell data for the given coordinates', () => {
				const cells = instance.toJSON();
				assert.deepEqual(cells, [
					{x: 1, y: 2, data}
				]);
				assert.notStrictEqual(cells[0].data, data);
			});

			it('does not modify the input value', () => {
				assert.deepEqual(data, {isSetData: true});
			});

			it('returns the SparseMatrix instance', () => {
				assert.strictEqual(returnValue, instance);
			});

			describe('when the cell at the given coordinates already exists', () => {
				let newData;

				beforeEach(() => {
					newData = {isNewSetData: true};
					instance.set(1, 2, newData);
				});

				it('overrides the cell data for the given coordinates', () => {
					const cells = instance.toJSON();
					assert.deepEqual(cells, [
						{x: 1, y: 2, data: newData}
					]);
					assert.notStrictEqual(cells[0].data, newData);
				});

				it('does not modify the original values', () => {
					assert.deepEqual(data, {isSetData: true});
					assert.deepEqual(newData, {isNewSetData: true});
				});

			});

			describe('when data is not a plain object or undefined', () => {
				let caughtError;

				beforeEach(() => {
					try {
						instance.set(1, 2, null);
					} catch (error) {
						caughtError = error;
					}
				});

				it('throws a TypeError', () => {
					assert.isInstanceOf(caughtError, TypeError);
					assert.strictEqual(caughtError.message, 'Data must be a plain object');
				});

			});

			describe('when data is undefined', () => {

				beforeEach(() => {
					instance.set(1, 2);
				});

				it('removes cell data for a cell', () => {
					assert.deepEqual(instance.toJSON(), []);
				});

			});

		});

		describe('.get(x, y)', () => {
			let returnValue;

			beforeEach(() => {
				sinon.stub(instance, '_assertValidCoordinates');
				returnValue = instance.get(1, 2);
			});

			it('asserts that `x` and `y` are valid coordinates', () => {
				assert.calledOnce(instance._assertValidCoordinates);
				assert.calledWithExactly(instance._assertValidCoordinates, 1, 2);
			});

			it('returns a copied object representing the cell', () => {
				assert.isObject(returnValue);
				returnValue.data.foo = 'bar';
				assert.isUndefined(instance.get(1, 2).data.foo);
			});

			it('does not modify the instance cell data', () => {
				assert.deepEqual(instance.toJSON(), []);
			});

			describe('.x', () => {
				it('is set to the given `x` value', () => {
					assert.strictEqual(returnValue.x, 1);
				});
			});

			describe('.y', () => {
				it('is set to the given `y` value', () => {
					assert.strictEqual(returnValue.y, 2);
				});
			});

			describe('.data', () => {
				it('is set to a copy of `options.defaultData`', () => {
					assert.deepEqual(returnValue.data, options.defaultData);
					assert.notStrictEqual(returnValue.data, options.defaultData);
				});
			});

			describe('when `set` has been called for the same `x` and `y` values', () => {
				let data;

				beforeEach(() => {
					data = {isSetData: true};
					instance.set(1, 2, data);
					returnValue = instance.get(1, 2);
				});

				describe('.x', () => {
					it('is set to the given `x` value', () => {
						assert.strictEqual(returnValue.x, 1);
					});
				});

				describe('.y', () => {
					it('is set to the given `y` value', () => {
						assert.strictEqual(returnValue.y, 2);
					});
				});

				describe('.data', () => {
					it('is set to a copy of the set data', () => {
						assert.deepEqual(returnValue.data, data);
						assert.notStrictEqual(returnValue.data, data);
					});
				});

			});

		});

		describe('.has(x, y)', () => {
			let data;
			let returnValue;

			beforeEach(() => {
				data = {isSetData: true};
				instance.set(1, 2, data);
				sinon.stub(instance, '_assertValidCoordinates');
				returnValue = instance.has(1, 2);
			});

			it('asserts that `x` and `y` are valid coordinates', () => {
				assert.calledOnce(instance._assertValidCoordinates);
				assert.calledWithExactly(instance._assertValidCoordinates, 1, 2);
			});

			it('returns `true`', () => {
				assert.isTrue(returnValue);
			});

			describe('when the cell has no data', () => {

				beforeEach(() => {
					returnValue = instance.has(2, 1);
				});

				it('returns `false`', () => {
					assert.isFalse(returnValue);
				});

			});

		});

		describe('.delete(x, y)', () => {
			let data;
			let returnValue;

			beforeEach(() => {
				data = {isSetData: true};
				instance.set(1, 2, data);
				sinon.stub(instance, '_assertValidCoordinates');
				returnValue = instance.delete(1, 2);
			});

			it('asserts that `x` and `y` are valid coordinates', () => {
				assert.calledOnce(instance._assertValidCoordinates);
				assert.calledWithExactly(instance._assertValidCoordinates, 1, 2);
			});

			it('returns the SparseMatrix instance', () => {
				assert.strictEqual(returnValue, instance);
			});

			it('removes cell data for a cell', () => {
				assert.deepEqual(instance.toJSON(), []);
				assert.deepEqual(instance.get(1, 2).data, options.defaultData);
			});

			describe('when the cell has no data', () => {

				beforeEach(() => {
					returnValue = instance.delete(1, 2);
				});

				it('returns the SparseMatrix instance', () => {
					assert.strictEqual(returnValue, instance);
				});

			});

		});

		describe('.forEach(callbackFn, definedCellsOnly)', () => {
			let dataOneTwo;
			let dataThreeThree;
			let dataZeroZero;
			let callbackFn;
			let returnValue;

			beforeEach(() => {
				dataOneTwo = {isOneTwo: true};
				dataThreeThree = {isThreeThree: true};
				dataZeroZero = {isZeroZero: true};
				instance.set(1, 2, dataOneTwo);
				instance.set(3, 3, dataThreeThree);
				instance.set(0, 0, dataZeroZero);
				callbackFn = sinon.spy();
				returnValue = instance.forEach(callbackFn);
			});

			it('calls the callback function for each cell regardless of whether it is set', () => {
				assert.callCount(callbackFn, 16);
			});

			it('calls the callback function with the cell coordinates and copied data', () => {
				assert.calledWith(callbackFn.getCall(0), {x: 0, y: 0, data: dataZeroZero}, 0);
				assert.notStrictEqual(callbackFn.getCall(0).args[0].data, dataZeroZero);
				assert.isUndefined(callbackFn.getCall(0).args[2]);
				assert.calledWith(callbackFn.getCall(1), {x: 0, y: 1, data: options.defaultData}, 1);
				assert.notStrictEqual(callbackFn.getCall(1).args[0].data, options.defaultData);
				assert.isUndefined(callbackFn.getCall(1).args[2]);
				assert.calledWith(callbackFn.getCall(2), {x: 0, y: 2, data: options.defaultData}, 2);
				assert.notStrictEqual(callbackFn.getCall(2).args[0].data, options.defaultData);
				assert.isUndefined(callbackFn.getCall(2).args[2]);
				assert.calledWith(callbackFn.getCall(3), {x: 0, y: 3, data: options.defaultData}, 3);
				assert.notStrictEqual(callbackFn.getCall(3).args[0].data, options.defaultData);
				assert.isUndefined(callbackFn.getCall(3).args[2]);
				assert.calledWith(callbackFn.getCall(4), {x: 1, y: 0, data: options.defaultData}, 4);
				assert.notStrictEqual(callbackFn.getCall(4).args[0].data, options.defaultData);
				assert.isUndefined(callbackFn.getCall(4).args[2]);
				assert.calledWith(callbackFn.getCall(5), {x: 1, y: 1, data: options.defaultData}, 5);
				assert.notStrictEqual(callbackFn.getCall(5).args[0].data, options.defaultData);
				assert.isUndefined(callbackFn.getCall(5).args[2]);
				assert.calledWith(callbackFn.getCall(6), {x: 1, y: 2, data: dataOneTwo}, 6);
				assert.notStrictEqual(callbackFn.getCall(6).args[0].data, dataOneTwo);
				assert.isUndefined(callbackFn.getCall(6).args[2]);
				assert.calledWith(callbackFn.getCall(7), {x: 1, y: 3, data: options.defaultData}, 7);
				assert.notStrictEqual(callbackFn.getCall(7).args[0].data, options.defaultData);
				assert.isUndefined(callbackFn.getCall(7).args[2]);
				assert.calledWith(callbackFn.getCall(8), {x: 2, y: 0, data: options.defaultData}, 8);
				assert.notStrictEqual(callbackFn.getCall(8).args[0].data, options.defaultData);
				assert.isUndefined(callbackFn.getCall(8).args[2]);
				assert.calledWith(callbackFn.getCall(9), {x: 2, y: 1, data: options.defaultData}, 9);
				assert.notStrictEqual(callbackFn.getCall(9).args[0].data, options.defaultData);
				assert.isUndefined(callbackFn.getCall(9).args[2]);
				assert.calledWith(callbackFn.getCall(10), {x: 2, y: 2, data: options.defaultData}, 10);
				assert.notStrictEqual(callbackFn.getCall(10).args[0].data, options.defaultData);
				assert.isUndefined(callbackFn.getCall(10).args[2]);
				assert.calledWith(callbackFn.getCall(11), {x: 2, y: 3, data: options.defaultData}, 11);
				assert.notStrictEqual(callbackFn.getCall(11).args[0].data, options.defaultData);
				assert.isUndefined(callbackFn.getCall(11).args[2]);
				assert.calledWith(callbackFn.getCall(12), {x: 3, y: 0, data: options.defaultData}, 12);
				assert.notStrictEqual(callbackFn.getCall(12).args[0].data, options.defaultData);
				assert.isUndefined(callbackFn.getCall(12).args[2]);
				assert.calledWith(callbackFn.getCall(13), {x: 3, y: 1, data: options.defaultData}, 13);
				assert.notStrictEqual(callbackFn.getCall(13).args[0].data, options.defaultData);
				assert.isUndefined(callbackFn.getCall(13).args[2]);
				assert.calledWith(callbackFn.getCall(14), {x: 3, y: 2, data: options.defaultData}, 14);
				assert.notStrictEqual(callbackFn.getCall(14).args[0].data, options.defaultData);
				assert.isUndefined(callbackFn.getCall(14).args[2]);
				assert.calledWith(callbackFn.getCall(15), {x: 3, y: 3, data: dataThreeThree}, 15);
				assert.notStrictEqual(callbackFn.getCall(15).args[0].data, dataThreeThree);
				assert.isUndefined(callbackFn.getCall(15).args[2]);
			});

			it('returns nothing', () => {
				assert.isUndefined(returnValue);
			});

			describe('when `definedCellsOnly` is `true`', () => {

				beforeEach(() => {
					callbackFn = sinon.spy();
					returnValue = instance.forEach(callbackFn, true);
				});

				it('calls the callback function for each cell that has data', () => {
					assert.callCount(callbackFn, 3);
				});

				it('calls the callback function with the cell coordinates and copied data in order of when it was defined', () => {
					assert.calledWith(callbackFn.getCall(0), {x: 1, y: 2, data: dataOneTwo}, 0);
					assert.notStrictEqual(callbackFn.getCall(0).args[0].data, dataOneTwo);
					assert.isUndefined(callbackFn.getCall(0).args[2]);
					assert.calledWith(callbackFn.getCall(1), {x: 3, y: 3, data: dataThreeThree}, 1);
					assert.notStrictEqual(callbackFn.getCall(1).args[0].data, dataThreeThree);
					assert.isUndefined(callbackFn.getCall(1).args[2]);
					assert.calledWith(callbackFn.getCall(2), {x: 0, y: 0, data: dataZeroZero}, 2);
					assert.notStrictEqual(callbackFn.getCall(2).args[0].data, dataZeroZero);
					assert.isUndefined(callbackFn.getCall(2).args[2]);
				});

				it('returns nothing', () => {
					assert.isUndefined(returnValue);
				});

			});

		});

		describe('.export()', () => {
			let dataOneTwo;
			let dataThreeThree;
			let dataZeroZero;
			let returnValue;

			beforeEach(() => {
				dataOneTwo = {isOneTwo: true};
				dataThreeThree = {isThreeThree: true};
				dataZeroZero = {isZeroZero: true};
				instance.set(1, 2, dataOneTwo);
				instance.set(3, 3, dataThreeThree);
				instance.set(0, 0, dataZeroZero);
				returnValue = instance.export();
			});

			it('returns a copied array representing the cells', () => {
				assert.isArray(returnValue);
				assert.lengthEquals(returnValue, 3);
				assert.deepEqual(returnValue, [
					{x: 1, y: 2, data: dataOneTwo},
					{x: 3, y: 3, data: dataThreeThree},
					{x: 0, y: 0, data: dataZeroZero}
				]);
				assert.notStrictEqual(returnValue[0].data, dataOneTwo);
				assert.notStrictEqual(returnValue[1].data, dataThreeThree);
				assert.notStrictEqual(returnValue[2].data, dataZeroZero);
			});

		});

		describe('.import(cells)', () => {
			let dataOneTwo;
			let dataThreeThree;
			let dataZeroZero;
			let returnValue;

			beforeEach(() => {
				sinon.stub(instance, 'set');
				dataOneTwo = {isOneTwo: true};
				dataThreeThree = {isThreeThree: true};
				dataZeroZero = {isZeroZero: true};
				returnValue = instance.import([
					{x: 1, y: 2, data: dataOneTwo},
					{x: 3, y: 3, data: dataThreeThree},
					{x: 0, y: 0, data: dataZeroZero}
				]);
			});

			it('sets each item in the cells array', () => {
				assert.calledThrice(instance.set);
				assert.calledWithExactly(instance.set, 1, 2, dataOneTwo);
				assert.calledWithExactly(instance.set, 3, 3, dataThreeThree);
				assert.calledWithExactly(instance.set, 0, 0, dataZeroZero);
			});

			it('returns the SparseMatrix instance', () => {
				assert.strictEqual(returnValue, instance);
			});

			describe('when `cells` is not an array', () => {
				let caughtError;

				beforeEach(() => {
					try {
						instance.import({
							0: {x: 1, y: 2, data: dataOneTwo},
							1: {x: 3, y: 3, data: dataThreeThree},
							2: {x: 0, y: 0, data: dataZeroZero}
						});
					} catch (error) {
						caughtError = error;
					}
				});

				it('throws a TypeError', () => {
					assert.isInstanceOf(caughtError, TypeError);
					assert.strictEqual(caughtError.message, 'Imported cells must be an array');
				});

			});

			describe('when a cell is not a plain object', () => {

				it('throws a TypeError', () => {
					const expectedError = 'Imported cells must be plain objects';

					const importCellAsArray = () => instance.import([[]]);
					assert.throws(importCellAsArray, TypeError);
					assert.throws(importCellAsArray, expectedError);

					const importCellAsString = () => instance.import(['']);
					assert.throws(importCellAsString, TypeError);
					assert.throws(importCellAsString, expectedError);

					const importCellAsNull = () => instance.import([null]);
					assert.throws(importCellAsNull, TypeError);
					assert.throws(importCellAsNull, expectedError);
				});

			});

		});

		describe('.isValidX(x)', () => {

			it('returns `true`', () => {
				assert.isTrue(instance.isValidX(0));
				assert.isTrue(instance.isValidX(1));
				assert.isTrue(instance.isValidX(2));
				assert.isTrue(instance.isValidX(3));
			});

			describe('when `x` is less than 0', () => {
				it('returns `false`', () => {
					assert.isFalse(instance.isValidX(-1));
				});
			});

			describe('when `x` is greater than than the max value based on `options.colCount`', () => {
				it('returns `false`', () => {
					assert.isFalse(instance.isValidX(4));
				});
			});

			describe('when `x` is not an integer', () => {
				it('returns `false`', () => {
					assert.isFalse(instance.isValidX(1.37));
				});
			});

		});

		describe('.isValidY(y)', () => {

			it('returns `true`', () => {
				assert.isTrue(instance.isValidY(0));
				assert.isTrue(instance.isValidY(1));
				assert.isTrue(instance.isValidY(2));
				assert.isTrue(instance.isValidY(3));
			});

			describe('when `y` is less than 0', () => {
				it('returns `false`', () => {
					assert.isFalse(instance.isValidY(-1));
				});
			});

			describe('when `y` is greater than than the max value based on `options.colCount`', () => {
				it('returns `false`', () => {
					assert.isFalse(instance.isValidY(4));
				});
			});

			describe('when `y` is not an integer', () => {
				it('returns `false`', () => {
					assert.isFalse(instance.isValidY(1.37));
				});
			});

		});

		describe('._assertValidX(x)', () => {
			let returnValue;

			beforeEach(() => {
				sinon.stub(instance, 'isValidX').returns(true);
				returnValue = instance._assertValidX(137);
			});

			it('calls `isValidX` with `x`', () => {
				assert.calledOnce(instance.isValidX);
				assert.calledWithExactly(instance.isValidX, 137);
			});

			it('returns nothing', () => {
				assert.isUndefined(returnValue);
			});

			describe('when `isValidX` returns `false`', () => {
				let caughtError;

				beforeEach(() => {
					instance.isValidX.returns(false);
					try {
						instance._assertValidX(137);
					} catch (error) {
						caughtError = error;
					}
				});

				it('throws a RangeError', () => {
					assert.isInstanceOf(caughtError, RangeError);
					assert.strictEqual(caughtError.message, 'X must be an integer between 0 and 3');
				});

			});

		});

		describe('._assertValidY(y)', () => {
			let returnValue;

			beforeEach(() => {
				sinon.stub(instance, 'isValidY').returns(true);
				returnValue = instance._assertValidY(137);
			});

			it('calls `isValidY` with `y`', () => {
				assert.calledOnce(instance.isValidY);
				assert.calledWithExactly(instance.isValidY, 137);
			});

			it('returns nothing', () => {
				assert.isUndefined(returnValue);
			});

			describe('when `isValidY` returns `false`', () => {
				let caughtError;

				beforeEach(() => {
					instance.isValidY.returns(false);
					try {
						instance._assertValidY(137);
					} catch (error) {
						caughtError = error;
					}
				});

				it('throws a RangeError', () => {
					assert.isInstanceOf(caughtError, RangeError);
					assert.strictEqual(caughtError.message, 'Y must be an integer between 0 and 3');
				});

			});

		});

		describe('._assertValidCoordinates(x, y)', () => {
			let returnValue;

			beforeEach(() => {
				sinon.stub(instance, '_assertValidX');
				sinon.stub(instance, '_assertValidY');
				instance._assertValidCoordinates(137, 731);
			});

			it('calls `_assertValidX` with `x`', () => {
				assert.calledOnce(instance._assertValidX);
				assert.calledWithExactly(instance._assertValidX, 137);
			});

			it('calls `_assertValidY` with `y`', () => {
				assert.calledOnce(instance._assertValidY);
				assert.calledWithExactly(instance._assertValidY, 731);
			});

			it('returns nothing', () => {
				assert.isUndefined(returnValue);
			});

			describe('when `_assertValidX` throws', () => {
				let assertionError;
				let caughtError;

				beforeEach(() => {
					assertionError = new Error('assertion error');
					instance._assertValidX.throws(assertionError);
					try {
						instance._assertValidCoordinates(137, 731);
					} catch (error) {
						caughtError = error;
					}
				});

				it('throws the error', () => {
					assert.strictEqual(caughtError, assertionError);
				});

			});

			describe('when `_assertValidY` throws', () => {
				let assertionError;
				let caughtError;

				beforeEach(() => {
					assertionError = new Error('assertion error');
					instance._assertValidY.throws(assertionError);
					try {
						instance._assertValidCoordinates(137, 731);
					} catch (error) {
						caughtError = error;
					}
				});

				it('throws the error', () => {
					assert.strictEqual(caughtError, assertionError);
				});

			});

		});

	});

	describe('SparseMatrix.defaultOptions', () => {

		describe('.defaultData', () => {
			it('is set to an empty object', () => {
				assert.deepEqual(SparseMatrix.defaultOptions.defaultData, {});
			});
		});

		describe('.rowCount', () => {
			it('is set to `30`', () => {
				assert.strictEqual(SparseMatrix.defaultOptions.rowCount, 30);
			});
		});

		describe('.colCount', () => {
			it('is set to `30`', () => {
				assert.strictEqual(SparseMatrix.defaultOptions.colCount, 30);
			});
		});

	});

	describe('SparseMatrix._applyDefaultOptions(options)', () => {
		let options;
		let returnValue;

		beforeEach(() => {
			sinon.spy(Object, 'assign');
			SparseMatrix.defaultOptions = {isDefaultOptions: true};
			options = {isOptions: true};
			returnValue = SparseMatrix._applyDefaultOptions(options);
		});

		it('merges the passed in options with some defaults', () => {
			assert.calledOnce(Object.assign);
			assert.isObject(Object.assign.firstCall.args[0]);
			assert.notStrictEqual(Object.assign.firstCall.args[0], options);
			assert.notStrictEqual(Object.assign.firstCall.args[0], SparseMatrix.defaultOptions);
			assert.strictEqual(Object.assign.firstCall.args[1], SparseMatrix.defaultOptions);
			assert.strictEqual(Object.assign.firstCall.args[2], options);
		});

		it('returns the merged options', () => {
			assert.strictEqual(returnValue, Object.assign.firstCall.returnValue);
		});

	});

});
