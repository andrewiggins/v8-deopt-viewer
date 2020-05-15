import { createElement } from "preact";
import { useMemo, useCallback } from "preact/hooks";
import { memo } from "preact/compat";
import Prism from "prismjs";
import { addDeoptMarkers } from "../utils/deoptMarkers";
import "./CodePanel.scss";

/**
 * @param {string} path
 */
function determineLanguage(path) {
	if (path.endsWith(".js")) {
		return "javascript";
	} else if (path.endsWith(".html")) {
		return "html";
	} else {
		// TODO: is this good enough?
		return "html";
	}
}

/**
 * @param {import('..').V8DeoptInfoWithSources} fileDeoptInfo
 * @param {string} entryId
 * @returns {import('v8-deopt-parser').Entry}
 */
function findEntry(fileDeoptInfo, entryId) {
	if (!entryId) {
		return null;
	}

	/** @type {Array<keyof import('v8-deopt-parser').V8DeoptInfo>} */
	const kinds = ["codes", "deopts", "ics"];
	for (let kind of kinds) {
		for (let entry of fileDeoptInfo[kind]) {
			if (entry.id == entryId) {
				return entry;
			}
		}
	}
}

/**
 * @param {import("./FileViewer").FileViewerProps} props
 */
export function CodePanel({ routeParams, fileDeoptInfo }) {
	if (!fileDeoptInfo.src) {
		return <CodeError error={fileDeoptInfo.error} />;
	}

	const lang = determineLanguage(fileDeoptInfo.srcPath);
	const selectedEntry = findEntry(fileDeoptInfo, routeParams.entryId);
	const onBeforeHighlight = useCallback(
		(rawHtml) => addDeoptMarkers(rawHtml, routeParams.fileId, fileDeoptInfo),
		[routeParams.fileId, fileDeoptInfo]
	);

	return (
		<div>
			<PrismCode
				src={fileDeoptInfo.src}
				lang={lang}
				class="line-numbers"
				postProcessHighlight={onBeforeHighlight}
			>
				<LineNumbers
					selectedLine={selectedEntry?.line ?? -1}
					contents={fileDeoptInfo.src}
				/>
			</PrismCode>
		</div>
	);
}

/**
 * @param {{ lang: string; src: string; class?: string; postProcessHighlight?: (code: string) => string; children?: any }} props
 */
function PrismCode(props) {
	const className = [`language-${props.lang}`, props.class].join(" ");

	const __html = useMemo(() => {
		let html = Prism.highlight(
			props.src,
			Prism.languages[props.lang],
			props.lang
		);

		// TODO: This postProcess pattern is leads to 3 expensive operations:
		// 1. Parse initial Prism html in addDeoptMarks `root.innerHtml = rawHtml`
		// 2. Re-serialize markup after markers have been added
		// 3. Preact sets final markup to innerHTML of real element
		//
		// Perhaps we should manually muck up Prism markup in parent component
		// after Prism has set innerHTML on its own element to avoid 1 & 2
		if (props.postProcessHighlight) {
			html = props.postProcessHighlight(html);
		}

		return html;
	}, [props.src, props.lang, props.postProcessHighlight]);

	return (
		<pre class={className}>
			<code class={className} dangerouslySetInnerHTML={{ __html }} />
			{props.children}
		</pre>
	);
}

const NEW_LINE_EXP = /\n(?!$)/g;

/**
 * @param {{ selectedLine: number; contents: string }} props
 */
const LineNumbers = memo(({ selectedLine, contents }) => {
	const lines = useMemo(() => contents.split(NEW_LINE_EXP), [contents]);
	return (
		<span class="line-numbers-rows" aria-hidden="true">
			{lines.map((_, i) => (
				<span class={i == selectedLine - 1 ? "active" : null} />
			))}
		</span>
	);
});

function CodeError({ error }) {
	// TODO: Improve
	return (
		<div>
			Error! {error instanceof Error ? error.toString() : JSON.stringify(error)}
		</div>
	);
}
