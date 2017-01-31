/* eslint-disable react/prop-types */

import React, { Component, PropTypes } from 'react';
import { render } from 'react-dom';
import Wormhole, { connect } from '../src';
import { Box, Link, getLocation, fetch } from './utils';

const locationWormhole = new Wormhole(getLocation());
const pageStoreWormhole = new Wormhole({ list: [] });
const counterWormhole = new Wormhole(0);

const fetchData = () => {
	if (!pageStoreWormhole.get().list.length) {
		fetch('/fake/api').then((data) => {
			pageStoreWormhole.set(data);
		});
	}
};

@connect({
	mapProps(wormholes, compute) {
		return {
			page: compute(() => {
				const id = /\/(\d+)$/.exec(locationWormhole.get())[1];
				return pageStoreWormhole.get().list.find((page) => page.id === +id);
			}, [pageStoreWormhole, locationWormhole]),
		};
	},
})
class Page extends Component {
	static propTypes = {
		page: PropTypes.object,
	};

	componentDidMount() {
		fetchData();
	}

	render() {
		const { page } = this.props;
		return (
			<Box title={page ? page.name : '-'}>
				{!page && 'loading...'}
				{!!page && page.content}
				<div><Link href="/pages">Back</Link></div>
			</Box>
		);
	}
}

@pageStoreWormhole.hoc('store')
class Pages extends Component {
	static propTypes = {
		store: PropTypes.object,
	};

	componentDidMount() {
		fetchData();
	}

	render() {
		const { store } = this.props;
		return (
			<Box title="Pages">
				{!store.list.length && 'loading...'}
				<navi>
					{store.list.map(({ name, id }) =>
						<Link href={`/pages/${id}`} key={id}>{name}</Link>
					)}
				</navi>
			</Box>
		);
	}
}

@counterWormhole.hoc('counter')
class CounterControl extends Component {
	static propTypes = {
		counter: PropTypes.number,
	};

	_handleIncrease = (ev) => {
		ev.preventDefault();
		counterWormhole.set(counterWormhole.get() + 1);
	};

	render() {
		return (
			<Box title="Control">
				<button onClick={this._handleIncrease}>increase value</button>
				<div>current value: {this.props.counter}</div>
			</Box>
		);
	}
}

@counterWormhole.hoc('counter')
class CounterDisplay extends Component {
	static propTypes = {
		counter: PropTypes.number,
	};

	render() {
		return (
			<Box title="Display">
				sync value: {this.props.counter}
			</Box>
		);
	}
}

const Counter = () =>
	<Box title="Counter">
		<CounterControl />
		<CounterDisplay />
	</Box>
;

@locationWormhole.hoc('location')
class Router extends Component {
	static propTypes = {
		location: PropTypes.string,
	};

	_routes = {
		'/': <Counter />,
		'/pages': <Pages />,
		'/pages/1': <Page />,
		'/pages/2': <Page />,
	};

	render() {
		return (
			<Box title="Router">
				{this._routes[this.props.location]}
			</Box>
		);
	}
}

class Root extends Component {
	_handleRouteChange = () => {
		locationWormhole.set(getLocation());
	};

	shouldComponentUpdate() {

		// note
		return false;

	}

	componentDidMount() {
		window.addEventListener('hashchange', this._handleRouteChange);
	}

	componentWillUnmount() {
		window.removeEventListener('hashchange', this._handleRouteChange);
	}

	render() {
		return (
			<Box title="Root">
				<navi>
					<Link href="/">Counter</Link>
					<Link href="/pages">Pages</Link>
				</navi>
				<Router />
			</Box>
		);
	}
}

render(<Root />, document.getElementById('mount'));
