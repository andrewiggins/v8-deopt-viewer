import { Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useLocation } from "wouter-preact";
import {
	map_selectors,
	grouping as map_grouping,
	group_value,
	map_ids,
	map_details,
	map_title,
	selected as selected_class,
	goto_loc_btn,
	icon_triangle_up,
	icon_triangle_down,
	icon_double_bars,
} from "./MapExplorer.module.scss";
import {
	btn,
	btn_link,
	form_group,
	form_select,
	form_label,
	icon,
	icon_lg,
	icon_plus,
	timeline,
	timeline_item,
	timeline_left,
	timeline_icon,
	timeline_content,
} from "../../spectre.module.scss";
import { MIN_SEVERITY } from "v8-deopt-parser/src/utils.js";
import { mapsRoute } from "../../routes.js";
import { formatMapId, hasMapData } from "../../utils/mapUtils.js";
import { useAppDispatch, useAppState } from "../appState.jsx";

/**
 * @typedef {"create" | "loadic" | "property" | "mapid"} MapGrouping
 * @type {Record<MapGrouping, { label: string; valueLabel: string; value: MapGrouping }>}
 */
const mapGroupings = {
	loadic: {
		label: "LoadIC location",
		valueLabel: "Location",
		value: "loadic",
	},
	property: {
		label: "Property name",
		valueLabel: "Property",
		value: "property",
	},
	create: {
		label: "Creation location",
		valueLabel: "Location",
		value: "create",
	},
	mapid: {
		label: "Map ID",
		valueLabel: "ID",
		value: "mapid",
	},
};

/**
 * // GroupingValues
 * @typedef {{ group: "loadic"; id: string; label: string, mapIds: string[]; entry: import("v8-deopt-parser").ICEntry; }} LoadICGroupingValue
 * @typedef {{ group: "property"; id: string; label: string, mapIds: string[] }} PropertyGroupingValue
 * @typedef {{ group: "create"; id: string; label: string, mapIds: string[]; filePosition: import("v8-deopt-parser").FilePosition; }} CreateGroupingValue
 * @typedef {{ group: "mapid"; id: string; label: string, mapIds: string[] }} MapIdGroupingValue
 * @typedef {LoadICGroupingValue | PropertyGroupingValue | CreateGroupingValue | MapIdGroupingValue} GroupingValue
 * // State
 * @typedef State
 * @property {MapGrouping} grouping
 * @property {GroupingValue[]} groupValues
 * @property {GroupingValue} selectedGroup
 * @property {MapEntry["id"]} selectedMapId
 * // Actions
 * @typedef {"SET_GROUPING" | "SET_GROUP_VALUE" | "SET_MAP_ID"} GroupingActionType
 * @typedef {{ type: "SET_GROUPING"; newGrouping: MapGrouping; newGroupValues: GroupingValue[] }} SetGroupingAction
 * @typedef {{ type: "SET_GROUP_VALUE"; newValue: string; }} SetGroupValueAction
 * @typedef {{ type: "SET_MAP_ID"; newMapId: string; }} SetMapIDAction
 * @typedef {SetGroupingAction | SetGroupValueAction | SetMapIDAction} Action
 * // Reducer params
 * @param {State} state
 * @param {Action} action
 * @returns {State}
 */
function mapGroupingReducer(state, action) {
	if (action.type == "SET_GROUPING") {
		const groupValues = action.newGroupValues;
		const selectedGroup =
			groupValues.length == 0 ? null : action.newGroupValues[0];
		const mapIds = selectedGroup?.mapIds;

		return {
			grouping: action.newGrouping,
			groupValues,
			selectedGroup,
			selectedMapId: mapIds?.length > 0 ? mapIds[0] : null,
		};
	} else if (action.type == "SET_GROUP_VALUE") {
		const selectedGroup = state.groupValues.find(
			(v) => v.id == action.newValue
		);
		return {
			...state,
			selectedGroup,
			selectedMapId: selectedGroup.mapIds[0],
		};
	} else if (action.type == "SET_MAP_ID") {
		return {
			...state,
			selectedMapId: action.newMapId,
		};
	} else {
		return state;
	}
}

/**
 * @param {MapExplorerProps} props
 * @returns {State}
 */
function initGroupingState(props) {
	const routeParams = props.routeParams;
	const grouping = routeParams.grouping ?? "loadic";
	const groupValues = getGroupingValues(
		grouping,
		props.mapData,
		props.fileDeoptInfo,
		props.settings
	);

	let selectedGroup = null;
	if (groupValues.length > 0) {
		selectedGroup = groupValues[0];
		if (routeParams.groupValue) {
			selectedGroup = groupValues.find(
				(value) => value.id == routeParams.groupValue
			);
		}
	}

	return {
		grouping,
		groupValues,
		selectedGroup,
		selectedMapId:
			routeParams.mapId ??
			((selectedGroup?.mapIds.length ?? 0) > 0
				? selectedGroup.mapIds[0]
				: null),
	};
}

/**
 * @typedef {import('v8-deopt-parser').MapData} MapData
 * @typedef {import('v8-deopt-parser').MapEntry} MapEntry
 * @typedef {import('v8-deopt-parser').MapEdge} MapEdge
 * @typedef {import("../..").FileV8DeoptInfoWithSources} FileV8DeoptInfo
 *
 * @typedef MapExplorerRouteParams
 * @property {string} fileId
 * @property {MapGrouping} [grouping]
 * @property {string} [groupValue]
 * @property {string} [mapId]
 *
 * @typedef MapExplorerProps
 * @property {MapData} mapData
 * @property {FileV8DeoptInfo} fileDeoptInfo
 * @property {MapExplorerRouteParams} routeParams
 * @property {import('../CodeSettings').CodeSettingsState} settings
 * @property {number} fileId
 *
 * @param {MapExplorerProps} props
 */
export function MapExplorer(props) {
	const hasMaps = hasMapData(props.mapData);
	if (!hasMaps) {
		return (
			<div>
				<p>
					No map data found in this log file. In order to explore maps, re-run
					v8-deopt-viewer without the '--skipMaps' flag to include map data in
					your log
				</p>
			</div>
		);
	}

	// TODO:
	//  - Hmm should switching tabs loose state in Map Explorer? Probs not :(
	//  - Can selecting a loadIC location also highlight that IC entry in the IC
	//    Explorer tab to maintain context between the two?
	//
	//  Re: the above - perhaps FileViewer should on initial render read the URL
	//  param to determine the initial deopt panel to display (pass it into the
	//  initialState arg of useState) but use local state when changing tabs. Then
	//  each deopt panel can use the `useRoute` hook to determine if it is the
	//  active route and read it's state from that route, else rely on local or
	//  global shared state.

	// TODO: Handle cross file map source links since maps aren't file specific.
	// Consider where currentFile id should be stored. Currently it is a prop to
	// MapExplorer but should probably live somewhere central and managed there.

	// TODO: Consider showing map details inline on the ICEntry table

	// TODO: Show entire tree (all children) for selected map

	// TODO: Maybe I just just re-design the entire UI lol. Initial drawings I
	// like:
	//
	// File selector and viewer on the left with inline dropdown as well as link
	// to replace file viewer with a file list. Also includes toggle to filter
	// data entries by the selected file.
	//
	// On the right, a VSCode- or Teams-like UI with icons running down the right
	// side (with labels underneath or tooltips) for various views: 📄Summary,
	// 🔺Opts, 🔻Deopts, ☎Inline Caches, 🌐Map explorer, ⚙Settings, ❔Help.
	//
	// Since map explorer is across files, re-consider how general nav works. Some
	// Spectre components/experiments that may be useful:
	// - https://picturepan2.github.io/spectre/experimentals/filters.html
	//    - filter entries by file
	// - https://picturepan2.github.io/spectre/experimentals/autocomplete.html
	//    - filter entries by file
	//    - select which file's code to show
	//    - select which data tables to show (Summary, Opts, Deopts, IC Entries,
	//      etc.)
	// - https://picturepan2.github.io/spectre/components/breadcrumbs.html
	//    - Display which file is shown and filter file results
	// - https://picturepan2.github.io/spectre/components/cards.html
	//    - File summary organizer
	// - https://picturepan2.github.io/spectre/components/modals.html
	//    - More advanced settings menu
	// - https://picturepan2.github.io/spectre/components/panels.html
	//    - File summary organizer
	//    - Data view organizer
	// - https://picturepan2.github.io/spectre/components/tiles.html
	//    - ?
	// - https://picturepan2.github.io/spectre/components/tabs.html
	//    - ?

	const { mapData, fileDeoptInfo, routeParams, settings, fileId } = props;

	// const [state, dispatch] = useReducer(
	// 	mapGroupingReducer,
	// 	props,
	// 	initGroupingState
	// );

	// useEffect(() => {
	// 	if (state.grouping == "loadic") {
	// 		// Re-use SET_GROUPING action to recompute groupingValues. Currently this
	// 		// only needs to happen on the loadic grouping
	// 		dispatch({
	// 			type: "SET_GROUPING",
	// 			newGrouping: state.grouping,
	// 			newGroupValues: getGroupingValues(
	// 				state.grouping,
	// 				mapData,
	// 				fileDeoptInfo,
	// 				settings
	// 			),
	// 		});
	// 	}
	// }, [mapData, fileDeoptInfo, settings]);

	const state = initGroupingState(props);

	const [_, setLocation] = useLocation();

	const mapIds = state.selectedGroup?.mapIds ?? [];

	const appState = useAppState();
	const { setSelectedEntry, setSelectedPosition } = useAppDispatch();
	const showICLocation =
		appState.selectedEntry == null &&
		appState.selectedPosition != null &&
		state.grouping == "loadic";

	useEffect(() => {
		if (state.selectedGroup) {
			if (
				state.selectedGroup.group == "loadic" &&
				state.selectedGroup.entry.file == fileDeoptInfo.id
			) {
				setSelectedEntry(state.selectedGroup.entry);
			} else if (
				state.selectedGroup.group == "create" &&
				state.selectedGroup.filePosition.file == fileDeoptInfo.id
			) {
				setSelectedPosition(state.selectedGroup.filePosition);
			} else {
				setSelectedEntry(null);
			}
		}
	}, [
		state.selectedGroup.group,
		state.selectedGroup.id,
		state.selectedGroup.label,
		fileDeoptInfo,
	]);

	return (
		<Fragment>
			<div class={map_selectors}>
				<div class={[form_group, map_grouping].join(" ")}>
					<label for="map-grouping" class={form_label}>
						{/* "Find Maps by" or "Map grouping" */}
						Group Maps by:
					</label>
					<select
						value={state.grouping}
						onChange={(e) => {
							/** @type {MapGrouping} */
							// @ts-ignore
							const grouping = e.currentTarget.value;
							// dispatch({
							// 	type: "SET_GROUPING",
							// 	newGrouping: grouping,
							// 	newGroupValues: getGroupingValues(
							// 		grouping,
							// 		mapData,
							// 		fileDeoptInfo,
							// 		settings
							// 	),
							// });
							if (grouping !== state.grouping) {
								setLocation(mapsRoute.getHref(fileId, grouping));
							}
						}}
						id="map-grouping"
						class={form_select}
					>
						{Object.values(mapGroupings).map((group) => (
							<option key={group.value} value={group.value}>
								{group.label}
							</option>
						))}
					</select>
				</div>
				<div class={[form_group, group_value].join(" ")}>
					<label for="map-group" class={form_label}>
						{mapGroupings[state.grouping].valueLabel}:
					</label>
					<select
						value={state.selectedGroup?.id ?? ""}
						disabled={state.groupValues.length == 0}
						onChange={(e) => {
							const newGroupValue = e.currentTarget.value;
							// dispatch({
							// 	type: "SET_GROUP_VALUE",
							// 	newValue: newGroupValue,
							// });
							if (newGroupValue.id !== state.selectedGroup.id) {
								setLocation(
									mapsRoute.getHref(fileId, state.grouping, newGroupValue)
								);
							}
						}}
						id="map-group"
						class={form_select}
					>
						{state.groupValues.length == 0 ? (
							<option>No values available</option>
						) : (
							state.groupValues.map((value) => (
								<option value={value.id}>{value.label}</option>
							))
						)}
					</select>
				</div>
				<div class={[form_group, map_ids].join(" ")}>
					<label for="map-id" class={form_label}>
						Map:
					</label>
					<select
						value={state.selectedMapId}
						id="map-id"
						class={form_select}
						disabled={mapIds.length < 2}
						onChange={(e) => {
							const newMapId = e.currentTarget.value;
							// dispatch({
							// 	type: "SET_MAP_ID",
							// 	newMapId,
							// });
							setLocation(
								mapsRoute.getHref(
									fileId,
									state.grouping,
									state.selectedGroup.id,
									newMapId
								)
							);
						}}
					>
						{mapIds.length == 0 ? (
							<option>No values available</option>
						) : (
							mapIds.map((mapId) => (
								<option value={mapId}>{formatMapId(mapId)}</option>
							))
						)}
					</select>
				</div>
			</div>
			<p style={{ marginBottom: "1.5rem" }}>
				{showICLocation && (
					<button
						class={`${btn} ${btn_link} ${goto_loc_btn}`}
						style={{ float: "right" }}
						onClick={() => {
							if (state.selectedGroup.group == "loadic") {
								setSelectedEntry(state.selectedGroup.entry);
							}
						}}
					>
						Show IC location
					</button>
				)}
			</p>
			{state.selectedMapId && (
				<MapTimeline
					mapData={mapData}
					selectedEntry={mapData.nodes[state.selectedMapId]}
					selectedPosition={appState.selectedPosition}
					currentFile={fileDeoptInfo.id}
				/>
			)}
		</Fragment>
	);
}

/**
 * @typedef MapTimelineProps
 * @property {MapData} mapData
 * @property {MapEntry} selectedEntry
 * @property {import("../appState").FilePosition} selectedPosition
 * @property {string} currentFile
 *
 * @param {MapTimelineProps} props
 */
function MapTimeline({
	mapData,
	selectedEntry,
	selectedPosition,
	currentFile,
}) {
	const mapParents = getMapParents(mapData, selectedEntry);

	return (
		<div class={timeline}>
			{mapParents.reverse().map((map) => (
				<MapTimelineItem
					key={map.id}
					mapData={mapData}
					map={map}
					selectedPosition={selectedPosition}
					currentFile={currentFile}
				/>
			))}
			<MapTimelineItem
				key={selectedEntry.id}
				mapData={mapData}
				map={selectedEntry}
				selectedPosition={selectedPosition}
				currentFile={currentFile}
				selected
			/>
		</div>
	);
}

/**
 * @typedef MapTimelineItemProps
 * @property {any} key To make TS happy, sigh
 * @property {MapData} mapData
 * @property {MapEntry} map
 * @property {boolean} [selected]
 * @property {import("../appState").FilePosition} selectedPosition
 * @property {string} currentFile
 * @param {MapTimelineItemProps} props
 */
function MapTimelineItem({
	mapData,
	map,
	selected = false,
	selectedPosition,
	currentFile,
}) {
	const detailsId = `${map.id}-details`;
	const selectedClass = selected ? selected_class : "";
	const map_timeline_item = "";
	const map_icon = "";

	const [open, setOpen] = useState(selected);
	const { setSelectedPosition } = useAppDispatch();

	const parentEdge = map.edge ? mapData.edges[map.edge] : null;

	const isInCurrentFile = map.filePosition?.file === currentFile;
	const isSelectedPosition = isSameLocation(map.filePosition, selectedPosition);

	return (
		<div class={`${timeline_item} ${map_timeline_item} ${selectedClass}`}>
			<div class={timeline_left}>
				<button
					class={`${timeline_icon} ${selected ? icon_lg : ""} ${map_icon}`}
					aria-controls={detailsId}
					style={{
						padding: 0,
						border: 0,
						cursor: "pointer",
						background: selected ? "#5755d9" : "inherit",
					}}
					onClick={() => setOpen((opened) => !opened)}
				>
					{selected ? <i class={`${icon} ${getEdgeIcon(parentEdge)}`}></i> : ""}
				</button>
			</div>
			<div class={timeline_content}>
				<details id={detailsId} class={map_details} open={open}>
					<summary
						class={`${selectedClass} ${map_title}`}
						onClick={(ev) => {
							ev.preventDefault();
							setOpen((opened) => !opened);
						}}
					>
						{parentEdge ? edgeToString(parentEdge) : map.address}
					</summary>
					<div>
						<button
							class={`${btn} ${btn_link} ${goto_loc_btn}`}
							disabled={!isInCurrentFile || isSelectedPosition}
							title={
								!isInCurrentFile
									? "Location is not in current file"
									: isSelectedPosition
									? "Location is currently highlighted"
									: null
							}
							onClick={() => setSelectedPosition(map.filePosition)}
						>
							Show creation location
						</button>
						{formatDescription(map)}
					</div>
				</details>
			</div>
		</div>
	);
}

/**
 * @param {MapGrouping} grouping
 * @param {MapExplorerProps["mapData"]} mapData
 * @param {MapExplorerProps["fileDeoptInfo"]} fileDeoptInfo
 * @param {MapExplorerProps["settings"]} settings
 * @returns {GroupingValue[]}
 */
function getGroupingValues(grouping, mapData, fileDeoptInfo, settings) {
	if (grouping == "loadic") {
		return fileDeoptInfo.ics
			.filter((icEntry) =>
				settings.showLowSevs ? true : icEntry.severity > MIN_SEVERITY
			)
			.map((icEntry) => {
				return {
					group: "loadic",
					id: icEntry.id,
					label: formatLocation(icEntry),
					mapIds: icEntry.updates.map((update) => update.map),
					entry: icEntry,
				};
			});
	} else if (grouping == "property") {
		/** @type {Map<string, GroupingValue>} */
		const properties = new Map();

		for (let mapKey in mapData.nodes) {
			const map = mapData.nodes[mapKey];
			const edge = map.edge ? mapData.edges[map.edge] : null;

			if (edge && edge.subtype == "Transition") {
				const propName = edge.name;

				if (!properties.has(propName)) {
					properties.set(edge.name, {
						group: "property",
						id: propName,
						label: propName,
						mapIds: [],
					});
				}

				properties.get(propName).mapIds.push(map.id);
			}
		}

		return Array.from(properties.values());
	} else if (grouping == "create") {
		/** @type {Map<string, GroupingValue>} */
		const createLocs = new Map();
		for (let mapId in mapData.nodes) {
			const map = mapData.nodes[mapId];
			if (map.filePosition) {
				const key = formatLocation(map.filePosition);
				if (createLocs.has(key)) {
					createLocs.get(key).mapIds.push(map.id);
				} else {
					createLocs.set(key, {
						group: "create",
						id: `${grouping}-${map.id}`,
						label: key,
						mapIds: [map.id],
						filePosition: map.filePosition,
					});
				}
			}
		}

		return Array.from(createLocs.values());
	} else if (grouping == "mapid") {
		return Object.keys(mapData.nodes).map((mapId) => {
			return {
				group: "mapid",
				id: mapId,
				label: formatMapId(mapId),
				mapIds: [mapId],
			};
		});
	} else {
		throw new Error(`Unknown map grouping value: ${grouping}`);
	}
}

/**
 * @param {{ functionName: string; line: number; column: number }} entry
 * @returns {string}
 */
function formatLocation(entry) {
	return `${entry.functionName} ${entry.line}:${entry.column}`;
}

/**
 * @param {MapEntry} map
 * @returns {string[]}
 */
function formatDescription(map) {
	return map.description
		.trim()
		.split("\n")
		.map((line) => [line, <br />])
		.flat();
}

/**
 * @param {MapData} mapData
 * @param {MapEntry} map
 */
function getMapParents(mapData, map) {
	const parents = [];
	while (map?.edge) {
		const edge = mapData.edges[map.edge];

		map = null;
		if (edge?.from) {
			map = mapData.nodes[edge.from];
			if (map) {
				parents.push(map);
			}
		}
	}

	return parents;
}

/**
 * @param {MapEdge} edge
 */
function edgeToString(edge) {
	switch (edge.subtype) {
		case "Transition":
			return "Transition: " + edge.name;
		case "SlowToFast":
			return edge.reason;
		case "CopyAsPrototype":
			return "Copy as Prototype";
		case "OptimizeAsPrototype":
			return "Optimize as Prototype";
		default:
			return `${edge.subtype} ${edge?.reason ?? ""} ${edge?.name ?? ""}`;
	}
}

/**
 * @param {MapEdge | null} edge
 */
function getEdgeIcon(edge) {
	switch (edge?.subtype) {
		case "Transition":
			return icon_plus; // "+"
		case "Normalize": // FastToSlow
			return icon_triangle_down; // ⊡
		case "SlowToFast":
			return icon_triangle_up; // ⊛
		case "ReplaceDescriptors":
			return edge.name ? icon_plus : icon_double_bars; // + or ∥
		default:
			return "";
	}
}

/**
 * @param {import('../appState').FilePosition} loc1
 * @param {import('../appState').FilePosition} loc2
 * @returns {boolean}
 */
function isSameLocation(loc1, loc2) {
	return (
		loc1 != null &&
		loc2 != null &&
		loc1.file == loc2.file &&
		loc1.functionName == loc2.functionName &&
		loc1.line == loc2.line &&
		loc1.column == loc2.column
	);
}
