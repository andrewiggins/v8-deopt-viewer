import { createContext } from "preact";
import { useReducer, useMemo, useContext } from "preact/hooks";

/**
 * @typedef {import('v8-deopt-parser').FilePosition} FilePosition
 *
 * @typedef AppDispatchContextValue
 * @property {(newPos: FilePosition | null) => void} setSelectedPosition
 * @property {(newEntry: import('v8-deopt-parser').Entry | null) => void} setSelectedEntry
 */

/** @type {(props: any) => AppContextState} */
const initialState = (props) => ({
	prevPosition: null,
	prevSelectedEntry: null,
	selectedPosition: null,
	selectedEntry: null,
});

/** @type {import('preact').PreactContext<AppContextState>} */
const AppStateContext = createContext(initialState(null));

/** @type {import('preact').PreactContext<AppDispatchContextValue>} */
const AppDispatchContext = createContext(
	/** @type {AppDispatchContextValue} */ ({
		setSelectedEntry() {
			throw new Error("AppDispatchContext was not properly provided");
		},
		setSelectedPosition() {
			throw new Error("AppDispatchContext was not properly provided");
		},
	})
);

/**
 * @typedef {import('v8-deopt-parser').Entry} Entry
 * // State
 * @typedef AppContextState
 * @property {Entry | null} prevSelectedEntry
 * @property {Entry | null} selectedEntry
 * @property {FilePosition | null} prevPosition
 * @property {FilePosition | null} selectedPosition
 * // Actions
 * @typedef {{ type: "SET_SELECTED_POSITION"; newPosition: FilePosition | null; }} SetSelectedPosition
 * @typedef {{ type: "SET_SELECTED_ENTRY"; entry: Entry | null; }} SetSelectedEntry
 * @typedef {SetSelectedPosition | SetSelectedEntry} AppContextAction
 * // Reducer
 * @param {AppContextState} state
 * @param {AppContextAction} action
 * @returns {AppContextState}
 */
function appContextReducer(state, action) {
	switch (action.type) {
		case "SET_SELECTED_POSITION":
			return {
				prevPosition: state.selectedPosition,
				prevSelectedEntry: state.selectedEntry,
				selectedPosition: action.newPosition,
				selectedEntry: null,
			};
		case "SET_SELECTED_ENTRY":
			const entry = action.entry;
			return {
				prevPosition: state.selectedPosition,
				prevSelectedEntry: state.selectedEntry,
				selectedPosition: entry && {
					functionName: entry.functionName,
					file: entry.file,
					line: entry.line,
					column: entry.column,
				},
				selectedEntry: entry,
			};
		default:
			return state;
	}
}

/**
 * @typedef AppProviderProps
 * @property {import('preact').JSX.Element | import('preact').JSX.Element[]} children
 * @param {AppProviderProps} props
 */
export function AppProvider(props) {
	const [state, dispatch] = useReducer(appContextReducer, props, initialState);

	/** @type {AppDispatchContextValue} */
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
		<AppDispatchContext.Provider value={dispatchers}>
			<AppStateContext.Provider value={state}>
				{props.children}
			</AppStateContext.Provider>
		</AppDispatchContext.Provider>
	);
}

export const useAppState = () => useContext(AppStateContext);
export const useAppDispatch = () => useContext(AppDispatchContext);
