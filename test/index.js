/* eslint-disable react/prop-types */

import React, { Component } from 'react';
import assert from 'assert';
import Wormhole from '../src';
import { shallow, render, mount } from 'enzyme';

describe('react wormhole hoc', () => {
	it('render', () => {
		const val = 'hello';
		const wormhole = new Wormhole(val);
		const Basic = ({ a }) => (<div>{a}</div>);
		const WrappeedBasic = wormhole.hoc('a', Basic);
		const wrapper = render(<WrappeedBasic />);
		assert(wrapper.find('div').text(), val);
	});

	it('update', () => {
		const val = 'hello';
		const updatedVal = 'world';
		const wormhole = new Wormhole(val);
		const Basic = ({ a }) => (<div>{a}</div>);
		const WrappeedBasic = wormhole.hoc('a', Basic);
		const wrapper = render(<WrappeedBasic />);
		wormhole.set(updatedVal);
		assert(wrapper.find('div').text(), updatedVal);
	});
});
