/* eslint-disable react/prop-types */

import React from 'react';
import assert from 'assert';
import Wormhole from '../src';
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
		const val = 'hello';
		const wormhole = new Wormhole(val);
		const Basic = ({ a }) => (<div>{a}</div>);
		const WrappeedBasic = wormhole.hoc('a', Basic);
		const wrapper = render(<WrappeedBasic />);
		assert(wrapper.find('div').text(), val);
	});

	it('wormhole.set()', () => {
		const val = 'hello';
		const updatedVal = 'world';
		const wormhole = new Wormhole(val);
		const Basic = ({ a }) => (<div>{a}</div>);
		const WrappeedBasic = wormhole.hoc('a', Basic);
		const wrapper = mount(<WrappeedBasic />);
		wormhole.set(updatedVal);
		assert(wormhole.get(), updatedVal);
		assert(wrapper.find('div').text(), updatedVal);
	});

	it('hoc `select()` option', () => {
		const value = 'hello';
		const wormhole = new Wormhole({ value, bla: 'bla' });
		const Basic = ({ a }) => (<div>{a}</div>);
		const WrappeedBasic = wormhole.hoc({
			injectProp: 'a',
			select(val) {
				return val.value;
			},
		}, Basic);
		const wrapper = mount(<WrappeedBasic />);
		assert(wrapper.find('div').text(), value);
	});

	it('Wormhole.compose()', () => {
		const value = 'This is awesome';
		const wormholes = value.split(' ').map((val) => new Wormhole(val));
		const Basic = ({ v0, v1, v2 }) => (<div>{v0} {v1} {v2}</div>);
		const WrappeedBasic = Wormhole.compose(
			wormholes.map((w, index) => w.hoc(`v${index}`)),
			Basic,
		);
		const wrapper = mount(<WrappeedBasic />);
		assert(wrapper.find('div').text(), value);
	});
});
