import { createElement } from "preact";
import { useMemo, useRef, useLayoutEffect } from "preact/hooks";
import { memo, forwardRef } from "preact/compat";
import Prism from "prismjs";
import { addDeoptMarkers } from "../utils/deoptMarkers";
import styles from "./CodePanel.scss";

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

	/** @type {import('preact').RefObject<HTMLElement>} */
	const codeRef = useRef(null);
	useLayoutEffect(() => {
		addDeoptMarkers(codeRef.current, routeParams.fileId, fileDeoptInfo);
	}, [routeParams.fileId, fileDeoptInfo]);

	return (
		<div class={styles.codePanel}>
			<PrismCode
				src={fileDeoptInfo.src}
				lang={lang}
				class="line-numbers"
				ref={codeRef}
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
 * @typedef {{ lang: string; src: string; class?: string; children?: any }} PrismCodeProps
 * @type {import('preact').FunctionComponent<PrismCodeProps>}
 */
const PrismCode = forwardRef((props, ref) => {
	const className = [`language-${props.lang}`, props.class].join(" ");

	const __html = useMemo(
		() => Prism.highlight(props.src, Prism.languages[props.lang], props.lang),
		[props.src, props.lang]
	);

	return (
		<pre class={className}>
			<code ref={ref} class={className} dangerouslySetInnerHTML={{ __html }} />
			{props.children}
		</pre>
	);
});

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
