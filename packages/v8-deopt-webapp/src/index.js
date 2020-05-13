import { render, createElement } from "preact";
import { Summary } from "./Summary";
import "./index.css";

/**
 * @param {import('.').AppProps} props
 */
function App({ deoptInfo }) {
	return <Summary deoptInfo={deoptInfo} />;
}

/**
 * @param {Element} container
 */
export function renderIntoDom(deoptInfo, container) {
	render(<App deoptInfo={deoptInfo} />, container);
}
