/* eslint-disable react/prop-types */

import React, { Component, PropTypes } from 'react';
import assert from 'assert';
import Wormhole, { connect, Provider } from '../src';
import { render, mount } from 'enzyme';
import jsdom from 'jsdom';

describe('react wormhole hoc', () => {
	beforeEach(() => {
		if (typeof window === 'undefined') {
			global.window = document.defaultView;
			global.navigator = global.window.navigator;
		}
		global.document = jsdom.jsdom(
			'<!doctype html><html><body></body></html>'
		);
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
		const value = 'hello';
		const wormhole = new Wormhole(value);
		const hoc = wormhole.hoc('a', { isPure: false });
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
		assert(isUpdated);
	});

	it('`select()` option', () => {
		const value = 'hello';
		const wormhole = new Wormhole({ value, bla: 'bla' });
		const App = ({ a }) => (<div>{a}</div>);
		const hoc = wormhole.hoc('a', {
			select(data) {
				return data.value;
			},
		});
		const WrappeedApp = hoc(App);
		const wrapper = mount(<WrappeedApp />);
		assert.equal(wrapper.find('div').text(), value);
	});

	it('Wormhole.connect() with wormhole instance', () => {
		const value = 'This is awesome';
		const values = value.split(' ');
		const hoc = connect({
			mapProps() {
				return {
					a: new Wormhole(values[0]),
					b: new Wormhole(values[1]),
					c: new Wormhole(values[2]),
				};
			},
		});
		const App = ({ a, b, c }) => (<div>{a} {b} {c}</div>);
		const WrappeedApp = hoc(App);
		const wrapper = mount(<WrappeedApp />);
		assert.equal(wrapper.find('div').text(), value);
	});

	it('Wormhole.connect() without wormhole instance', () => {
		const value = 'This is awesome';
		const values = value.split(' ');
		const hoc = connect({
			mapProps() {
				return {
					a: values[0],
					b: values[1],
					c: values[2],
				};
			},
		});
		const App = ({ a, b, c }) => (<div>{a} {b} {c}</div>);
		const WrappeedApp = hoc(App);
		const wrapper = mount(<WrappeedApp />);
		assert.equal(wrapper.find('div').text(), value);
	});

	it('read from `contextType`', () => {
		const value = 'hello';
		const App = ({ a }) => (<div>{a}</div>);
		const hoc = connect({
			mapProps(store) {
				return { a: store.a };
			},
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

	it('<Provider />', (done) => {
		const value = 'hello';
		const hoc = connect({
			mapProps: ({ a }) => ({ a }),
		});

		class App extends Component {
			componentDidMount() {
				// console.log('mounted');

				done();
			}

			render() {
				return (<div>{this.props.a}</div>);
			}
		}

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
});
