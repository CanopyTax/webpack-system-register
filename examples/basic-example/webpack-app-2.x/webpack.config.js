const WebpackSystemRegister = require('../../../lib/webpack-system-register.js');

module.exports = {
	entry: {
		main: "./src/main.js",
	},

	output: {
		filename: "main.bundle.js",
	},

	module: {
		loaders: [
			{
				test: /\.js$/,
				loader: 'babel-loader',
			},
		],
	},

	plugins: [
		new WebpackSystemRegister({
			systemjsDeps: [
				/^react/, // anything that starts with react
			]
		}),
	]
}
