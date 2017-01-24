
import React, { Component } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import shallowCompare from 'react-addons-shallow-compare';

export default (options, WrappedComponent) => {

	const { hocMakers, getHocMakers, contextTypes } = options;

	const displayName =
		WrappedComponent.displayName || WrappedComponent.name || 'Component'
	;

	class ConnectWormhole extends Component {
		static displayName = `ConnectWormhole(${displayName})`;

		static WrappedComponent = WrappedComponent;

		static contextTypes = contextTypes;

		componentWillMount() {
			const { props, context } = this;
			const initialState = {};
			this._unsubscribes = [];

			const makers = [].concat(hocMakers || getHocMakers(context));

			makers.forEach(({ wormhole, options }) => {
				const {
					initialValue, injectProp,
					select = (val) => val,
				} = options;

				if (initialValue) {
					const value = typeof initialValue === 'function' ?
						initialValue(props) : initialValue
					;

					wormhole.set(value);
				}

				if (injectProp) {
					initialState[injectProp] = select(wormhole.get(), {
						...props,
						...initialState,
					});

					this._unsubscribes.push(wormhole.subscribe((value) => {
						this.setState({
							[injectProp]: select(value, {
								...this.props,
								...this.state,
							}),
						});
					}));
				}
			});

			this.state = initialState;
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
