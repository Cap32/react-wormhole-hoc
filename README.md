# react-wormhole-hoc

[![Build Status](https://travis-ci.org/Cap32/react-wormhole-hoc.svg?branch=master)](https://travis-ci.org/Cap32/react-wormhole-hoc)

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
- Can communicate without parent-child relationship


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

For more usage, please check the `./example` directory, or clone this repo and run `npm run example` to start live demo.


## API

- [constructor](#constructorinitialvalue)
- [get](#getkeypath)
- [set](#setnewvalue)
- [on](#onevent-handler)
- [once](#onceevent-handler)
- [off](#offevent-handler)
- [hoc](#hocpropname)
- static [Provider](#static-provider-wormholes-)
- static [connect](#static-connectoptions)

## constructor(initialValue)

Create wormhole instance.

###### Arguments

1. initialValue (Any): Initial value.

###### Return

(Wormhole): `wormhole` instance.

## get([keyPath])

Get current value. Will emit an `get` event.

###### Arguments

1. keyPath (String): Return the value of the key path.

###### Return

(Any): Value.

## set(newValue)

Set new value. Will emit an `set` event. If the `newValue` is different with the old value, it will also emit an `change` event.

###### Arguments

1. newValue (Any)

## on(event, handler)

Listen for a custom event on the current instance.

###### Arguments

1. event (String): Event type.
2. handler (Function): Event handler.

###### Return

(Function): off.

## once(event, handler)

Listen for a custom event, but only once.

###### Arguments

1. event (String): Event type.
2. handler (Function): Event handler.

###### Return

(Function): off.

## off([event, handler])

Remove event listener(s).

###### Arguments

1. event (String): Event type.
2. handler (Function): Event handler.

## hoc(propName)

Create React HOC.

###### Arguments

1. propName (String): Inject this value as `prop`.

###### Return

(Function): A HOC creator function.

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

const hoc = myWormhole.hoc('myValue');
export default hoc(App);
```

With [transform-decorators-legacy](https://github.com/loganfsmyth/babel-plugin-transform-decorators-legacy) babel plugin:

```js
@myWormhole.hoc('myValue')
export default class App extends Component {
	// the same with above...
}
```

## static `<Provider wormholes />`

Makes the `wormholes` available to the connect() calls in the component hierarchy below.

###### Props

- wormholes (Object): A key/value object of `wormholes`.
- children (ReactElement): The root of your component hierarchy.

###### Example

Basic usage:

```js
import React from 'react';
import ReactDOM from 'react-dom';
import Wormhole, { Provider } from 'react-wormhole-hoc';
import MyRootComponent from './MyRootComponent';

const wormholes = {
	page: {},
	isFetching: false,
	errorMessage: '',
};

ReactDOM.render(
	<Provider wormholes={wormholes}>
		<MyRootComponent />
	</Provider>,
	rootEl,
);
```

## static connect(options)

Connect some wormholes to a HOC.

###### Arguments

1. options (Object): See below for detail.

###### Available options:

- mapWormholes (Function): A function to map `wormholes` to `this` context. By default, it will use all the `wormholes` that provided by `<Provider>`.

- mapProps (Function): A function to map `wormhole` values to props.


```js
@Wormhole.connect({
	mapProps() {
		return {
			hello: this.hello,
			world: this.world,
		};
	},

	/* the same with above */
	// mapProps: ({ hello, world }) => ({ hello, world }),
})
class App extends Component {
	static propTypes = {
		hello: PropTypes.string,
		world: PropTypes.string,
	};

	render() {
		const { hello, world } = this.props;
		return (
			<h1>{hello} {world}</h1>
		);
	}
}


ReactDOM.render(
	<Provider
		wormholes={{
			helo: 'hello',
			world: 'world',
		}}
	>
		<App />
	</Provider>,
	rootEl,
);
```


###### Return

(Function): A HOC creator function.


## Installing

Using npm:

```
npm install --save react-wormhole-hoc
```

Using yarn:

```
yarn add react-wormhole-hoc
```


## Dependencies

`react-wormhole-hoc` has very few dependencies and most are managed by NPM automatically.
However the following peer dependencies must be specified by your project in order to avoid version conflicts:
[`react`](https://www.npmjs.com/package/react),
[`react-addons-shallow-compare`](https://www.npmjs.com/package/react-addons-shallow-compare), and
NPM will not automatically install these for you but it will show you a warning message with instructions on how to install them.


## Note

If you want some communications base on paren-child coupling, please use react [context](https://facebook.github.io/react/docs/context.html) instead.


## Related Projects

- https://github.com/ReactTraining/react-broadcast
- https://github.com/gnoff/react-tunnel


## License

MIT © Cap32
