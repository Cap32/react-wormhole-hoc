/* eslint-disable no-use-before-define */

import React, { Component, PropTypes } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import shallowCompare from 'react-addons-shallow-compare';
import Emitter from 'emit-lite';
import is from 'core-js/library/fn/object/is';

const isFunction = (t) => typeof t === 'function';
const isNotFunction = (t) => !isFunction(t);

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

export class Wormhole extends Emitter {
	static connect = connect;

	constructor(initialValue) {
		super();
		this._val = ensureValue(initialValue);
	}

	get() {
		this.emit('get');
		return this._val;
	}

	set(value) {
		const prevValue = this._val;
		this._val = ensureValue(value);
		this.emit('set', value, prevValue);
		if (!is(prevValue, value)) {
			this.emit('change', value, prevValue);
		}
	}

	hoc(name, options) {
		return connect(() => ({ [name]: this }), null, options);
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

const noop = () => ({});

export function connect(mapProps = noop, mapMethods = noop, options) {
	return function hoc(WrappedComponent) {
		const {
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

				const props = {};
				const methodProps = {};
				this._unsubscribes = [];

				const wormholesFromCtx = contextTyper.toValue(context);
				const wormholes = isFunction(mapProps) ?
					mapProps(wormholesFromCtx, this) : (mapProps || wormholesFromCtx)
				;

				forEach(wormholes, (value, prop) => {
					const wormhole = wormholes[prop] = ensureWormholeValue(value);
					props[prop] = wormhole.get();
					this._unsubscribes.push(wormhole.on('change', (nextValue) => {
						this.setState({ [prop]: nextValue });
					}));
				});

				const methods =
					isFunction(mapMethods) ? mapMethods(wormholes) : (mapMethods || {})
				;

				forEach(methods, (method, prop) => methodProps[prop] = method);

				this.state = props;
				this.methods = methodProps;
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
