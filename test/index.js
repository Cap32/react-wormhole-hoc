/* eslint-disable react/prop-types */

import React, { Component, PropTypes } from 'react';
import assert from 'assert';
import Wormhole, { create, Provider } from '../src';
import { render, mount } from 'enzyme';
import jsdom from 'jsdom';

describe('react wormhole hoc', () => {
	before(() => {
		if (typeof document === 'undefined') {
			global.document = jsdom.jsdom(
				'<!doctype html><html><body></body></html>'
			);
			global.window = document.defaultView;
			global.navigator = global.window.navigator;
		}
	});

	it('wormhole.hoc()', () => {
		const value = 'hello';
		const wormhole = new Wormhole(value);
		const connect = wormhole.hoc('a');
		const Basic = ({ a }) => (<div>{a}</div>);
		const WrappeedBasic = connect(Basic);
		const wrapper = render(<WrappeedBasic />);
		assert(wrapper.find('div').text(), value);
	});

	it('wormhole.set()', () => {
		const value = 'hello';
		const updatedVal = 'world';
		const wormhole = new Wormhole(value);
		const connect = wormhole.hoc('a');
		const Basic = ({ a }) => (<div>{a}</div>);
		const WrappeedBasic = connect(Basic);
		const wrapper = mount(<WrappeedBasic />);
		wormhole.set(updatedVal);
		assert(wormhole.get(), updatedVal);
		assert(wrapper.find('div').text(), updatedVal);
	});

	it('hoc `select()` option', () => {
		const value = 'hello';
		const wormhole = new Wormhole({ value, bla: 'bla' });
		const Basic = ({ a }) => (<div>{a}</div>);
		const connect = wormhole.hoc('a', {
			select(data) {
				return data.value;
			},
		});
		const WrappeedBasic = connect(Basic);
		const wrapper = mount(<WrappeedBasic />);
		assert(wrapper.find('div').text(), value);
	});

	it('Wormhole.create() with wormhole instance', () => {
		const value = 'This is awesome';
		const values = value.split(' ');
		const connect = create({
			map() {
				return {
					a: new Wormhole(values[0]),
					b: new Wormhole(values[1]),
					c: new Wormhole(values[2]),
				};
			},
		});
		const Basic = ({ a, b, c }) => (<div>{a} {b} {c}</div>);
		const WrappeedBasic = connect(Basic);
		const wrapper = mount(<WrappeedBasic />);
		assert(wrapper.find('div').text(), value);
	});

	it('Wormhole.create() without wormhole instance', () => {
		const value = 'This is awesome';
		const values = value.split(' ');
		const connect = create({
			map() {
				return {
					a: values[0],
					b: values[1],
					c: values[2],
				};
			},
		});
		const Basic = ({ a, b, c }) => (<div>{a} {b} {c}</div>);
		const WrappeedBasic = connect(Basic);
		const wrapper = mount(<WrappeedBasic />);
		assert(wrapper.find('div').text(), value);
	});

	it('read from `contextType`', () => {
		const value = 'hello';
		const Basic = ({ a }) => (<div>{a}</div>);
		const connect = create({
			map(store) {
				return { a: store.a };
			},
			contextType: 'store',
		});
		const WrappeedBasic = connect(Basic);

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
				return (<WrappeedBasic />);
			}
		}

		const wrapper = mount(<Container />);
		assert(wrapper.find('div').text(), value);
	});

	it('<Provider />', () => {
		const value = 'hello';
		const App = ({ a }) => (<div>{a}</div>);
		const connect = create({
			map: ({ a }) => ({ a }),
		});
		const WrappeedApp = connect(App);

		const wrapper = mount(
			<Provider
				wormholes={{
					a: value,
				}}
			>
				<WrappeedApp />
			</Provider>
		);
		assert(wrapper.find('div').text(), value);
	});
});
