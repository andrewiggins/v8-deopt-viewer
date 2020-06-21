import { createElement, Fragment } from "preact";
import { useReducer } from "preact/hooks";
import {
	map_selectors,
	grouping as map_grouping,
	group_value,
} from "./MapExplorer.scss";
import { form_group, form_select, form_label } from "../../spectre.scss";
import { MIN_SEVERITY } from "v8-deopt-parser/src/utils";
import { formatMapId } from "../../utils/mapUtils";

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
 * @typedef {{ id: string; label: string, mapIds: number[] }} GroupingValue
 * @typedef {{ grouping: MapGrouping; values: GroupingValue[]; selectedValue: GroupingValue; }} GroupingState
 * // Actions
 * @typedef {"SET_GROUPING" | "SET_GROUP_VALUE" } GroupingActionType
 * @typedef {{ type: "SET_GROUPING"; newGrouping: MapGrouping; newGroupValues: GroupingValue[] }} SetGroupingAction
 * @typedef {{ type: "SET_GROUP_VALUE"; newValue: string; }} SetGroupValueAction
 * @typedef {SetGroupingAction | SetGroupValueAction} GroupingAction
 * // Reducer params
 * @param {GroupingState} state
 * @param {GroupingAction} action
 * @returns {GroupingState}
 */
function mapGroupingReducer(state, action) {
	if (action.type == "SET_GROUPING") {
		return {
			grouping: action.newGrouping,
			values: action.newGroupValues,
			selectedValue: action.newGroupValues[0],
		};
	} else if (action.type == "SET_GROUP_VALUE") {
		return {
			...state,
			selectedValue: state.values.find((v) => v.id == action.newValue),
		};
	} else {
		return state;
	}
}

/**
 * @param {MapExplorerProps} props
 * @returns {GroupingState}
 */
function initGroupingState(props) {
	const grouping = "loadic";
	const values = getGroupingValues(props, grouping);
	return {
		grouping,
		values,
		selectedValue: values[0],
	};
}

/**
 * @typedef {import('v8-deopt-parser').MapData} MapData
 * @typedef {import('v8-deopt-parser').MapEntry} MapEntry
 * @typedef {import('v8-deopt-parser').MapEdge} MapEdge
 * @typedef {import("../..").FileV8DeoptInfoWithSources} FileV8DeoptInfo
 * @typedef {{ mapData: MapData; fileDeoptInfo: FileV8DeoptInfo; selectedMap: MapEntry; settings: import('../CodeSettings').CodeSettingsState; urlBase: string; }} MapExplorerProps
 * @param {MapExplorerProps} props
 */
export function MapExplorer(props) {
	const [state, dispatch] = useReducer(
		mapGroupingReducer,
		props,
		initGroupingState
	);

	return (
		<Fragment>
			<div class={map_selectors}>
				<div class={[form_group, map_grouping].join(" ")}>
					<label for="map-grouping" class={form_label}>
						Map grouping:
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
						value={state.selectedValue?.id ?? ""}
						onChange={(e) => {
							dispatch({
								type: "SET_GROUP_VALUE",
								newValue: e.currentTarget.value,
							});
						}}
						id="map-group"
						class={form_select}
					>
						{/* TODO: make this better - i.e. disable it, etc. */}
						{state.values.length == 0 ? (
							<option>No values available</option>
						) : (
							state.values.map((value) => (
								<option value={value.id}>{value.label}</option>
							))
						)}
					</select>
				</div>
			</div>
			<p>
				<a href={props.urlBase + "/maps"}>Link to Maps</a>
				{state.selectedValue && (
					<ul>
						{state.selectedValue.mapIds.map((mapId) => (
							<li key={mapId}>{mapId}</li>
						))}
					</ul>
				)}
			</p>
		</Fragment>
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
		return Object.keys(mapData.nodes).map((mapKey) => {
			const mapId = parseInt(mapKey);
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
