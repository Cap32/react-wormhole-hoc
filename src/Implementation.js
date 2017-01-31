/* eslint-disable no-use-before-define */

import React, { Component, PropTypes } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import shallowCompare from 'react-addons-shallow-compare';
import dotProp from 'dot-prop';
import Emitter from 'emit-lite';

// TODO: should shim `Object.is()`

const isFunction = (t) => typeof t === 'function';
const isNotFunction = (t) => !isFunction(t);
const isObject = (t) => typeof t === 'object';

const map = (object, iterator) => Object.keys(object).map(iterator);
const forEach = (object, iterator) =>
	Object.keys(object).forEach((key) => iterator(object[key], key))
;

const ensure = (validator, errorMessage) => (val) => {
	if (!validator(val)) {
		throw new Error(errorMessage);
	}
	return val;
};

const ensureValue = ensure(isNotFunction, 'Value should NOT be a function.');
const ensureObject = ensure(isObject, 'Value should be an object.');
const ensureFunction = ensure(isFunction, 'Value should be a function.');

export class Wormhole extends Emitter {
	static connect = connect;

	constructor(initialValue) {
		super();

		this._val = ensureValue(initialValue);
	}

	get(path) {
		this.emit('get', path);
		return dotProp.get(this._val, path);
	}

	set(value) {
		const prevValue = this._val;
		this._val = ensureValue(value);
		this.emit('set', value, prevValue);
		if (!Object.is(prevValue, value)) {
			this.emit('change', value, prevValue);
		}
	}

	on(type, fn) {
		super.on(type, fn);
		return () => super.off(type, fn);
	}

	hoc(name, options) {
		return connect({
			getInitial: () => ({ [name]: this }),
			mapProps: () => ({ [name]: this }),
			...options,
		});
	}
}

class ContextTyper {
	constructor(name) {
		this._name = name;
	}

	toType() {
		return {
			[this._name]: PropTypes.object,
		};
	}

	toValue(reactContext) {
		return reactContext[this._name];
	}
}

export function ensureWormholeValue(val) {
	const isValid = val instanceof Wormhole;
	return isValid ? val : new Wormhole(val);
}

export function connect(options) {
	return function hoc(WrappedComponent) {
		const {
			getInitial,
			mapProps = () => ({}),
			mapMethods = () => ({}),
			computed = {},
			contextType = 'wormholes',
			isPure = true,
		} = options || {};

		const contextTyper = new ContextTyper(contextType);

		const displayName =
			WrappedComponent.displayName || WrappedComponent.name || 'Component'
		;

		class ConnectWormhole extends Component {
			static displayName = `ConnectWormhole(${displayName})`;

			static WrappedComponent = WrappedComponent;

			static contextTypes = contextTyper.toType();

			componentWillMount() {
				const { context } = this;
				const state = {};
				this._unsubscribes = [];

				const setUpState = (prop, wormhole) => {
					state[prop] = wormhole.get();
					this._unsubscribes.push(wormhole.on('change', (nextValue) => {
						this.setState({ [prop]: nextValue });
					}));
					return wormhole;
				};

				const wormholesFromCtx = contextTyper.toValue(context);
				const wormholes = isFunction(getInitial) ?
					getInitial(wormholesFromCtx, this) : wormholesFromCtx
				;

				const methods = ensureObject(mapMethods.call(wormholes, wormholes));
				const props = ensureObject(mapProps.call(wormholes, wormholes));

				forEach(props, (wormhole, prop) => {
					setUpState(prop, ensureWormholeValue(wormhole));
				});

				forEach(methods, (method, prop) => state[prop] = method);

				forEach(computed, (getComputed, prop) => {
					var wormhole;
					const getComputedValue = ensureFunction(getComputed);
					const get = () => getComputedValue.call(wormholes, wormholes);
					const deps = map(wormholes, (key) => wormholes[key]);
					const unsubs = [];
					const watchDep = (depWormhole) => {
						unsubs.push(depWormhole.on('get', (path) => {
							this._unsubscribes.push(depWormhole.on('change', (val, prev) => {
								const nextValue = dotProp.get(val, path);
								const prevValue = dotProp.get(prev, path);
								if (!Object.is(nextValue, prevValue)) {
									wormhole.set(get());
								}
							}));
						}));
					};

					if (deps.length) { deps.forEach(watchDep); }

					const computedValue = get();
					unsubs.forEach((unsub) => unsub());
					wormhole = new Wormhole(computedValue);
					setUpState(prop, wormhole);
				});

				this.state = state;
			}

			componentWillUnmount() {
				this._unsubscribes.forEach((unsubscribe) => unsubscribe());
			}

			shouldComponentUpdate(...args) {
				return !isPure || shallowCompare(this, ...args);
			}

			render() {
				const {
					props,
					state,
				} = this;

				return (
					<WrappedComponent
						{...props}
						{...state}
					/>
				);
			}
		}

		return hoistStatics(ConnectWormhole, WrappedComponent);
	};
}
