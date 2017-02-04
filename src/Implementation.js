/* eslint-disable no-use-before-define */

import React, { Component, PropTypes } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import shallowCompare from 'react-addons-shallow-compare';
import update from 'immutability-helper';
import dotProp from 'dot-prop';
import Emitter from 'emit-lite';
import is from 'core-js/library/fn/object/is';
import assign from 'core-js/library/fn/object/assign';

const isFunction = (t) => typeof t === 'function';
const isNotFunction = (t) => !isFunction(t);
const isObject = (t) => typeof t === 'object';

const map = (object, iterator) =>
	Object.keys(object).map((key) => iterator(object[key], key))
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
		if (!is(prevValue, value)) {
			this.emit('change', value, prevValue);
		}
	}

	update(updateSpec) {
		this.set(update(this._val, updateSpec));
	}

	hoc(name, options) {
		return connect({
			mapWormholes: () => ({ [name]: this }),
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

class Galaxy {
	constructor(component) {
		this.$component = component;
		Object.defineProperties(this, {
			$props: { get: () => component.props, },
			$state: { get: () => component.state, },
			$context: { get: () => component.context, },
			$refs: { get: () => component.refs, },
		});
	}

	__assign(props) {
		assign(this, props);
		return this;
	}

	__invoke(method) {
		return method.call(this, this);
	}
}

export function connect(options) {
	return function hoc(WrappedComponent) {
		const {
			mapWormholes,
			mapProps = () => ({}),
			methods = {},
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
				const galaxy = new Galaxy(this);
				const state = {};

				this.methods = {};
				this._unsubscribes = [];

				const setUpState = (prop, wormhole) => {
					state[prop] = wormhole.get();
					this._unsubscribes.push(wormhole.on('change', (nextValue) => {
						this.setState({ [prop]: nextValue });
					}));
					return wormhole;
				};

				const wormholesFromCtx = contextTyper.toValue(context);
				const wormholes = isFunction(mapWormholes) ?
					mapWormholes(wormholesFromCtx, this) : wormholesFromCtx
				;

				galaxy.__assign(wormholes);

				galaxy.__assign(ensureObject(methods));

				const props = ensureObject(galaxy.__invoke(mapProps));

				map(props, (wormhole, prop) =>
					setUpState(prop, ensureWormholeValue(wormhole))
				);

				map(methods, (method, prop) =>
					this.methods[prop] = method.bind(galaxy)
				);

				map(computed, (getComputed, prop) => {
					var wormhole;
					const getComputedValue = ensureFunction(getComputed);
					const get = () => galaxy.__invoke(getComputedValue);
					const deps = map(wormholes, (wormhole) => wormhole);
					const unsubs = [];
					const watchDep = (depWormhole) => {
						unsubs.push(depWormhole.on('get', (path) => {
							this._unsubscribes.push(depWormhole.on('change', (val, prev) => {
								const nextValue = dotProp.get(val, path);
								const prevValue = dotProp.get(prev, path);
								if (!is(nextValue, prevValue)) {
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
					methods,
				} = this;

				return (
					<WrappedComponent
						{...props}
						{...state}
						{...methods}
					/>
				);
			}
		}

		return hoistStatics(ConnectWormhole, WrappedComponent);
	};
}
