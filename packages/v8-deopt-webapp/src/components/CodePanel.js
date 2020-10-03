import { createElement, createContext } from "preact";
import {
	useState,
	useMemo,
	useRef,
	useLayoutEffect,
	useContext,
	useReducer,
	useEffect,
} from "preact/hooks";
import { memo, forwardRef } from "preact/compat";
import Prism from "prismjs";
import { addDeoptMarkers, getMarkerId } from "../utils/deoptMarkers";
import { codePanel, error as errorClass } from "./CodePanel.scss";
import {
	showLowSevs as showLowSevsClass,
	active,
} from "../utils/deoptMarkers.scss";

// Turn on auto highlighting by Prism
Prism.manual = true;

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
 * @typedef {import('v8-deopt-parser').FilePosition} FilePosition
 *
 * @typedef CodePanelDispatchContextValue
 * @property {(newPos: FilePosition) => void} setSelectedPosition
 * @property {(newEntry: import('v8-deopt-parser').Entry) => void} setSelectedEntry
 */

/** @type {import('preact').PreactContext<CodeContextState>} */
const CodePanelStateContext = createContext(null);

/** @type {import('preact').PreactContext<CodePanelDispatchContextValue>} */
const CodePanelDispatchContext = createContext(null);

/**
 * @typedef {import('v8-deopt-parser').Entry} Entry
 * // State
 * @typedef CodeContextState
 * @property {FilePosition} prevPosition
 * @property {string} prevMarkerId
 * @property {FilePosition} selectedPosition
 * @property {string} selectedMarkerId
 * // Actions
 * @typedef {{ type: "SET_SELECTED_POSITION"; newPosition: FilePosition; }} SetSelectedPosition
 * @typedef {{ type: "SET_SELECTED_ENTRY"; entry: Entry; }} SetSelectedEntry
 * @typedef {SetSelectedPosition | SetSelectedEntry} CodeContextAction
 * // Reducer
 * @param {CodeContextState} state
 * @param {CodeContextAction} action
 * @returns {CodeContextState}
 */
function codeContextReducer(state, action) {
	switch (action.type) {
		case "SET_SELECTED_POSITION":
			return {
				prevPosition: state.selectedPosition,
				prevMarkerId: state.selectedMarkerId,
				selectedPosition: action.newPosition,
				selectedMarkerId: null,
			};
		case "SET_SELECTED_ENTRY":
			const entry = action.entry;
			return {
				prevPosition: state.selectedPosition,
				prevMarkerId: state.selectedMarkerId,
				selectedPosition: {
					functionName: entry.functionName,
					file: entry.file,
					line: entry.line,
					column: entry.column,
				},
				selectedMarkerId: getMarkerId(entry),
			};
		default:
			return state;
	}
}

/** @type {(props: any) => CodeContextState} */
const initialState = (props) => ({
	prevPosition: null,
	prevMarkerId: null,
	selectedPosition: null,
	selectedMarkerId: null,
});

/**
 * @typedef CodePanelProviderProps
 * @property {import('preact').JSX.Element | import('preact').JSX.Element[]} children
 * @param {CodePanelProviderProps} props
 */
export function CodePanelProvider(props) {
	const [state, dispatch] = useReducer(codeContextReducer, props, initialState);
	const dispatchers = useMemo(
		() => ({
			setSelectedPosition(newPosition) {
				dispatch({ type: "SET_SELECTED_POSITION", newPosition });
			},
			setSelectedEntry(entry) {
				dispatch({ type: "SET_SELECTED_ENTRY", entry });
			},
		}),
		[dispatch]
	);

	return (
		<CodePanelDispatchContext.Provider value={dispatchers}>
			<CodePanelStateContext.Provider value={state}>
				{props.children}
			</CodePanelStateContext.Provider>
		</CodePanelDispatchContext.Provider>
	);
}

const useCodePanelState = () => useContext(CodePanelStateContext);
const useCodePanelDispatch = () => useContext(CodePanelDispatchContext);

/**
 * @param {Entry} entry
 * @param {boolean} shouldHighlight
 */
export function useHighlightEntry(entry, shouldHighlight) {
	const { setSelectedEntry } = useCodePanelDispatch();
	useEffect(() => {
		if (shouldHighlight) {
			setSelectedEntry(entry);
		}
	}, [shouldHighlight]);
}

/**
 * @typedef CodePanelProps
 * @property {import("../").FileV8DeoptInfoWithSources} fileDeoptInfo
 * @property {number} fileId
 * @property {import('./CodeSettings').CodeSettingsState} settings
 * @param {CodePanelProps} props
 */
export function CodePanel({ fileDeoptInfo, fileId, settings }) {
	if (fileDeoptInfo.srcError) {
		return <CodeError srcError={fileDeoptInfo.srcError} />;
	} else if (!fileDeoptInfo.src) {
		return <CodeError srcError="No sources for the file were found." />;
	}

	const lang = determineLanguage(fileDeoptInfo.srcPath);

	const state = useCodePanelState();
	const selectedLine = state.selectedPosition?.line;

	/**
	 * @typedef {Map<string, import('../utils/deoptMarkers').Marker>} MarkerMap
	 * @type {[MarkerMap, import('preact/hooks').StateUpdater<MarkerMap>]}
	 */
	const [markers, setMarkers] = useState(null);

	/** @type {import('preact').RefObject<HTMLElement>} */
	const codeRef = useRef(null);
	useLayoutEffect(() => {
		// Saved the new markers so we can select them when CodePanelContext changes
		const markers = addDeoptMarkers(codeRef.current, fileId, fileDeoptInfo);
		setMarkers(new Map(markers.map((marker) => [marker.id, marker])));
	}, [fileId, fileDeoptInfo]);

	useEffect(() => {
		if (state.prevMarkerId) {
			markers.get(state.prevMarkerId)?.classList.remove(active);
		}
		if (state.selectedMarkerId) {
			const target = markers.get(state.selectedMarkerId);
			target.classList.add(active);
			// TODO: Why doesn't the smooth behavior always work? It seems that only
			// the first or last call to scrollIntoView with behavior smooth works?
			target.scrollIntoView({ block: "center", behavior: "smooth" });
		}
	}, [state]);

	return (
		<div
			class={[
				codePanel,
				(settings.showLowSevs && showLowSevsClass) || null,
			].join(" ")}
		>
			<PrismCode
				src={fileDeoptInfo.src}
				lang={lang}
				class={(!settings.hideLineNums && "line-numbers") || null}
				ref={codeRef}
			>
				<LineNumbers selectedLine={selectedLine} contents={fileDeoptInfo.src} />
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

	// TODO: File route changes will unmount and delete this cache. May be useful
	// to cache across files so switching back and forth between files doesn't
	// re-highlight the file each time
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
const LineNumbers = memo(function LineNumbers({ selectedLine, contents }) {
	// TODO: Do we want to cache these results beyond renders and for all
	// combinations? memo will only remember the last combination.
	const lines = useMemo(() => contents.split(NEW_LINE_EXP), [contents]);
	return (
		<span class="line-numbers-rows" aria-hidden="true">
			{lines.map((_, i) => (
				<span class={i == selectedLine - 1 ? "active" : null} />
			))}
		</span>
	);
});

function CodeError({ srcError }) {
	return (
		<div class={[codePanel, errorClass].join(" ")}>
			Error! {srcError instanceof Error ? srcError.toString() : srcError}
		</div>
	);
}
