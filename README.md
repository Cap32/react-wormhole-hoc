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

For more usage, please check the `./example` directory, or clone this repo and run `npm start` to start live demo.


## API

- [constructor](#constructorinitialvalue)
- [get](#get)
- [set](#setnewvalue)
- [subscribe](#subscribehandler)
- [hoc](#hocinjectproporoptions-component)
- static [compose](#static-composehocmakers-component)
- static [fromContext](#static-fromcontextcontexttypes-gethocmakers-component)

### Wormhole

#### constructor(initialValue)

Create wormhole instance.

###### Arguments

1. initialValue (Any): Initial value.

###### Return

(Wormhole): `wormhole` instance.

---

#### get()

Get current value.

###### Return

(Any): Value.

---

#### set(newValue)

Set new value.

###### Arguments

1. newValue (Any)

---

#### subscribe(handler)

Subscribe value change event.

###### Arguments

1. handler (Function): Change event handler.

###### Return

(Function): Unsubscribe.

---

#### hoc(injectPropOrOptions[, Component]])

Create React HOC.

###### Arguments

1. injectPropOrOptions (String|Object): Options object. Also can be a string short for `Options.injectProp`.
2. Component (ReactComponent): Target React Component to HOC.

###### Available options:

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
export default class App extends Component {
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
export default class App extends Component {
	// the same with above...
}
```

---

#### static compose(hocMakers[, Component])

Compose multiple wormholes to a HOC.

###### Arguments

1. hocMakers (Array): An array of `hocMaker`. A `hocMaker` is the return value of `wormhole.hoc(options)`. (See the example below for detail.)
2. Component (ReactComponent): Target React Component to HOC.

###### Return

(Function|ReactComponent): If provide a `Component` as the second argument, it will return a new React Component. Otherwise, it will return currify function.

###### Example

Basic usage:

```js
import React, { Component, PropTypes } from 'react';
import Wormhole from 'react-wormhole-hoc';

const itWormhole = new Wormhole('it');
const isWormhole = new Wormhole('is');
const awesomeWormhole = new Wormhole({ content: 'awesome' });

@Wormhole.compose([
	itWormhole.hoc('a'),
	isWormhole.hoc('b'),
	awesomeWormhole.hoc({
		injectProp: 'c',
		select({ content }) { return content; }
	}),
])
export default class App extends Component {
	static propTypes = {
		a: PropTypes.string,
		b: PropTypes.string,
		c: PropTypes.string,
	};

	render() {
		const { a, b, c } = this.props;
		return (
			<h1>{a} {b} {c}</h1>
		);
	}
}
```

---

#### static fromContext(contextTypes, getHocMakers[, Component])

Compose wormholes from `context`. You could define some wormhole instances to `childContextTypes` in parent component, and then get and compose some wormhole instances in child component through `fromContext`. It's useful when using server-side rendering, because the wormhole instances are no longer singletons.

###### Arguments

1. contextTypes (Object): Just the same with `static contextTypes` in React Component.
2. getHocMakers (Function): Return an array of `hocMaker` through `context`. (See the example below for detail.)
3. Component (ReactComponent): Target React Component to HOC.

###### Return

(Function|ReactComponent): If provide a `Component` as the second argument, it will return a new React Component. Otherwise, it will return currify function.

###### Example

Basic usage:

```js
import React, { Component, PropTypes } from 'react';
import Wormhole from 'react-wormhole-hoc';

@Wormhole.fromContext(
	{ store: PropTypes.object }, // the same with `static contextType`
	(context) => context.store.myData.hoc('a'),
)
class App extends Component {
	static propTypes = {
		a: PropTypes.string,
	};

	render() {
		const { a } = this.props;
		return (
			<h1>{this.props.a}</h1>
		);
	}
}

class Container extends Component {
	static childContextTypes = {
		store: PropTypes.object,
	};

	getChildContext() {
		return {
			store: {

				// Define a wormhole
				myData: new Wormhole('awesome'),

			},
		};
	}

	render() {
		return (<App />);
	}
}
```


## Installing

Using npm:

```
npm install --save react-wormhole-hoc
```

Using yarn:

```
yarn add react-wormhole-hoc
```

## Note

If you want some communications base on paren-child coupling, please use react [context](https://facebook.github.io/react/docs/context.html) instead.


## Related Projects

- https://github.com/ReactTraining/react-broadcast
- https://github.com/gnoff/react-tunnel


## License

MIT @ Cap32
