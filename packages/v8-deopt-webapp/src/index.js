import { render, createElement } from "preact";
import { App } from "./components/App";

/**
 * @param {import('.').AppProps["deoptInfo"]} deoptInfo
 * @param {Element} container
 */
export function renderIntoDom(deoptInfo, container) {
	render(<App deoptInfo={deoptInfo} />, container);
}
