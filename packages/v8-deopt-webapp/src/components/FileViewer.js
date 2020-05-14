import { createElement } from "preact";

/**
 * @param {{ fileDeoptInfo: import('..').V8DeoptInfoWithSources }} props
 */
export function FileViewer({ fileDeoptInfo }) {
	return <div>{fileDeoptInfo.relativePath}</div>;
}
