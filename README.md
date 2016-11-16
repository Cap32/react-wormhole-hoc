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


## API

#### Wormhole

##### constructor(initialValue)

Create wormhole instance.

###### Arguments

1. initialValue (Any): Initial value.

###### Return

(Wormhole): `wormhole` instance.

##### get()

Get current value.

###### Return

(Any): Value.

##### set(newValue)

Set new value.

###### Arguments

1. newValue (Any)

##### subscribe(handler)

Subscribe value change event.

###### Arguments

1. handler (Function): Change event handler.

###### Return

(Function): Unsubscribe.

##### hoc(injectPropOrOptions[, Component]])

Create React HOC.

###### Arguments

1. injectPropOrOptions (String|Object): Options object. Also can be a string short for `Options.injectProp`.
2. Component (ReactComponent): Target React Component to HOC.

Available options:

- injectProp (String): The prop name of the injected value. It's required.
- initialValue (Any): Set up initial value before the target component mount.
- select (Function): Select the wormhole value. Must return a new value. (See the example below for detail.)

###### Return

(Function|ReactComponent): If provide a `Component` as the second argument, it will return a new React Component. Otherwise, it will return currify function.

###### Example

Basic usage:

```js
import React, { Component, PropTypes } from 'react';
import Wormhole from 'react-wormhole-hoc';

const myWormhole = new Wormhole('awesome!!1');

class App extends Component {
	static propTypes = {
		myValue: PropTypes.string,
	};

	render() {
		return (
			<h1>{this.props.myValue}</h1>
		);
	}
}

export default myWormhole.hoc('myValue', App);
```

With [transform-decorators-legacy](https://github.com/loganfsmyth/babel-plugin-transform-decorators-legacy) babel plugin:

```js
@myWormhole.hoc('myValue')
export class App extends Component {
	// the same with above...
}
```

With `select` option:

```js
const myWormhole = new Wormhole({
	content: 'awesome!!1',
	something: 'big',
});

@myWormhole.hoc({
	injectProp: 'myValue',
	select(value, props) {
		return value.content;
	}
})
class App extends Component {
	// the same with above...
}
```

##### static compose(hocMakers[, Component])

(TODO)

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
