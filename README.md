# react-wormhole-hoc

A better alternative to react [context](https://facebook.github.io/react/docs/context.html).


## Motivations

Context is a very powerful feature in React, but it may get you into trouble sometimes.

See these issues for detail:

- https://medium.com/@mweststrate/how-to-safely-use-react-context-b7e343eff076
- https://github.com/facebook/react/issues/2517


## Features

- Works well with `shouldComponentUpdate` and `React.PureComponent`
- No namespace conflict
- Works well outside React Component
- Stable. Not dependence with `react.context`


## Quick Start

```js
import React, { Component, PropTypes } from 'react';
import Wormhole from 'react-wormhole-hoc';

const storeWormhole = new Wormhole({ content: '...' })

const fetchData = () => new Promise((resolve) =>
	setTimeout(() => resolve({ content: 'awesome!!1' }), 1000)
);

@storeWormhole.hoc('myStore')
class DeepChild extends Component {
	static propTypes = {
		myStore: PropTypes.object,
	};

	render() {
		return (
			<div>
				content: {this.props.myStore.content}
			</div>
		);
	}
}

class NoUpdate extends Component {
	shouldComponentUpdate() {

		// no update
		return false;
	}

	render() {
		return (
			<DeepChild />
		);
	}
}

class App extends Component {
	componentDidMount() {
		fetchData('/fake/api').then((store) => {
			storeWormhole.set(store);
		});
	}
	render() {
		return (
			<NoUpdate />
		);
	}
}

```

For more usage, please check out `./example` folder, or clone this repo and run `npm start` to start live demo.


## Documents

coming soon...


## Installing

Using npm:

```
npm install --save react-wormhole-hoc
```

Using yarn:

```
yarn add react-wormhole-hoc
```

## Related Projects

- https://github.com/ReactTraining/react-broadcast
- https://github.com/gnoff/react-tunnel


## License

MIT @ Cap32
