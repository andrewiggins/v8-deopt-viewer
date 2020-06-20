import { createElement } from "preact";
import { useState, useLayoutEffect } from "preact/hooks";
import {
	panel,
	panel_header,
	panel_nav,
	tab,
	tab_block,
	tab_item,
	active,
	panel_body,
} from "../../spectre.scss";
import { v8deoptInfoPanel, panel_title, tabLink } from "./index.scss";
import { showLowSevs as showLowSevsClass } from "./DeoptTables.scss";
import { DeoptTables } from "./DeoptTables";

/**
 * @typedef {keyof import('v8-deopt-parser').V8DeoptInfo} EntryKind
 * @type {EntryKind}
 */
const defaultEntryKind = "codes";

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

/**
 * @typedef {{ fileDeoptInfo: import("../..").FileV8DeoptInfoWithSources; selectedEntry: import("v8-deopt-parser").Entry; fileId: string; showLowSevs: boolean; showAllICs: boolean }} V8DeoptInfoPanelProps
 * @param {V8DeoptInfoPanelProps} props
 */
export function V8DeoptInfoPanel({
	selectedEntry,
	fileDeoptInfo,
	fileId,
	showLowSevs,
	showAllICs,
}) {
	const urlBase = `#/file/${fileId}`;
	const selectedEntryType = selectedEntry?.type ?? defaultEntryKind;
	const [entryKind, setEntryKind] = useState(selectedEntryType);

	useLayoutEffect(() => {
		if (selectedEntryType !== entryKind) {
			setEntryKind(selectedEntryType);
		}
	}, [selectedEntryType]);

	return (
		<div
			class={[
				panel,
				v8deoptInfoPanel,
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
				<DeoptTables
					fileDeoptInfo={fileDeoptInfo}
					entryKind={entryKind}
					selectedEntry={selectedEntry}
					showAllICs={showAllICs}
					urlBase={urlBase}
				/>
			</div>
		</div>
	);
}