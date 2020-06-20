import { render, createElement } from "preact";
import "preact/devtools";
import { App } from "./components/App";
import "./theme.scss";

/**
 * @param {import('.').AppProps["deoptInfo"]} deoptInfo
 * @param {Element} container
 */
export function renderIntoDom(deoptInfo, container) {
	render(<App deoptInfo={deoptInfo} />, container);
}
