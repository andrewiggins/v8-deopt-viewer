import { createElement, Fragment } from "preact";
import { useReducer } from "preact/hooks";
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
 * // State
 * @typedef {{ id: string; label: string, mapIds: string[] }} GroupingValue
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
	const grouping = "loadic";
	const values = getGroupingValues(props, grouping);
	return {
		grouping,
		groupValues: values,
		selectedGroup: values[0],
		selectedMapId: values[0].mapIds[0],
	};
}

/**
 * @typedef {import('v8-deopt-parser').MapData} MapData
 * @typedef {import('v8-deopt-parser').MapEntry} MapEntry
 * @typedef {import('v8-deopt-parser').MapEdge} MapEdge
 * @typedef {import("../..").FileV8DeoptInfoWithSources} FileV8DeoptInfo
 *
 * @typedef MapExplorerProps
 * @property {MapData} mapData
 * @property {FileV8DeoptInfo} fileDeoptInfo
 * @property {MapEntry["id"]} initialMapId
 * @property {import('../CodeSettings').CodeSettingsState} settings;
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
	//  - setup routing
	// 	- setup links
	//  - Fix timeline icon links
	//  - How to make timeline item titles look clickable?
	// 	- Setup button/link in timeline to show creation location of a map in src
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

	// TODO: Make ICEntry maps linkable to the Map Explorer, that loads the loadic
	// grouping for that location when the clicked map id selected

	// TODO: Given all the above scenarios, what is the map explorer URL? Probably
	// need to add some routing URL helper functions to generate URLs.

	// TODO: Should selecting a creation or loadic location go to that location on
	// the code panel? Probably not but perhaps each map transition associated
	// with a source location should have a link to "show location" or "go to
	// location". Need to handle cross file links since maps aren't file specific.
	//
	// Would be important to keep existing Map Explorer view/selection. Would not
	// want to rebuild the DOM and lose focus. Would be nice to use normal links
	// and routing for cross-file changes but it might be hard to keep focus on
	// the existing element...

	// TODO: ^^Related to the above, probably need to find a way to highlight
	// markers not based on the fragment since multiple links (ICEntry and
	// loadic-map entry) want to highlight the same marker.

	// TODO: Render map trees. Selecting a map should display its formatted
	// description. Perhaps as a baby step, turn the existing map ID list into an
	// accordion that shows the map description when selected and updates the URL.
	// Consider using Spectre's
	// [Timeline](https://picturepan2.github.io/spectre/experimentals/timelines.html)
	// component to display Map transitions, but it can't show the map graph when
	// maps share the same parent...

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

	const mapIds = state.selectedGroup.mapIds;

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
				<div key={state.grouping} class={[form_group, group_value].join(" ")}>
					<label for="map-group" class={form_label}>
						{mapGroupings[state.grouping].valueLabel}:
					</label>
					<select
						value={state.selectedGroup?.id ?? ""}
						onChange={(e) => {
							dispatch({
								type: "SET_GROUP_VALUE",
								newValue: e.currentTarget.value,
							});
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
							dispatch({
								type: "SET_MAP_ID",
								newMapId: e.currentTarget.value,
							});
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
			<p>
				<a href={mapsRoute.getHref(props.fileId)}>Link to Maps</a>
				<MapTimeline
					mapData={props.mapData}
					selectedEntry={props.mapData.nodes[state.selectedMapId]}
				/>
			</p>
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
	const map_timeline_item = "";
	const selected_class = "";
	const map_icon = "";

	const parentEdge = map.edge ? mapData.edges[map.edge] : null;
	return (
		<div
			class={`${timeline_item} ${map_timeline_item} ${
				selected ? selected_class : ""
			}`}
			id="timeline-example-1"
		>
			<div class={timeline_left}>
				<a
					class={`${timeline_icon} ${selected ? icon_lg : ""} ${map_icon}`}
					href="#timeline-example-1"
				>
					{selected ? <i class={`${icon} ${getEdgeIcon(parentEdge)}`}></i> : ""}
				</a>
			</div>
			<div class={timeline_content}>
				<details class={map_details} open={selected}>
					<summary>
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
					id: `${grouping}-${icEntry.id}`,
					label: formatLocation(icEntry),
					mapIds: icEntry.updates.map((update) => update.map),
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
						id: `${grouping}-${propName}`,
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
					id: `${grouping}-${map.id}`,
					label: formatLocation(map.filePosition),
					mapIds: [map.id],
				});
			}
		}
		return values;
	} else if (grouping == "mapid") {
		return Object.keys(mapData.nodes).map((mapId) => {
			return {
				id: `${grouping}-${mapId}`,
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
	return `${entry.functionName}:${entry.line}:${entry.column}`;
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
