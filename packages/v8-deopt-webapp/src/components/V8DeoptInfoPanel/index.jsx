import { useRoute } from "wouter-preact";
import { codeRoute, deoptsRoute, icsRoute, mapsRoute } from "../../routes.js";
import {
	panel,
	panel_header,
	panel_nav,
	tab,
	tab_block,
	tab_item,
	active,
	panel_body,
} from "../../spectre.module.scss";
import { v8deoptInfoPanel, panel_title, tabLink } from "./index.module.scss";

const routes = [codeRoute, deoptsRoute, icsRoute, mapsRoute];

/**
 * @typedef {{ title: string; fileId: number; children: import('preact').JSX.Element; }} V8DeoptInfoPanelProps
 * @param {V8DeoptInfoPanelProps} props
 */
export function V8DeoptInfoPanel({ title, fileId, children }) {
	return (
		<div class={[panel, v8deoptInfoPanel].join(" ")}>
			<div class={panel_header}>
				<h2 class={panel_title}>{title}</h2>
			</div>
			<nav class={panel_nav}>
				<ul class={[tab, tab_block].join(" ")}>
					{routes.map((route) => (
						<TabLink fileId={fileId} route={route} />
					))}
				</ul>
			</nav>
			<div class={panel_body}>{children}</div>
		</div>
	);
}

/**
 * @param {{ fileId: number; route: import('../..').Route; }} props
 */
function TabLink({ fileId, route }) {
	const href = route.getHref(fileId);
	const [isActive] = useRoute(route.route);
	const liClass = [tab_item, isActive ? active : null].join(" ");

	return (
		<li class={liClass}>
			<a class={tabLink} href={href}>
				{route.title}
			</a>
		</li>
	);
}
