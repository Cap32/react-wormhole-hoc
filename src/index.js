
import SubscribableValue from 'subscribable-value';
import createHocMaker from './createHocMaker';
import createComponent from './createComponent';

const currify = (fn, arg) => arg ? fn(arg) : fn;

export default class Wormhole extends SubscribableValue {
	static compose(hocMakers, WrappedComponent) {
		const create =
			(WrappedComponent) => createComponent(hocMakers, WrappedComponent)
		;
		return currify(create, WrappedComponent);
	}

	hoc(options, WrappedComponent) {
		const hocMaker = createHocMaker(this, options);
		return currify(hocMaker, WrappedComponent);
	}
}
