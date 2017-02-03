/* eslint-disable react/prop-types */

import React, { Component, PropTypes } from 'react';
import { render } from 'react-dom';
import Wormhole, { connect, Provider } from '../src';
import { Box, Link, getLocation, fetch } from './utils';

const fetchData = function () {
	const { page } = this;
	if (!page.get().list.length) {
		return fetch('/fake/api').then((data) => {
			page.set(data);
		});
	}
};

@connect({
	computed: {
		data() {
			const id = /\/(\d+)$/.exec(this.location.get())[1];
			return this.page.get().list.find((page) => page.id === +id);
		},
	},
	methods: { fetchData },
})
class Page extends Component {
	static propTypes = {
		data: PropTypes.object,
		fetchData: PropTypes.func,
	};

	componentDidMount() {
		this.props.fetchData();
	}

	render() {
		const { data } = this.props;
		return (
			<Box title={data ? data.name : '-'}>
				{!data && 'loading...'}
				{!!data && data.content}
				<div><Link href="/pages">Back</Link></div>
			</Box>
		);
	}
}

@connect({
	mapProps: ({ page }) => ({ page }),
	methods: { fetchData },
})
class Pages extends Component {
	static propTypes = {
		page: PropTypes.object,
		fetchData: PropTypes.func,
	};

	componentDidMount() {
		this.props.fetchData();
	}

	render() {
		const { page } = this.props;
		return (
			<Box title="Pages">
				{!page.list.length && 'loading...'}
				<navi>
					{page.list.map(({ name, id }) =>
						<Link href={`/pages/${id}`} key={id}>{name}</Link>
					)}
				</navi>
			</Box>
		);
	}
}

@connect({
	mapProps: ({ counter }) => ({ counter }),
	methods: {
		increase(ev) {
			const { counter } = this;
			ev.preventDefault();
			counter.set(counter.get() + 1);
		},
	},
})
class CounterControl extends Component {
	static propTypes = {
		counter: PropTypes.number,
		increase: PropTypes.func,
	};

	render() {
		const { counter, increase } = this.props;
		return (
			<Box title="Control">
				<button onClick={increase}>increase value</button>
				<div>current value: {counter}</div>
			</Box>
		);
	}
}
@connect({
	mapProps: ({ counter }) => ({ counter }),
})
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
@connect({
	mapProps: ({ location }) => ({ location }),
})
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
		this.wormholes.location.set(getLocation());
	};

	wormholes = {
		location: new Wormhole(getLocation()),
		page: new Wormhole({ list: [] }),
		counter: new Wormhole(0),
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
			<Provider wormholes={this.wormholes}>
				<Box title="Root">
					<navi>
						<Link href="/">Counter</Link>
						<Link href="/pages">Pages</Link>
					</navi>
					<Router />
				</Box>
			</Provider>
		);
	}
}

render(<Root />, document.getElementById('mount'));
