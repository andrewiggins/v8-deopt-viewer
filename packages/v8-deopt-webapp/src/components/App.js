import { createElement, Fragment } from "preact";
import { Summary } from "./Summary";

/**
 * @param {import('..').AppProps} props
 */
export function App({ deoptInfo }) {
	return (
		<Fragment>
			<h1>V8 Deopt Viewer</h1>
			<Summary deoptInfo={deoptInfo} />
		</Fragment>
	);
}
