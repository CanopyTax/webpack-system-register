# webpack-system-register
A webpack plugin that wraps your bundle in a [System.register](https://github.com/ModuleLoader/es6-module-loader/wiki/System.register-Explained) call. This makes webpack bundles totally consumable by [SystemJS](https://github.com/systemjs/systemjs).

## Motivation
- `System.import` webpack apps.
- Inject SystemJS modules into webpack bundles.
- Export variables from webpack apps into SystemJS apps.

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
All configuration options are passed as properties of the object given to the WebpackSystemRegister constructor. All properties are optional and if no configuration is provided, webpack-system-register will simply wrap you webpack bundle in a System.register call (nothing more).

- `systemjsDeps` (optional): an array of dependency names that should not be bundled into the webpack bundle, but instead be provided by SystemJS. These dependency names should either be literal strings or Regular Expressions.
- `registerName` (optional): a string that SystemJS will use as the name of the module. Generally speaking, this is the name by which you want other code to be able to SystemJS.import() your webpack bundle.
- `publicPath`: (optional) an object with configuration options for setting webpack's `output.publicPath` variable dynamically
  - `useSystemJSLocateDir`: (optional) A subproperty of the `publicPath` object. If it is set to true, this will cause webpack's `output.publicPath` to be set *dynamically at runtime*, based on the URL address from which the webpack bundle was loaded by SystemJS. For example, if the webpack bundle is SystemJS.imported from url `http://localhost:8080/webpack.bundle.js`, the publicPath for webpack will be `http://localhost:8080`. Since this would completely overwrite the normal `output.publicPath` option that is passed directly to webpack, webpack-system-register will throw an error if both `output.publicPath` and `publicPath` are set. Additionally, at least for now, the `registerName` must also be provided in order to use `publicPath.useSystemJSLocateDir`. See example below
```js
// Example webpack.config.js showcasing usage of `useSystemJSLocateDir`
var WebpackSystemRegister = require('webpack-system-register');

module.exports = {
  output: {
    filename: "my-bundle.js",
    publicPath: null, // This MUST not be set when using `useSystemJSLocateDir`
  },
  plugins: [
    new WebpackSystemRegister({
      registerName: 'my-bundle', // required when using `useSystemJSLocateDir`
      publicPath: {
        useSystemJSLocateDir: true, // if this is set to true, publicPath must be omitted and registerName must be provided
      }
    }
  ]
}
```
 
## Exporting variables from webpack into SystemJS.
To do this, simply export the variables from your webpack entry file. They will automatically be exposed to anybody who `System.import`s your webpack bundle. Note that (at least right now) if you mutate an exported value that that mutation will *not* be re-exported like it's supposed to according to the ES6 spec. The reason for this is basically just that it's really hard for me to detect mutation so I decided not to try.

## Examples
To run the [examples](https://github.com/CanopyTax/webpack-system-register/tree/master/examples) locally, run `npm install && npm run build` from inside of the example directory that you're interested in. Then run `npm start` and open up your web browser to localhost:8080.
