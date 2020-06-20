import { createElement, Fragment } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { severityIcState } from "v8-deopt-parser/src/propertyICParsers";
import { formatMapId } from "../../utils/mapUtils";
import { table, table_striped, table_hover } from "../../spectre.scss";
import {
	entryTable,
	selected as selectedClass,
	entryId as entryIdClass,
	entryLink,
	sev1,
	sev2,
	sev3,
} from "./DeoptTables.scss";

/**
 * @typedef {import("../..").FileV8DeoptInfoWithSources} FileV8DeoptInfo
 * @typedef {{ fileDeoptInfo: FileV8DeoptInfo; entryKind: import('../FileViewer').EntryKind; selectedEntry: import("v8-deopt-parser").Entry; urlBase: string; showAllICs: boolean; }} DeoptTablesProps
 * @param {DeoptTablesProps} props
 */
export function DeoptTables({
	entryKind,
	selectedEntry,
	fileDeoptInfo,
	urlBase,
	showAllICs,
}) {
	const selectedId = selectedEntry?.id;

	let entries;
	if (entryKind == "codes") {
		entries = fileDeoptInfo[entryKind].map((entry) => (
			<CodeEntry
				key={entry.id}
				entry={entry}
				selected={entry.id == selectedId}
				title={
					<EntryTitle
						entry={entry}
						urlBase={urlBase + "/codes"}
						relativePath={fileDeoptInfo.relativePath}
					/>
				}
			/>
		));
	} else if (entryKind == "deopts") {
		entries = fileDeoptInfo[entryKind].map((entry) => (
			<DeoptEntry
				key={entry.id}
				entry={entry}
				selected={entry.id == selectedId}
				title={
					<EntryTitle
						entry={entry}
						urlBase={urlBase + "/deopts"}
						relativePath={fileDeoptInfo.relativePath}
					/>
				}
			/>
		));
	} else if (entryKind == "ics") {
		entries = fileDeoptInfo[entryKind].map((entry) => (
			<ICEntry
				key={entry.id}
				entry={entry}
				selected={entry.id == selectedId}
				showAllICs={showAllICs}
				title={
					<EntryTitle
						entry={entry}
						urlBase={urlBase + "/ics"}
						relativePath={fileDeoptInfo.relativePath}
					/>
				}
			/>
		));
	} else {
		throw new Error(`Unknown entry kind: "${entryKind}"`);
	}

	return <Fragment>{entries.length == 0 ? <p>None!</p> : entries}</Fragment>;
}

/**
 * @param {{ entry: import("v8-deopt-parser").CodeEntry; selected: boolean; title: any }} props
 */
function CodeEntry({ entry, selected, title }) {
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
 * @param {{ entry: import("v8-deopt-parser").ICEntry; selected: boolean; title: any; showAllICs: boolean; }} props
 */
function ICEntry({ entry, selected, title, showAllICs }) {
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

						return (
							<tr key={i}>
								<td class={severityClass(severityIcState(update.oldState))}>
									{update.oldState}
								</td>
								<td class={severityClass(severityIcState(update.newState))}>
									{update.newState}
								</td>
								<td>{update.key}</td>
								<td>{formatMapId(update.map)}</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

/**
 * @param {{ entry: import("v8-deopt-parser").Entry; relativePath: string; urlBase: string; }} props
 */
function EntryTitle({ entry, relativePath, urlBase }) {
	const href = `${urlBase}/${entry.id}`;
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
			ref.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [selected]);

	return selected ? ref : null;
}

function microToMilli(micro) {
	return (micro / 1000).toFixed(0) + "ms";
}
