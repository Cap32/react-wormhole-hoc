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

const ensure = (validator, errorMessage) => (val) => {
	if (!validator(val)) {
		throw new Error(errorMessage);
	}
	return val;
};

const ensureValue = ensure(isNotFunction, 'Value should NOT be a function.');
const ensureObject = ensure(isObject, 'Value should be an object.');

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
				const { props, context } = this;
				this._unsubscribes = [];

				const wormholesFromCtx = contextTyper.toValue(context);
				const wormholes = isFunction(getInitial) ?
					getInitial(wormholesFromCtx, context, props) : wormholesFromCtx
				;

				const compute = (getComputedValue) => {
					let computed;
					const deps = map(wormholes, (key) => wormholes[key]);
					const unsubs = [];
					const subscribe = (wormhole) => {
						unsubs.push(wormhole.on('get', (path) => {
							this._unsubscribes.push(wormhole.on('change', (val, prev) => {
								const value = dotProp.get(val, path);
								const prevValue = dotProp.get(prev, path);
								if (!Object.is(value, prevValue)) {
									computed.set(getComputedValue());
								}
							}));
						}));
					};

					if (deps.length) { deps.forEach(subscribe); }

					const computedValue = getComputedValue();
					unsubs.forEach((unsub) => unsub());
					return computed = new Wormhole(computedValue);
				};

				const methods = ensureObject(mapMethods.call(wormholes, wormholes));
				const wormholeProps = ensureObject(mapProps.call(wormholes, wormholes));

				this.state = map(wormholeProps, (key) => {
					const value = wormholeProps[key];
					if (isFunction(value)) { wormholeProps[key] = compute(value); }
					return key;
				})
				.reduce((state, key) => {
					const wormhole = ensureWormholeValue(wormholeProps[key]);
					state[key] = wormhole.get();

					this._unsubscribes.push(wormhole.on('change', (nextValue) => {
						this.setState({
							[key]: nextValue,
						});
					}));

					return state;
				}, methods);
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
