import { render } from "preact";
import "preact/devtools";
import { App } from "./components/App.jsx";
import "./theme.module.scss";

// VSCode max file limits (https://git.io/JfAp3):
// MODEL_SYNC_LIMIT = 50 * 1024 * 1024; // 50 MB
// LARGE_FILE_SIZE_THRESHOLD = 20 * 1024 * 1024; // 20 MB;
// LARGE_FILE_LINE_COUNT_THRESHOLD = 300 * 1000; // 300K lines

/**
 * @param {import('.').AppProps["deoptInfo"]} deoptInfo
 * @param {Element} container
 */
export function renderIntoDom(deoptInfo, container) {
	render(<App deoptInfo={deoptInfo} />, container);
}
