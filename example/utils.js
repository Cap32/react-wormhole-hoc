/* eslint-disable react/prop-types */

import React from 'react';
import fakeData from './fakeData';

export const getLocation = () => window.location.hash.slice(1) || '/';

export const Box = ({ color = 'red', style, title, children }) =>
	<div
		style={{
			border: `1px solid ${color}`,
			padding: 20,
			...style,
		}}
	>
		<p>{title}</p>
		{children}
	</div>
;

export const Link = ({ href, ...other }) =>
	<a
		style={{ padding: '4px 10px' }}
		{...other}
		href={href}
		onClick={(ev) => ev.preventDefault() || (window.location.hash = `#${href}`)}
	/>
;

export const fetch = () => new Promise((resolve) =>
	setTimeout(() => resolve(fakeData), 2000)
);
