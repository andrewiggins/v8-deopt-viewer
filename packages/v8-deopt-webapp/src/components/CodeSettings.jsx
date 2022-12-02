import { useReducer } from "preact/hooks";
import {
	menu,
	menu_item,
	form_icon,
	form_switch,
} from "../spectre.module.scss";
import {
	codeSettings,
	dirty as dirtyClass,
	settingsBody,
	settingsMenu,
} from "./CodeSettings.module.scss";

/**
 * @typedef CodeSettingsState
 * @property {boolean} showLowSevs
 * @property {boolean} hideLineNums
 * @property {boolean} showAllICs
 */

/**
 * @type {CodeSettingsState}
 */
const initialState = {
	// TODO: Consider replacing showLowSevs with a toggle
	// to show each severity (e.g. to filter out optimizable)
	showLowSevs: false,
	hideLineNums: false,
	showAllICs: false,
};

/**
 * @returns {[CodeSettingsState, (setting: keyof CodeSettingsState) => void]}
 */
export function useCodeSettingsState() {
	return useReducer((state, settingToToggle) => {
		return {
			...state,
			[settingToToggle]: !state[settingToToggle],
		};
	}, initialState);
}

/**
 * @typedef {{ class?: string; state: CodeSettingsState; toggle: (setting: keyof CodeSettingsState) => void; }} CodeSettingsProps
 * @param {CodeSettingsProps} props
 */
export function CodeSettings({ class: className, state, toggle }) {
	const dirty =
		state.showLowSevs !== initialState.showLowSevs ||
		state.hideLineNums !== initialState.hideLineNums ||
		state.showAllICs !== initialState.showAllICs;

	const settings = [
		{
			key: "showLowSevs",
			label: "Display Low Severities",
			checked: state.showLowSevs,
			onInput: () => toggle("showLowSevs"),
		},
		{
			key: "hideLineNums",
			label: "Hide Line Numbers",
			checked: state.hideLineNums,
			onInput: () => toggle("hideLineNums"),
		},
		{
			key: "showAllICs",
			label: "Show All Inline Cache Entries",
			checked: state.showAllICs,
			onInput: () => toggle("showAllICs"),
		},
	];

	const rootClass = [
		codeSettings,
		className,
		(dirty && dirtyClass) || null,
	].join(" ");

	// TODO: Consider replacing <details> with a custom alternative that closes on
	// Esc and clicking outside of it
	return (
		<details class={rootClass}>
			<summary aria-label="Settings">
				<SettingsCog />
			</summary>
			<div class={settingsBody}>
				<ul class={[menu, settingsMenu].join(" ")}>
					{settings.map((setting) => (
						<li key={setting.key} class={menu_item}>
							<label class={form_switch}>
								<input
									type="checkbox"
									checked={setting.checked}
									onInput={setting.onInput}
								/>
								<i class={form_icon}></i> {setting.label}
							</label>
						</li>
					))}
				</ul>
			</div>
		</details>
	);
}

function SettingsCog(props) {
	return (
		<svg
			class={props.class}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 32 32"
		>
			<path d="M13.188 3l-.157.813-.594 2.968a9.939 9.939 0 0 0-2.593 1.532l-2.906-1-.782-.25-.406.718-2 3.438-.406.719.594.53 2.25 1.97C6.104 14.948 6 15.46 6 16c0 .54.105 1.05.188 1.563l-2.25 1.968-.594.532.406.718 2 3.438.406.718.782-.25 2.906-1a9.939 9.939 0 0 0 2.594 1.532l.593 2.968.156.813h5.626l.156-.813.593-2.968a9.939 9.939 0 0 0 2.594-1.532l2.907 1 .78.25.407-.718 2-3.438.406-.718-.593-.532-2.25-1.968C25.895 17.05 26 16.538 26 16c0-.54-.105-1.05-.188-1.563l2.25-1.968.594-.531-.406-.72-2-3.437-.406-.718-.782.25-2.906 1a9.939 9.939 0 0 0-2.593-1.532l-.594-2.968L18.812 3zm1.624 2h2.376l.5 2.594.125.593.562.188a8.017 8.017 0 0 1 3.031 1.75l.438.406.562-.187 2.532-.875 1.187 2.031-2 1.781-.469.375.157.594c.128.57.187 1.152.187 1.75 0 .598-.059 1.18-.188 1.75l-.125.594.438.375 2 1.781-1.188 2.031-2.53-.875-.563-.187-.438.406a8.017 8.017 0 0 1-3.031 1.75l-.563.188-.125.593-.5 2.594h-2.375l-.5-2.594-.124-.593-.563-.188a8.017 8.017 0 0 1-3.031-1.75l-.438-.406-.562.187-2.531.875L5.875 20.5l2-1.781.469-.375-.156-.594A7.901 7.901 0 0 1 8 16c0-.598.059-1.18.188-1.75l.156-.594-.469-.375-2-1.781 1.188-2.031 2.53.875.563.187.438-.406a8.017 8.017 0 0 1 3.031-1.75l.563-.188.124-.593zM16 11c-2.75 0-5 2.25-5 5s2.25 5 5 5 5-2.25 5-5-2.25-5-5-5zm0 2c1.668 0 3 1.332 3 3s-1.332 3-3 3-3-1.332-3-3 1.332-3 3-3z" />
		</svg>
	);
}
