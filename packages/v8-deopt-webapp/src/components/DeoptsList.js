import { createElement, Fragment } from "preact";
import spectre from "../spectre.scss";
import styles from "./DeoptsList.scss";

/**
 * @param {import("./FileViewer").FileViewerProps} props
 */
export function DeoptsList({ routeParams, fileDeoptInfo }) {
	return (
		<div class={[spectre.panel, styles.deoptsListPanel].join(" ")}>
			<nav class={spectre["panel-nav"]}>
				<ul class={[spectre["tab"], spectre["tab-block"]].join(" ")}>
					<li class={spectre["tab-item"]}>
						<a class={styles.tabLink}>Optimizations</a>
					</li>
					<li class={[spectre["tab-item"], spectre.active].join(" ")}>
						<a class={styles.tabLink}>Deoptimizations</a>
					</li>
					<li class={spectre["tab-item"]}>
						<a class={styles.tabLink}>Inline Caches</a>
					</li>
				</ul>
			</nav>
			<div class={spectre["panel-body"]}>
				{fileDeoptInfo.deopts.map((entry) => (
					<DeoptEntry
						entry={entry}
						selected={entry.id == routeParams.entryId}
						relativePath={fileDeoptInfo.relativePath}
						fileId={routeParams.fileId}
					/>
				))}
			</div>
		</div>
	);
}

/**
 * @param {{ entry: import("v8-deopt-parser").DeoptEntry; selected: boolean; relativePath: string; fileId: string; }} props
 */
function DeoptEntry({ entry, selected, relativePath, fileId }) {
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
				<caption>
					<EntryTitle
						entry={entry}
						relativePath={relativePath}
						fileId={fileId}
					/>
				</caption>
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
							<td>{update.bailoutType}</td>
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
