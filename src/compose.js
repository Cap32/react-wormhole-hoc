
import createComponent from './createComponent';
import { currify } from './utils';

function compose(hocMakers, WrappedComponent) {
	const create = (Wrapped) => createComponent({ hocMakers }, Wrapped);
	return currify(create, WrappedComponent);
}

export default compose;
