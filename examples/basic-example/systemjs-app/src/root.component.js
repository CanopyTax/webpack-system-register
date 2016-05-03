import React from 'react';
import ReactDOM from 'react-dom';

export default function() {
	return React.createElement("button", {
		onClick: function() {
			SystemJS
			.import('/webpack-app/main.bundle.js')
			.then(webpackApp => {
				ReactDOM.render(React.createElement(webpackApp.reactComponent), document.getElementById('webpack-content'));
			})
			.catch(ex => {throw ex});
		}
	}, "Click me to load the webpack app");
}
