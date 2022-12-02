import { Fragment } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { severityIcState } from "v8-deopt-parser/src/propertyICParsers.js";
import { MIN_SEVERITY } from "v8-deopt-parser/src/utils.js";
import { formatMapId } from "../../utils/mapUtils.js";
import { codeRoute, deoptsRoute, icsRoute, mapsRoute } from "../../routes.js";
import {
	btn,
	btn_inline,
	table,
	table_striped,
	table_hover,
} from "../../spectre.module.scss";
import {
	entryTable,
	selected as selectedClass,
	entryId as entryIdClass,
	entryLink,
	sev1,
	sev2,
	sev3,
} from "./DeoptTables.module.scss";
import { useHighlightEntry } from "../CodePanel.jsx";

/**
 * @typedef {import("../..").FileV8DeoptInfoWithSources} FileV8DeoptInfo
 *
 * @typedef DeoptTablesProps
 * @property {FileV8DeoptInfo} fileDeoptInfo
 * @property {"codes" | "deopts" | "ics"} entryKind
 * @property {string} selectedEntryId
 * @property {number} fileId
 * @property {import('../CodeSettings').CodeSettingsState} settings
 * @property {() => void} toggleShowLowSevs
 * @property {boolean} hasMapData
 *
 * @param {DeoptTablesProps} props
 */
export function DeoptTables({
	entryKind,
	selectedEntryId,
	fileDeoptInfo,
	fileId,
	settings,
	toggleShowLowSevs,
	hasMapData,
}) {
	const selectedId = selectedEntryId;

	let totalCount = 0;
	let lowSevCount = 0;
	let hiddenCount = 0;

	/**
	 * @param {import('v8-deopt-parser').Entry} entry
	 */
	function filterEntries(entry) {
		totalCount++;

		if (entry.severity <= MIN_SEVERITY) {
			lowSevCount++;
		}

		if (settings.showLowSevs) {
			return true;
		} else if (entry.severity > MIN_SEVERITY) {
			return true;
		} else {
			hiddenCount++;
			return false;
		}
	}

	let entries;
	if (entryKind == "codes") {
		entries = fileDeoptInfo[entryKind]
			.filter(filterEntries)
			.map((entry) => (
				<CodeEntry
					key={entry.id}
					entry={entry}
					selected={entry.id == selectedId}
					title={
						<EntryTitle
							entry={entry}
							route={codeRoute}
							relativePath={fileDeoptInfo.relativePath}
							fileId={fileId}
						/>
					}
				/>
			));
	} else if (entryKind == "deopts") {
		entries = fileDeoptInfo[entryKind]
			.filter(filterEntries)
			.map((entry) => (
				<DeoptEntry
					key={entry.id}
					entry={entry}
					selected={entry.id == selectedId}
					title={
						<EntryTitle
							entry={entry}
							route={deoptsRoute}
							relativePath={fileDeoptInfo.relativePath}
							fileId={fileId}
						/>
					}
				/>
			));
	} else if (entryKind == "ics") {
		entries = fileDeoptInfo[entryKind]
			.filter(filterEntries)
			.map((entry) => (
				<ICEntry
					key={entry.id}
					entry={entry}
					selected={entry.id == selectedId}
					showAllICs={settings.showAllICs}
					hasMapData={hasMapData}
					fileId={fileId}
					title={
						<EntryTitle
							entry={entry}
							route={icsRoute}
							relativePath={fileDeoptInfo.relativePath}
							fileId={fileId}
						/>
					}
				/>
			));
	} else {
		throw new Error(`Unknown entry kind: "${entryKind}"`);
	}

	let toggleElements = null;
	if (totalCount > 0) {
		let text = `Hiding ${hiddenCount} entries. Show all`;
		if (hiddenCount == 0 && lowSevCount > MIN_SEVERITY) {
			text = `Hide ${lowSevCount} low severity entries.`;
		}

		toggleElements = (
			<p>
				<button
					type="button"
					class={`${btn} ${btn_inline}`}
					onClick={toggleShowLowSevs}
				>
					{text}
				</button>
			</p>
		);
	}

	return (
		<Fragment>
			{entries.length == 0 ? <p>None!</p> : entries}
			{toggleElements}
		</Fragment>
	);
}

/**
 * @param {{ entry: import("v8-deopt-parser").CodeEntry; selected: boolean; title: any }} props
 */
function CodeEntry({ entry, selected, title }) {
	useHighlightEntry(entry, selected);
	const ref = useScrollIntoView(selected);

	return (
		<div
			ref={ref}
			class={[
				entryTable,
				severityClass(entry.severity),
				selected ? selectedClass : null,
			].join(" ")}
		>
			<table class={[table, table_striped, table_hover].join(" ")}>
				<caption>{title}</caption>
				<thead>
					<tr>
						<th>Timestamp</th>
						<th>Optimization State</th>
					</tr>
				</thead>
				<tbody>
					{entry.updates.map((update, i) => (
						<tr>
							<td>{microToMilli(update.timestamp)}</td>
							<td class={severityClass(update.severity)}>{update.state}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

/**
 * @param {{ entry: import("v8-deopt-parser").DeoptEntry; selected: boolean; title: any }} props
 */
function DeoptEntry({ entry, selected, title }) {
	useHighlightEntry(entry, selected);
	const ref = useScrollIntoView(selected);

	return (
		<div
			ref={ref}
			class={[
				entryTable,
				severityClass(entry.severity),
				selected ? selectedClass : null,
			].join(" ")}
		>
			<table class={[table, table_striped, table_hover].join(" ")}>
				<caption>{title}</caption>
				<thead>
					<tr>
						<th>Timestamp</th>
						<th>Bailout</th>
						<th>Reason</th>
						<th>Inlined</th>
					</tr>
				</thead>
				<tbody>
					{entry.updates.map((update) => (
						<tr>
							<td>{microToMilli(update.timestamp)}</td>
							<td class={severityClass(update.severity)}>
								{update.bailoutType}
							</td>
							<td>{update.deoptReason}</td>
							<td>{update.inlined ? "yes" : "no"}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

/**
 * @typedef ICEntryProps
 * @property {import("v8-deopt-parser").ICEntry} entry
 * @property {boolean} selected
 * @property {any} title
 * @property {boolean} showAllICs
 * @property {boolean} hasMapData
 * @property {number} fileId
 * @param {ICEntryProps} props
 */
function ICEntry({ entry, selected, title, showAllICs, hasMapData, fileId }) {
	useHighlightEntry(entry, selected);
	const ref = useScrollIntoView(selected);

	return (
		<div
			ref={ref}
			class={[
				entryTable,
				severityClass(entry.severity),
				selected ? selectedClass : null,
			].join(" ")}
		>
			<table class={[table, table_striped, table_hover].join(" ")}>
				<caption>{title}</caption>
				<thead>
					<tr>
						<th>Old State</th>
						<th>New State</th>
						<th>Key</th>
						<th>Map</th>
					</tr>
				</thead>
				<tbody>
					{entry.updates.map((update, i) => {
						if (!showAllICs && update.newState === update.oldState) {
							return null;
						}

						let mapHref;
						if (hasMapData) {
							mapHref = mapsRoute.getHref(
								fileId,
								"loadic",
								entry.id,
								update.map
							);
						}

						return (
							<tr key={i}>
								<td class={severityClass(severityIcState(update.oldState))}>
									{update.oldState}
								</td>
								<td class={severityClass(severityIcState(update.newState))}>
									{update.newState}
								</td>
								<td>{update.key}</td>
								<td>
									{hasMapData ? (
										<a href={mapHref}>{formatMapId(update.map)}</a>
									) : (
										formatMapId(update.map)
									)}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

/**
 * @typedef EntryTitleProps
 * @property {import('v8-deopt-parser').Entry} entry
 * @property {string} relativePath
 * @property {import('../..').Route<[number, string]>} route
 * @property {number} fileId
 * @param {EntryTitleProps} props
 */
function EntryTitle({ entry, relativePath, route, fileId }) {
	const href = route.getHref(fileId, entry.id);
	const linkText = `${entry.functionName} at ${relativePath}:${entry.line}:${entry.column}`;

	return (
		<Fragment>
			<span class={entryIdClass}>{entry.id} </span>
			<a href={href} class={entryLink}>
				{linkText}
			</a>
		</Fragment>
	);
}

function severityClass(severity) {
	if (severity < 1) {
		return null;
	} else if (severity == 1) {
		return sev1;
	} else if (severity == 2) {
		return sev2;
	} else {
		return sev3;
	}
}

/**
 * @param {boolean} selected
 * @returns {import("preact").RefObject<HTMLDivElement>}
 */
function useScrollIntoView(selected) {
	/** @type {import("preact").RefObject<HTMLDivElement>} */
	const ref = useRef(null);
	useEffect(() => {
		if (selected) {
			// TODO: Why doesn't the smooth behavior always work? It seems that only
			// the first or last call to scrollIntoView with behavior smooth works?
			ref.current.scrollIntoView({ block: "center" });
		}
	}, [selected]);

	return selected ? ref : null;
}

function microToMilli(micro) {
	return (micro / 1000).toFixed(0) + "ms";
}
