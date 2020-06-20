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
 * @typedef {{ fileId: string; entryId: string; }} RouteParams
 * @typedef {{ routeParams: RouteParams, fileDeoptInfo: import('..').FileV8DeoptInfoWithSources }} FileViewerProps
 * @param {FileViewerProps} props
 */
export function FileViewer({ fileDeoptInfo, routeParams }) {
	const selectedEntry = findEntry(fileDeoptInfo, routeParams.entryId);
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
				fileId={routeParams.fileId}
				hideLineNums={hideLineNums}
				showLowSevs={showLowSevs}
			/>
			<V8DeoptInfoPanel
				fileDeoptInfo={fileDeoptInfo}
				selectedEntry={selectedEntry}
				fileId={routeParams.fileId}
				showLowSevs={showLowSevs}
				showAllICs={showAllICs}
			/>
		</div>
	);
}
