import { createElement, Fragment } from "preact";
import { map_selectors, grouping, group_value } from "./MapExplorer.scss";
import { form_group, form_select } from "../../spectre.scss";

/**
 * @param {{ urlBase: string }} props
 */
export function MapExplorer({ urlBase }) {
	return (
		<Fragment>
			<div class={map_selectors}>
				<div class={[form_group, grouping].join(" ")}>
					<select class={form_select}>
						<option>Choose an option</option>
						<option>Slack</option>
						<option>Skype</option>
						<option>Hipchat</option>
					</select>
				</div>
				<div class={[form_group, group_value].join(" ")}>
					<select class={form_select}>
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
