import { createElement, Fragment } from "preact";
import { useState, useEffect, useRef, useLayoutEffect } from "preact/hooks";
import { severityIcState } from "v8-deopt-parser/src/propertyICParsers";
import { formatMapId } from "../utils/mapUtils";
import {
	panel,
	panel_header,
	panel_nav,
	tab,
	tab_block,
	tab_item,
	active,
	panel_body,
	table,
	table_striped,
	table_hover,
} from "../spectre.scss";
import {
	deoptsListPanel,
	panel_title,
	showLowSevs as showLowSevsClass,
	tabLink,
	entryTable,
	selected as selectedClass,
	entryId as entryIdClass,
	entryLink,
	sev1,
	sev2,
	sev3,
} from "./DeoptsList.scss";

/**
 * @typedef {keyof import('v8-deopt-parser').V8DeoptInfo} EntryKind
 * @type {EntryKind}
 */
const defaultEntryKind = "codes";

/**
 * @param {{ fileDeoptInfo: import("..").FileV8DeoptInfoWithSources; selectedEntry: import("v8-deopt-parser").Entry; fileId: string;  showLowSevs: boolean; showAllICs: boolean }} props
 */
export function DeoptsList({
	selectedEntry,
	fileDeoptInfo,
	fileId,
	showLowSevs,
	showAllICs,
}) {
	const selectedEntryType = selectedEntry?.type ?? defaultEntryKind;
	const [entryKind, setEntryKind] = useState(selectedEntryType);
	const selectedId = selectedEntry?.id;

	useLayoutEffect(() => {
		if (selectedEntryType !== entryKind) {
			setEntryKind(selectedEntryType);
		}
	}, [selectedEntryType]);

	let entries;
	if (entryKind == "codes") {
		entries = fileDeoptInfo[entryKind].map((entry) => (
			<CodeEntry
				entry={entry}
				selected={entry.id == selectedId}
				title={
					<EntryTitle
						entry={entry}
						fileId={fileId}
						relativePath={fileDeoptInfo.relativePath}
					/>
				}
			/>
		));
	} else if (entryKind == "deopts") {
		entries = fileDeoptInfo[entryKind].map((entry) => (
			<DeoptEntry
				entry={entry}
				selected={entry.id == selectedId}
				title={
					<EntryTitle
						entry={entry}
						fileId={fileId}
						relativePath={fileDeoptInfo.relativePath}
					/>
				}
			/>
		));
	} else if (entryKind == "ics") {
		entries = fileDeoptInfo[entryKind].map((entry) => (
			<ICEntry
				entry={entry}
				selected={entry.id == selectedId}
				showAllICs={showAllICs}
				title={
					<EntryTitle
						entry={entry}
						fileId={fileId}
						relativePath={fileDeoptInfo.relativePath}
					/>
				}
			/>
		));
	} else {
		throw new Error(`Unknown entry kind: "${entryKind}"`);
	}

	/** @type {Array<{ title: string; entryKind: EntryKind }>} */
	const tabLinks = [
		{
			title: "Optimizations",
			entryKind: "codes",
		},
		{
			title: "Deoptimizations",
			entryKind: "deopts",
		},
		{
			title: "Inline Caches",
			entryKind: "ics",
		},
	];

	return (
		<div
			class={[
				panel,
				deoptsListPanel,
				(showLowSevs && showLowSevsClass) || null,
			].join(" ")}
		>
			<div class={panel_header}>
				<h2 class={panel_title}>{fileDeoptInfo.relativePath}</h2>
			</div>
			<nav class={panel_nav}>
				<ul class={[tab, tab_block].join(" ")}>
					{tabLinks.map((link) => {
						const liClass = [
							tab_item,
							link.entryKind == entryKind ? active : null,
						].join(" ");

						return (
							<li class={liClass}>
								<a
									class={tabLink}
									href="#"
									onClick={(e) => {
										e.preventDefault();
										setEntryKind(link.entryKind);
									}}
								>
									{link.title}
								</a>
							</li>
						);
					})}
				</ul>
			</nav>
			<div class={panel_body}>
				{entries.length == 0 ? <p>None!</p> : entries}
			</div>
		</div>
	);
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
 * @param {{ entry: import("v8-deopt-parser").Entry; relativePath: string; fileId: string; }} props
 */
function EntryTitle({ entry, relativePath, fileId }) {
	const href = `#/file/${fileId}/${entry.id}`;
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
