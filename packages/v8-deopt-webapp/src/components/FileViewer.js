import { createElement } from "preact";
import { useState, useLayoutEffect } from "preact/hooks";
import { findEntry } from "v8-deopt-parser/src/findEntry";
import { V8DeoptInfoPanel } from "./V8DeoptInfoPanel";
import { CodePanel } from "./CodePanel";
import { CodeSettings, useCodeSettingsState } from "./CodeSettings";
import {
	fileViewer,
	codeSettings as codeSettingsClass
} from "./FileViewer.scss";
import { MapExplorer } from "./V8DeoptInfoPanel/MapExplorer";
import { DeoptTables } from "./V8DeoptInfoPanel/DeoptTables";

/**
 * @typedef {keyof import('v8-deopt-parser').V8DeoptInfo} EntryKind
 * @typedef {{ fileId: number; entryType: EntryKind; entryId: string; }} RouteParams
 * @typedef {{ routeParams: RouteParams; deoptInfo: import('..').PerFileDeoptInfoWithSources; files: string[]'' }} FileViewerProps
 * @param {FileViewerProps} props
 */
export function FileViewer({ files, deoptInfo, routeParams }) {
	// TODO: How to pass map data into MapExplorer

	const urlBase = `#/file/${routeParams.fileId}`;
	const fileDeoptInfo = deoptInfo.files[files[routeParams.fileId]];

	let selectedEntry;
	if (routeParams.entryId) {
		if (routeParams.entryType == "maps") {
			selectedEntry = deoptInfo.maps.nodes[routeParams.entryId];
		} else {
			selectedEntry = findEntry(fileDeoptInfo, routeParams.entryId);
		}
	}

	const selectedEntryType = selectedEntry?.type ?? routeParams.entryType;
	const [entryType, setEntryType] = useState(selectedEntryType);

	useLayoutEffect(() => {
		if (selectedEntryType !== entryType) {
			setEntryType(selectedEntryType);
		}
	}, [selectedEntryType]);

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
				selectedLine={selectedEntry?.line ?? -1}
				urlBase={urlBase}
				settings={codeSettings}
			/>
			<V8DeoptInfoPanel
				title={fileDeoptInfo.relativePath}
				selectedEntryKind={entryType}
				onTabClick={newKind => setEntryType(newKind)}
			>
				{entryType == "maps" ? (
					<MapExplorer urlBase={urlBase} />
				) : (
					<DeoptTables
						entryKind={entryType}
						selectedEntry={selectedEntry}
						fileDeoptInfo={fileDeoptInfo}
						urlBase={urlBase}
						showAllICs={codeSettings.showAllICs}
					/>
				)}
			</V8DeoptInfoPanel>
		</div>
	);
}
