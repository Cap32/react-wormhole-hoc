
import React from 'react';
import { shallow } from 'enzyme';

const Hello = () => <div />;

describe('react wormhole hoc', () => {
	it('hello', () => {
		const wrapper = shallow(<Hello />);
		// console.log(typeof wrapper);
		// console.log(Object.getOwnPropertyNames(wrapper));
		console.log('it works.');
	});
});
