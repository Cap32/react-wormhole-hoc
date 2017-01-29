
import createComponent from './createComponent';
import { currify } from './utils';

function fromContext(contextTypes, selectContext, WrappedComponent) {
	const create = (Wrapped) => createComponent({
		contextTypes,
		getHocMakers(context) { return selectContext(context); },
	}, Wrapped);
	return currify(create, WrappedComponent);
}

export default fromContext;
