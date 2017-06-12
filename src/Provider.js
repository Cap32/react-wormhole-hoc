
import PropTypes from 'prop-types';
import { Component, Children } from 'react';
import { ensureWormholeValue } from './Implementation';

export default class WormholeProvider extends Component {
	static propTypes = {
		children: PropTypes.node.isRequired,
		wormholes: PropTypes.object.isRequired,
	};

	static childContextTypes = {
		wormholes: PropTypes.object,
	};

	getChildContext() {
		const { wormholes } = this.props;
		return {
			wormholes: Object.keys(wormholes).reduce((values, key) => {
				values[key] = ensureWormholeValue(wormholes[key]);
				return values;
			}, {}),
		};
	}

	render() {
		return Children.only(this.props.children);
	}
}
