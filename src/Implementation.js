/* eslint-disable no-use-before-define */

import React, { Component, PropTypes } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import shallowCompare from 'react-addons-shallow-compare';
import Emitter from 'emit-lite';

// TODO: should shim `Object.is()`

export class Wormhole extends Emitter {
	static connect = connect;

	constructor(initialValue) {
		super();

		this._val = initialValue;
	}

	get() {
		this.emit('get');
		return this._val;
	}

	set(value) {
		const prevValue = this._val;
		this._val = value;
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
			...options,
			mapProps: () => ({ [name]: this }),
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
	// const isValid = typeof val === 'function' || val instanceof Wormhole;
	const isValid = val instanceof Wormhole;
	return isValid ? val : new Wormhole(val);
}

export function connect(options) {
	return function hoc(WrappedComponent) {
		const {
			select = (v) => v,
			mapProps = () => ({}),
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

				const wormholes = contextTyper.toValue(context);

				const compute = (getComputed, deps = []) => {
					let computed;
					const unsubs = [];
					const subscribe = (wormhole) => {
						unsubs.push(wormhole.on('get', () => {
							this._unsubscribes.push(wormhole.on('change', () => {
								computed.set(getComputed());
							}));
						}));
					};

					if (deps.length) { deps.forEach(subscribe); }

					const computedValue = getComputed();
					unsubs.forEach((unsub) => unsub());
					return computed = new Wormhole(computedValue);
				};


				const wormholeProps = mapProps(wormholes, compute);

				this.state = Object
					.keys(wormholeProps)
					.reduce((state, key) => {
						const wormhole = ensureWormholeValue(wormholeProps[key]);
						const value = select.call(wormhole, wormhole.get(), props);
						state[key] = value;

						this._unsubscribes.push(wormhole.on('change', (nextValue) => {
							this.setState({
								[key]: select.call(wormhole, nextValue, this.props),
							});
						}));

						return state;
					}, {})
				;
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
