import { createElement } from "preact";
import { useLayoutEffect, useRef } from "preact/hooks";
import Prism from "prismjs";
import { addFileDeoptDataForHighlight } from "../utils/deoptMarkers";
import "./CodePanel.scss";

/**
 * @param {string} path
 */
function determineLanguage(path) {
	if (path.endsWith(".js")) {
		return "javascript";
	} else {
		return "html";
	}
}

/**
 * @param {{ fileDeoptInfo: import('..').V8DeoptInfoWithSources }} props
 */
export function CodePanel({ fileDeoptInfo }) {
	if (!fileDeoptInfo.src) {
		return <CodeError error={fileDeoptInfo.error} />;
	}

	const codeRef = useRef(null);
	const lang = determineLanguage(fileDeoptInfo.srcPath);

	// use layout effect here to avoid flash of un-highlighted text
	useLayoutEffect(() => {
		if (codeRef.current) {
			addFileDeoptDataForHighlight(codeRef.current, fileDeoptInfo);
			Prism.highlightElement(codeRef.current);
		}
	}, [fileDeoptInfo, codeRef.current]);

	return (
		<div>
			<pre class={`line-numbers language-${lang}`}>
				<code class={`language-${lang}`} ref={codeRef}>
					{fileDeoptInfo.src}
				</code>
				<LineNumbers contents={fileDeoptInfo.src} />
			</pre>
		</div>
	);
}

const NEW_LINE_EXP = /\n(?!$)/g;

/**
 * @param {{ contents: string }} props
 */
function LineNumbers({ contents }) {
	const lines = contents.split(NEW_LINE_EXP);
	return (
		<span class="line-numbers-rows" aria-hidden="true">
			{lines.map(() => (
				<span />
			))}
		</span>
	);
}

function CodeError({ error }) {
	// TODO: Improve
	return (
		<div>
			Error! {error instanceof Error ? error.toString() : JSON.stringify(error)}
		</div>
	);
}
