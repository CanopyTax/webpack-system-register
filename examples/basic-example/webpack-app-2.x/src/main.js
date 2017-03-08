import React from 'react';

export function reactComponent() {
	return (
		<div>
			<p>
				I am the webpack application, and I'm using SystemJS' version of react.
			</p>
			<p>
				I don't have to bundle react in with me, which makes my bundle a lot smaller.
			</p>
			<p>
				I exported a react component from the entry module of my webpack config, and that
				export made it to the SystemJS app that loaded me, who was able to render my react
				component to the DOM.
			</p>
		</div>
	);
}
