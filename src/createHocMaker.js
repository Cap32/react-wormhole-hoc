
import createComponent from './createComponent';

export default function createHocMaker(wormhole, options) {
	const hocMaker = function hocMaker(WrappedComponent) {
		return createComponent({ hocMakers: [hocMaker] }, WrappedComponent);
	};

	if (typeof options === 'string') { options = { injectProp: options }; }

	hocMaker.wormhole = wormhole;
	hocMaker.options = options;
	return hocMaker;
}
