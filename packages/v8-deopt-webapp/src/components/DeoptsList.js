import { createElement, Fragment } from "preact";
import { useState } from "preact/hooks";
import { severityIcState } from "v8-deopt-parser";
import spectre from "../spectre.scss";
import styles from "./DeoptsList.scss";

/**
 * @typedef {keyof import('v8-deopt-parser').V8DeoptInfo} EntryKind
 * @type {EntryKind}
 */
const defaultEntryKind = "deopts";

/**
 * @param {import("./FileViewer").FileViewerProps} props
 */
export function DeoptsList({ routeParams, fileDeoptInfo }) {
	const [entryKind, setEntryKind] = useState(defaultEntryKind);

	let entries;
	if (entryKind == "codes") {
		entries = fileDeoptInfo[entryKind].map((entry) => (
			<CodeEntry
				entry={entry}
				selected={entry.id == routeParams.entryId}
				title={
					<EntryTitle
						entry={entry}
						fileId={routeParams.fileId}
						relativePath={fileDeoptInfo.relativePath}
					/>
				}
			/>
		));
	} else if (entryKind == "deopts") {
		entries = fileDeoptInfo[entryKind].map((entry) => (
			<DeoptEntry
				entry={entry}
				selected={entry.id == routeParams.entryId}
				title={
					<EntryTitle
						entry={entry}
						fileId={routeParams.fileId}
						relativePath={fileDeoptInfo.relativePath}
					/>
				}
			/>
		));
	} else if (entryKind == "ics") {
		entries = fileDeoptInfo[entryKind].map((entry) => (
			<ICEntry
				entry={entry}
				selected={entry.id == routeParams.entryId}
				title={
					<EntryTitle
						entry={entry}
						fileId={routeParams.fileId}
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
		<div class={[spectre.panel, styles.deoptsListPanel].join(" ")}>
			<nav class={spectre["panel-nav"]}>
				<ul class={[spectre["tab"], spectre["tab-block"]].join(" ")}>
					{tabLinks.map((link) => {
						const liClass = [
							spectre["tab-item"],
							link.entryKind == entryKind ? spectre.active : null,
						].join(" ");

						return (
							<li class={liClass}>
								<a
									class={styles.tabLink}
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
			<div class={spectre["panel-body"]}>{entries}</div>
		</div>
	);
}

/**
 * @param {{ entry: import("v8-deopt-parser").CodeEntry; selected: boolean; title: any }} props
 */
function CodeEntry({ entry, selected, title }) {
	return (
		<div
			class={[styles.entryTable, selected ? styles.selected : null].join(" ")}
		>
			<table
				class={[
					spectre.table,
					spectre["table-striped"],
					spectre["table-hover"],
				].join(" ")}
			>
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
							<td>{update.timestamp}</td>
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
	return (
		<div
			class={[styles.entryTable, selected ? styles.selected : null].join(" ")}
		>
			<table
				class={[
					spectre.table,
					spectre["table-striped"],
					spectre["table-hover"],
				].join(" ")}
			>
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
							<td>{update.timestamp}</td>
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
 * @param {{ entry: import("v8-deopt-parser").ICEntry; selected: boolean; title: any; }} props
 */
function ICEntry({ entry, selected, title }) {
	return (
		<div
			class={[styles.entryTable, selected ? styles.selected : null].join(" ")}
		>
			<table
				class={[
					spectre.table,
					spectre["table-striped"],
					spectre["table-hover"],
				].join(" ")}
			>
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
					{entry.updates.map((update) => (
						<tr>
							<td class={severityClass(severityIcState(update.oldState))}>
								{update.oldState}
							</td>
							<td class={severityClass(severityIcState(update.newState))}>
								{update.newState}
							</td>
							<td>{update.key}</td>
							<td>{update.map}</td>
						</tr>
					))}
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
			<span class={styles.entryId}>{entry.id} </span>
			<a href={href} class={styles.entryLink}>
				{linkText}
			</a>
		</Fragment>
	);
}

function severityClass(severity) {
	if (severity == 1) {
		return styles.sev1;
	} else if (severity == 2) {
		return styles.sev2;
	} else {
		return styles.sev3;
	}
}
