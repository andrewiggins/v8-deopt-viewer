import { createElement } from "preact";
import { useState } from "preact/hooks";
import { findEntry } from "v8-deopt-parser/src/findEntry";
import { V8DeoptInfoPanel } from "./V8DeoptInfoPanel";
import { CodePanel } from "./CodePanel";
import {
	defaultShowLowSevs,
	defaultHideLineNum,
	CodeSettings,
} from "./CodeSettings";
import { fileViewer, codeSettings } from "./FileViewer.scss";

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

	const [showLowSevs, setShowLowSevs] = useState(defaultShowLowSevs);
	const [hideLineNums, setHideLineNums] = useState(defaultHideLineNum);
	const [showAllICs, setShowAllICs] = useState(false);

	return (
		<div class={fileViewer}>
			<CodeSettings
				class={codeSettings}
				showLowSevs={showLowSevs}
				toggleShowLowSevs={() => setShowLowSevs((prev) => !prev)}
				hideLineNums={hideLineNums}
				toggleHideLineNums={() => setHideLineNums((prev) => !prev)}
				showAllICs={showAllICs}
				toggleShowAllICs={() => setShowAllICs((prev) => !prev)}
			/>
			<CodePanel
				fileDeoptInfo={fileDeoptInfo}
				selectedEntry={selectedEntry}
				urlBase={urlBase}
				hideLineNums={hideLineNums}
				showLowSevs={showLowSevs}
			/>
			<V8DeoptInfoPanel
				fileDeoptInfo={fileDeoptInfo}
				routeParams={routeParams}
				selectedEntry={selectedEntry}
				urlBase={urlBase}
				showLowSevs={showLowSevs}
				showAllICs={showAllICs}
			/>
		</div>
	);
}
