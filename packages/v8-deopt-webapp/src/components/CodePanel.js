import { createElement } from "preact";
import { useMemo, useCallback } from "preact/hooks";
import { memo } from "preact/compat";
import Prism from "prismjs";
import { addFileDeoptDataForHighlight } from "../utils/deoptMarkers";
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
		(codeEl) => {
			addFileDeoptDataForHighlight(codeEl, routeParams.fileId, fileDeoptInfo);
		},
		[routeParams.fileId, fileDeoptInfo]
	);

	return (
		<div>
			<PrismCode
				src={fileDeoptInfo.src}
				lang={lang}
				class="line-numbers"
				onBeforeHighlight={onBeforeHighlight}
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
 * @param {{ lang: string; src: string; class?: string; onBeforeHighlight?: (code: HTMLElement) => void; children?: any }} props
 */
function PrismCode(props) {
	const className = [`language-${props.lang}`, props.class].join(" ");

	const { __html, preClass, codeClass } = useMemo(() => {
		const code = document.createElement("code");
		code.className = className;
		code.textContent = props.src;

		const pre = document.createElement("pre");
		pre.className = className;

		props.onBeforeHighlight(code);
		Prism.highlightElement(code);

		return {
			__html: code.innerHTML,
			preClass: pre.className,
			codeClass: code.className,
		};
	}, [props.src, props.lang, props.class, props.onBeforeHighlight]);

	return (
		<pre class={preClass}>
			<code class={codeClass} dangerouslySetInnerHTML={{ __html }} />
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
