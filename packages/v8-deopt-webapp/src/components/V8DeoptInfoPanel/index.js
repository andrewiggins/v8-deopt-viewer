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
	panel_body
} from "../../spectre.scss";
import { v8deoptInfoPanel, panel_title, tabLink } from "./index.scss";

/**
 * @typedef {import('../FileViewer').EntryKind} EntryKind
 * @type {Array<{ title: string; entryKind: EntryKind }>}
 */
const tabLinks = [
	{
		title: "Optimizations",
		entryKind: "codes"
	},
	{
		title: "Deoptimizations",
		entryKind: "deopts"
	},
	{
		title: "Inline Caches",
		entryKind: "ics"
	},
	{
		title: "Map Explorer",
		entryKind: "maps"
	}
];

/**
 * @typedef {{ selectedEntryKind: EntryKind; title: string; onTabClick: (entryKind: EntryKind) => void; children: import('preact').JSX.Element; }} V8DeoptInfoPanelProps
 * @param {V8DeoptInfoPanelProps} props
 */
export function V8DeoptInfoPanel({
	selectedEntryKind,
	title,
	children,
	onTabClick
}) {
	return (
		<div class={[panel, v8deoptInfoPanel].join(" ")}>
			<div class={panel_header}>
				<h2 class={panel_title}>{title}</h2>
			</div>
			<nav class={panel_nav}>
				<ul class={[tab, tab_block].join(" ")}>
					{tabLinks.map(link => {
						const liClass = [
							tab_item,
							link.entryKind == selectedEntryKind ? active : null
						].join(" ");

						return (
							<li class={liClass}>
								<a
									class={tabLink}
									href="#"
									onClick={e => {
										e.preventDefault();
										onTabClick(link.entryKind);
									}}
								>
									{link.title}
								</a>
							</li>
						);
					})}
				</ul>
			</nav>
			<div class={panel_body}>{children}</div>
		</div>
	);
}
