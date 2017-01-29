
import SubscribableValue from 'subscribable-value';
import createHocMaker from './createHocMaker';
import { currify } from './utils';
import compose from './compose';
import fromContext from './fromContext';

export default class Wormhole extends SubscribableValue {
	static compose = compose;

	static fromContext = fromContext;

	hoc(options, WrappedComponent) {
		const hocMaker = createHocMaker(this, options);
		return currify(hocMaker, WrappedComponent);
	}
}

export {
	compose,
	fromContext,
};
