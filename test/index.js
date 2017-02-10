/* eslint-disable react/prop-types */

import React, { Component, PropTypes } from 'react';
import assert from 'assert';
import Wormhole, { connect, Provider } from '../src';
import { render, mount } from 'enzyme';
import jsdom from 'jsdom';

describe('react wormhole hoc', () => {
	beforeEach(() => {
		global.document = jsdom.jsdom(
			'<!doctype html><html><body></body></html>'
		);
		if (typeof window === 'undefined') {
			global.window = global.document.defaultView;
			global.navigator = global.window.navigator;
		}
	});

	it('wormhole.hoc()', () => {
		const value = 'hello';
		const wormhole = new Wormhole(value);
		const hoc = wormhole.hoc('a');
		const App = ({ a }) => (<div>{a}</div>);
		const WrappeedApp = hoc(App);
		const wrapper = render(<WrappeedApp />);
		assert.equal(wrapper.find('div').text(), value);
	});

	it('wormhole.set()', () => {
		const value = 'hello';
		const updatedVal = 'world';
		const wormhole = new Wormhole(value);
		const hoc = wormhole.hoc('a');
		const App = ({ a }) => (<div>{a}</div>);
		const WrappeedApp = hoc(App);
		const wrapper = mount(<WrappeedApp />);
		wormhole.set(updatedVal);
		assert.equal(wormhole.get(), updatedVal);
		assert.equal(wrapper.find('div').text(), updatedVal);
	});

	it('`isPure: true` option', () => {
		const value = 'hello';
		const wormhole = new Wormhole(value);
		const hoc = wormhole.hoc('a', { isPure: true });
		let isUpdated = false;

		class App extends Component {
			componentDidMount() {
				wormhole.set(value);
			}

			componentDidUpdate() {
				isUpdated = true;
			}

			render() {
				return (<div>{this.props.a}</div>);
			}
		}

		const WrappeedApp = hoc(App);
		mount(<WrappeedApp />);
		assert(!isUpdated);
	});

	it('`isPure: false` option', () => {
		const value = { text: 'hello' };
		const wormhole = new Wormhole(value);
		const hoc = wormhole.hoc('a', { isPure: false });
		let isUpdated = false;

		class App extends Component {
			componentDidMount() {
				wormhole.set(Object.assign({}, value));
			}

			componentDidUpdate() {
				isUpdated = true;
			}

			render() {
				return (<div>{this.props.a.text}</div>);
			}
		}

		const WrappeedApp = hoc(App);
		mount(<WrappeedApp />);
		assert(isUpdated);
	});

	it('Wormhole.connect() with wormhole instance', () => {
		const value = 'This is awesome';
		const values = value.split(' ');
		const hoc = connect(() => ({
			a: new Wormhole(values[0]),
			b: new Wormhole(values[1]),
			c: new Wormhole(values[2]),
		}));
		const App = ({ a, b, c }) => (<div>{a} {b} {c}</div>);
		const WrappeedApp = hoc(App);
		const wrapper = mount(<WrappeedApp />);
		assert.equal(wrapper.find('div').text(), value);
	});

	it('Wormhole.connect() without wormhole instance', () => {
		const value = 'This is awesome';
		const values = value.split(' ');
		const hoc = connect(() => ({
			a: values[0],
			b: values[1],
			c: values[2],
		}));
		const App = ({ a, b, c }) => (<div>{a} {b} {c}</div>);
		const WrappeedApp = hoc(App);
		const wrapper = mount(<WrappeedApp />);
		assert.equal(wrapper.find('div').text(), value);
	});

	it('read from `contextType`', () => {
		const value = 'hello';
		const App = ({ a }) => (<div>{a}</div>);
		const hoc = connect(({ a }) => ({ a }), null, {
			contextType: 'store',
		});
		const WrappeedApp = hoc(App);

		class Container extends Component {
			static childContextTypes = {
				store: PropTypes.object,
			};

			getChildContext() {
				return {
					store: {
						a: new Wormhole(value),
					},
				};
			}

			render() {
				return (<WrappeedApp />);
			}
		}

		const wrapper = mount(<Container />);
		assert.equal(wrapper.find('div').text(), value);
	});

	it('<Provider />', () => {
		const value = 'hello';
		const App = ({ a }) => (<div>{a}</div>);
		const hoc = connect(({ a }) => ({ a }));
		const WrappeedApp = hoc(App);

		const wrapper = mount(
			<Provider
				wormholes={{
					a: value,
				}}
			>
				<WrappeedApp />
			</Provider>
		);
		assert.equal(wrapper.find('div').text(), value);
	});

	it('connect with `methods`', () => {
		const hoc = connect(
			({ count }) => ({ count }),
			({ count }) => ({
				increase() {
					count.set(count.get() + 1);
				},
			}),
		);

		class App extends Component {
			static propTypes = {
				count: PropTypes.number,
				increase: PropTypes.func,
			};

			render() {
				const { count, increase } = this.props;
				return (
					<div>
						<button onClick={increase}>increase</button>
						<p id="count">{count}</p>
					</div>
				);
			}
		}

		const WrappeedApp = hoc(App);

		const wrapper = mount(
			<Provider
				wormholes={{ count: 1 }}
			>
				<WrappeedApp />
			</Provider>
		);

		assert.equal(wrapper.find('#count').text(), 1);
		wrapper.find('button').simulate('click');
		assert.equal(wrapper.find('#count').text(), 2);
	});
});
