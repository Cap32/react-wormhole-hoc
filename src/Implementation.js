/* eslint-disable no-use-before-define */

import React, { Component, PropTypes } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import shallowCompare from 'react-addons-shallow-compare';
import SubscribableValue from 'subscribable-value';

export class Wormhole extends SubscribableValue {
	static create = create;

	hoc(name, options) {
		return create({
			...options,
			map: () => ({ [name]: this }),
		});
	}
}

class ContextTyper {
	constructor(name = 'wormholes') {
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
	return val instanceof Wormhole ? val : new Wormhole(val);
}

export function create(options) {
	return function createHoc(WrappedComponent) {
		const {
			select = (v) => v,
			map = () => ({}),
			contextType,
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

				const wormholes = map(contextTyper.toValue(context));

				this.state = Object
					.keys(wormholes)
					.reduce((state, key) => {
						const wormhole = ensureWormholeValue(wormholes[key]);
						const value = select.call(wormhole, wormhole.get(), props);
						state[key] = value;

						this._unsubscribes.push(wormhole.subscribe((nextValue) => {
							this.setState({
								[key]: select(nextValue, this.props),
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
				return shallowCompare(this, ...args);
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
