import { createElement } from "preact";
import { useState } from "preact/hooks";
import { findEntry } from "v8-deopt-parser/src/findEntry";
import { V8DeoptInfoPanel } from "./V8DeoptInfoPanel";
import { CodePanel } from "./CodePanel";
import { CodeSettings, useCodeSettingsState } from "./CodeSettings";
import {
	fileViewer,
	codeSettings as codeSettingsClass
} from "./FileViewer.scss";

/**
 * @typedef {keyof import('v8-deopt-parser').V8DeoptInfo} EntryKind
 * @typedef {{ fileId: number; entryKind: EntryKind; entryId: string; }} RouteParams
 * @typedef {{ routeParams: RouteParams, deoptInfo: import('..').PerFileDeoptInfoWithSources }} FileViewerProps
 * @param {FileViewerProps} props
 */
export function FileViewer({ deoptInfo, routeParams }) {
	// TODO: How to pass map data into MapExplorer

	const files = Object.keys(deoptInfo.files);
	const fileDeoptInfo = deoptInfo.files[files[routeParams.fileId]];

	const selectedEntry = findEntry(fileDeoptInfo, routeParams.entryId);
	const urlBase = `#/file/${routeParams.fileId}`;

	const [codeSettings, toggleSetting] = useCodeSettingsState();

	return (
		<div class={fileViewer}>
			<CodeSettings
				class={codeSettingsClass}
				state={codeSettings}
				toggle={toggleSetting}
			/>
			<CodePanel
				fileDeoptInfo={fileDeoptInfo}
				selectedEntry={selectedEntry}
				urlBase={urlBase}
				hideLineNums={codeSettings.hideLineNums}
				showLowSevs={codeSettings.showLowSevs}
			/>
			<V8DeoptInfoPanel
				fileDeoptInfo={fileDeoptInfo}
				routeParams={routeParams}
				selectedEntry={selectedEntry}
				urlBase={urlBase}
				showLowSevs={codeSettings.showLowSevs}
				showAllICs={codeSettings.showAllICs}
			/>
		</div>
	);
}
