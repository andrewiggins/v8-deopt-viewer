import { createElement } from "preact";
import { Summary } from "./Summary";

/**
 * @param {import('..').AppProps} props
 */
export function App({ deoptInfo }) {
	return <Summary deoptInfo={deoptInfo} />;
}
