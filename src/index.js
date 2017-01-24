
import SubscribableValue from 'subscribable-value';
import createHocMaker from './createHocMaker';
import createComponent from './createComponent';

const currify = (fn, arg) => arg ? fn(arg) : fn;

export default class Wormhole extends SubscribableValue {
	static compose(hocMakers, WrappedComponent) {
		const create = (Wrapped) => createComponent({ hocMakers }, Wrapped);
		return currify(create, WrappedComponent);
	}

	static fromContext(contextTypes, selectContext, WrappedComponent) {
		const create = (Wrapped) => createComponent({
			contextTypes,
			getHocMakers(context) { return selectContext(context); },
		}, Wrapped);
		return currify(create, WrappedComponent);
	}

	hoc(options, WrappedComponent) {
		const hocMaker = createHocMaker(this, options);
		return currify(hocMaker, WrappedComponent);
	}
}
