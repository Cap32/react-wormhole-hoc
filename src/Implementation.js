/* eslint-disable no-use-before-define */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import hoistReactInstanceMethods from 'hoist-react-instance-methods';
import shallowCompare from 'react-addons-shallow-compare';
import Emitter from 'emit-lite';
import is from 'core-js/library/fn/object/is';

const REF = 'ref';

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

export function connect(mapProps = noop, options) {
	return function hoc(WrappedComponent) {
		const {
			contextType = 'wormholes',
			isPure = true,
			withRef = false,
			hoistMethods,
			getInstance = (instance) => instance.getWrappedInstance(),
		} = options || {};

		const contextTyper = new ContextTyper(contextType);

		const displayName =
			WrappedComponent.displayName || WrappedComponent.name || 'Component'
		;

		const refs = withRef ? { ref: REF } : {};

		class ConnectWormhole extends Component {
			static displayName = `ConnectWormhole(${displayName})`;

			static WrappedComponent = WrappedComponent;

			static contextTypes = contextTyper.toType();

			componentWillMount() {
				const { context } = this;

				const state = {};
				const methods = {};
				const tempMethods = {};
				const wormholesFromCtx = contextTyper.toValue(context);
				const wormholes = {
					$self: this,
					$wormholes: wormholesFromCtx,
				};
				const props = isFunction(mapProps) ?
					mapProps(wormholesFromCtx, this) : (mapProps || wormholesFromCtx)
				;

				this._unsubscribes = [];

				forEach(props, (value, prop) => {
					if (isFunction(value)) {
						return tempMethods[prop] = value;
					}
					const wormhole = wormholes[prop] = ensureWormholeValue(value);
					state[prop] = wormhole.get();
					this._unsubscribes.push(wormhole.on('change', (nextValue) => {
						this.setState({ [prop]: nextValue });
					}));
				});

				forEach(tempMethods, (method, prop) =>
					methods[prop] = method.bind(wormholes)
				);

				this.state = state;
				this.methods = methods;
			}

			componentWillUnmount() {
				this._unsubscribes.forEach((unsubscribe) => unsubscribe());
			}

			shouldComponentUpdate(...args) {
				return !isPure || shallowCompare(this, ...args);
			}

			getWrappedInstance() {
				if (!withRef) {
					console.warn(
						'Could not invoke `getWrappedInstance` without `withRef` options'
					);
					return null;
				}
				return this.refs[REF];
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
						{...refs}
					/>
				);
			}
		}

		if (hoistMethods) {
			if (!withRef) {
				console.warn(
					'Could not use `hoistMethods` without setting `withRef` as `true`'
				);
			}
			else {
				hoistReactInstanceMethods(ConnectWormhole, getInstance, hoistMethods);
			}
		}

		return hoistStatics(ConnectWormhole, WrappedComponent);
	};
}
