import { createElement, Fragment } from "preact";
import { useState } from "preact/hooks";
import {
	map_selectors,
	grouping as map_grouping,
	group_value,
} from "./MapExplorer.scss";
import { form_group, form_select, form_label } from "../../spectre.scss";

/**
 * @typedef {"create" | "loadic" | "property" | "mapid"} MapGrouping
 * @type {Record<MapGrouping, { label: string; valueLabel: string; value: MapGrouping }>}
 */
const mapGroupings = {
	create: {
		label: "Creation location",
		valueLabel: "Location",
		value: "create",
	},
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
	mapid: {
		label: "Map ID",
		valueLabel: "ID",
		value: "mapid",
	},
};

/**
 * @param {{ urlBase: string }} props
 */
export function MapExplorer({ urlBase }) {
	/** @type {[MapGrouping, import('preact/hooks').StateUpdater<MapGrouping>]} */
	const [grouping, setGrouping] = useState("create");

	return (
		<Fragment>
			<div class={map_selectors}>
				<div class={[form_group, map_grouping].join(" ")}>
					<label for="map-grouping" class={form_label}>
						Map grouping:
					</label>
					<select
						value={grouping}
						onChange={(e) => setGrouping(e.currentTarget.value)}
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
						{mapGroupings[grouping].valueLabel}:
					</label>
					<select id="map-group" class={form_select}>
						<option>Choose an option</option>
						<option>Slack</option>
						<option>Skype</option>
						<option>Hipchat</option>
					</select>
				</div>
			</div>
			<p>
				<a href={urlBase + "/maps"}>Link to Maps</a>
			</p>
		</Fragment>
	);
}
