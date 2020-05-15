import { createElement } from "preact";
import { useMemo, useRef, useLayoutEffect } from "preact/hooks";
import { memo, forwardRef } from "preact/compat";
import Prism from "prismjs";
import { addDeoptMarkers } from "../utils/deoptMarkers";
import styles from "./CodePanel.scss";
import markerStyles from "../utils/deoptMarkers.scss";

/**
 * @param {string} path
 */
function determineLanguage(path) {
	if (path.endsWith(".html")) {
		return "html";
	} else if (
		(path.startsWith("http:") || path.startsWith("https:")) &&
		!path.endsWith(".js")
	) {
		// Assume URLs without .js extensions are HTML pages
		return "html";
	} else {
		return "javascript";
	}
}

/**
 * @param {{ fileDeoptInfo: import("..").V8DeoptInfoWithSources; selectedEntry: import("v8-deopt-parser").Entry; fileId: string; showLineNums: boolean; showLowSevs: boolean; }} props
 */
export function CodePanel({
	fileDeoptInfo,
	selectedEntry,
	fileId,
	showLineNums,
	showLowSevs,
}) {
	if (!fileDeoptInfo.src) {
		return <CodeError error={fileDeoptInfo.error} />;
	}

	const lang = determineLanguage(fileDeoptInfo.srcPath);

	/** @type {import('preact').RefObject<HTMLElement>} */
	const codeRef = useRef(null);
	useLayoutEffect(() => {
		addDeoptMarkers(codeRef.current, fileId, fileDeoptInfo);
	}, [fileId, fileDeoptInfo]);

	return (
		<div
			class={[
				styles.codePanel,
				(showLowSevs && markerStyles.showLowSevs) || null,
			].join(" ")}
		>
			<PrismCode
				src={fileDeoptInfo.src}
				lang={lang}
				class={(showLineNums && "line-numbers") || null}
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
