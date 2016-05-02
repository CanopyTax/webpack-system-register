# webpack-system-register
A webpack plugin that wraps your bundle in a [System.register](https://github.com/ModuleLoader/es6-module-loader/wiki/System.register-Explained) call. This makes webpack bundles totally consumable by [SystemJS](https://github.com/systemjs/systemjs).

## Features
- `System.import` webpack apps.
- load systemjs dependencies into webpack apps, by excluding those dependencies from the webpack bundle and declaring them as SystemJS dependencies.
- export variables from webpack apps into systemjs apps.

## Usage
First, install the webpack-system-register plugin.
```bash
npm install --save-dev webpack-system-register
```

Then add it to your webpack plugins.
```js
// webpack.config.js
const WebpackSystemRegister = require('webpack-system-register');

module.exports = {
  ...
	plugins: [
		new WebpackSystemRegister({
			systemjsDeps: [
				/^react/, // any import that starts with react
				'react-dom', // only the `react-dom` import
				/^lodash/, // any import that starts with lodash
			],
			registerName: 'test-module', // optional name that SystemJS will know this bundle as.
		}),
	],
}
```

## Configuration Options
All configuration options are passed as properties of the object given to the WebpackSystemRegister constructor.

- `systemjsDeps` (optional): an array of dependency names that should not be bundled into the webpack bundle, but instead be provided by SystemJS. These dependency names should either be literal strings or Regular Expressions.
- `registerName` (optional): a string that SystemJS will use as the name of the module.
 
## Exporting variables from webpack into SystemJS.
To do this, simply export the variables from your webpack entry file. They will automatically be exposed to anybody who `System.import`s your webpack bundle.
