import { createElement, Fragment } from "preact";
import { useEffect, useReducer, useState } from "preact/hooks";
import { useLocation } from "wouter-preact";
import {
	map_selectors,
	grouping as map_grouping,
	group_value,
	map_ids,
	map_details,
} from "./MapExplorer.scss";
import {
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
} from "../../spectre.scss";
import { MIN_SEVERITY } from "v8-deopt-parser/src/utils";
import { mapsRoute } from "../../routes";
import { formatMapId, hasMapData } from "../../utils/mapUtils";
import { useAppDispatch } from "../appState";

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
		return {
			grouping: action.newGrouping,
			groupValues: action.newGroupValues,
			selectedGroup: action.newGroupValues[0],
			selectedMapId: action.newGroupValues[0].mapIds[0],
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
	const groupValues = getGroupingValues(props, grouping);

	let selectedGroup = groupValues[0];
	if (routeParams.groupValue) {
		selectedGroup = groupValues.find(
			(value) => value.id == routeParams.groupValue
		);
	}

	return {
		grouping,
		groupValues,
		selectedGroup,
		selectedMapId: routeParams.mapId ?? selectedGroup.mapIds[0],
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

	// IMMEDIATE TODOS:
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
	//
	//  - How to make timeline item titles look clickable?
	//  - Setup button/link in timeline to show creation location of a map in src
	//    and scroll it into view
	//  - Look at other TODOs in this file

	// TODO: Since map explorer is across files, re-consider how general nav works.
	// Some Spectre components/experiments that may be useful:
	// - https://picturepan2.github.io/spectre/experimentals/filters.html
	// 		- filter entries by file
	// - https://picturepan2.github.io/spectre/experimentals/autocomplete.html
	// 		- filter entries by file
	// 		- select which file's code to show
	// 		- select which data tables to show (Summary, Opts, Deopts, IC Entries, etc.)
	// - https://picturepan2.github.io/spectre/components/breadcrumbs.html
	// 		- Display which file is shown and filter file results
	// - https://picturepan2.github.io/spectre/components/cards.html
	// 		- File summary organizer
	// - https://picturepan2.github.io/spectre/components/modals.html
	// 		- More advanced settings menu
	// - https://picturepan2.github.io/spectre/components/panels.html
	// 		- File summary organizer
	// 		- Data view organizer
	// - https://picturepan2.github.io/spectre/components/tiles.html
	// 		- ?
	// - https://picturepan2.github.io/spectre/components/tabs.html
	// 		- ?

	// TODO: Each map transition associated with a source location should have a
	// link to "show location" or "go to location". Need to handle cross file
	// links since maps aren't file specific.
	//
	// Would be important to keep existing Map Explorer view/selection. Would not
	// want to rebuild the DOM and lose focus. Would be nice to use normal links
	// and routing for cross-file changes but it might be hard to keep focus on
	// the existing element...

	// TODO: Show entire tree (all children) for selected map

	// TODO: Maybe I just just re-design the entire UI lol. Initial drawings I
	// like:
	//
	// File selector and viewer on the left with inline dropdown as well as link
	// to replace file viewer with a file list. Also includes toggle to filter
	// data entries by the selected file.
	//
	// On the right, a VSCode- or Teams-like UI with icons running down the right
	// side (with labels underneath or tooltips) for various views: 📄Summary, 🔺Opts,
	// 🔻Deopts, ☎Inline Caches, 🌐Map explorer, ⚙Settings, ❔Help.

	const [state, dispatch] = useReducer(
		mapGroupingReducer,
		props,
		initGroupingState
	);

	const [_, setLocation] = useLocation();

	const mapIds = state.selectedGroup.mapIds;

	const { setSelectedEntry, setSelectedPosition } = useAppDispatch();
	useEffect(() => {
		if (state.selectedGroup.group == "loadic") {
			setSelectedEntry(state.selectedGroup.entry);
		} else if (state.selectedGroup.group == "create") {
			setSelectedPosition(state.selectedGroup.filePosition);
		} else {
			setSelectedEntry(null);
		}
	}, [state.selectedGroup, props.fileDeoptInfo]);

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
							dispatch({
								type: "SET_GROUPING",
								newGrouping: grouping,
								newGroupValues: getGroupingValues(props, grouping),
							});
							setLocation(mapsRoute.getHref(props.fileId, grouping));
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
						onChange={(e) => {
							const newGroupValue = e.currentTarget.value;
							dispatch({
								type: "SET_GROUP_VALUE",
								newValue: newGroupValue,
							});
							setLocation(
								mapsRoute.getHref(props.fileId, state.grouping, newGroupValue)
							);
						}}
						id="map-group"
						class={form_select}
					>
						{/* TODO: make this better handle no group values - i.e. disable it, etc. */}
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
							dispatch({
								type: "SET_MAP_ID",
								newMapId,
							});
							setLocation(
								mapsRoute.getHref(
									props.fileId,
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
			<MapTimeline
				mapData={props.mapData}
				selectedEntry={props.mapData.nodes[state.selectedMapId]}
			/>
		</Fragment>
	);
}

/**
 * @typedef MapTimelineProps
 * @property {MapData} mapData
 * @property {MapEntry} selectedEntry
 *
 * @param {MapTimelineProps} props
 */
function MapTimeline({ mapData, selectedEntry }) {
	const mapParents = getMapParents(mapData, selectedEntry);

	return (
		<div class={timeline}>
			{mapParents.reverse().map((map) => (
				<MapTimelineItem key={map.id} mapData={mapData} map={map} />
			))}
			<MapTimelineItem mapData={mapData} map={selectedEntry} selected />
		</div>
	);
}

/**
 * @param {{ mapData: MapData; map: MapEntry, selected?: boolean }} props
 */
function MapTimelineItem({ mapData, map, selected = false }) {
	const detailsId = `${map.id}-details`;
	const map_timeline_item = "";
	const selected_class = "";
	const map_icon = "";

	const [open, setOpen] = useState(selected);

	const parentEdge = map.edge ? mapData.edges[map.edge] : null;
	return (
		<div
			class={`${timeline_item} ${map_timeline_item} ${
				selected ? selected_class : ""
			}`}
		>
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
						onClick={(ev) => {
							ev.preventDefault();
							setOpen((opened) => !opened);
						}}
					>
						{selected ? (
							<strong>
								{parentEdge ? edgeToString(parentEdge) : map.address}
							</strong>
						) : parentEdge ? (
							edgeToString(parentEdge)
						) : (
							map.address
						)}
					</summary>
					<div>{formatDescription(map)}</div>
					{/* TODO: Figure out what to do with the map's position */}
					{/* <p>
						{map.filePosition.functionName} {map.filePosition.file}:
						{map.filePosition.line}:{map.filePosition.column}
					</p> */}
				</details>
			</div>
		</div>
	);
}

/**
 * @param {MapExplorerProps} props
 * @param {MapGrouping} grouping
 * @returns {GroupingValue[]}
 */
function getGroupingValues(props, grouping) {
	const { mapData, fileDeoptInfo, settings } = props;

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
		/** @type {GroupingValue[]} */
		const values = [];
		for (let mapId in mapData.nodes) {
			const map = mapData.nodes[mapId];
			if (map.filePosition) {
				values.push({
					group: "create",
					id: `${grouping}-${map.id}`,
					label: formatLocation(map.filePosition),
					mapIds: [map.id],
					filePosition: map.filePosition,
				});
			}
		}
		return values;
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
 * @returns {string}
 */
function formatDescription(map) {
	return (
		map.description
			.trim()
			.split("\n")
			.map((line) => [line, <br />])
			// @ts-ignore
			.flat()
	);
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
	// TODO: Fill out
	switch (edge?.subtype) {
		case "Transition":
			return icon_plus; // "+"
		case "Normalize": // FastToSlow
			return "⊡"; // down triangle
		case "SlowToFast":
			return "⊛"; // up triangle
		case "ReplaceDescriptors":
			return edge.name ? "+" : "∥"; // plus or two bars
		default:
			return "";
	}
}
