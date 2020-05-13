import { render, createElement } from "preact";
import { App } from "./components/App";

/**
 * @param {import('.').V8DeoptInfoWithSources} deoptInfo
 * @param {Element} container
 */
export function renderIntoDom(deoptInfo, container) {
	render(<App deoptInfo={deoptInfo} />, container);
}
