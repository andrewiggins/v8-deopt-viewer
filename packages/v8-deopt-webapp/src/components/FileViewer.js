import { createElement } from "preact";
import { useState, useCallback, useMemo } from "preact/hooks";
import { DeoptsList } from "./DeoptsList";
import { CodePanel } from "./CodePanel";
import styles from "./FileViewer.scss";
import { CodeSettings } from "./CodeSettings";

// TODO: Consider moving findEntry and filterEntries into v8-deopt-parser

/**
 * @param {import('v8-deopt-parser').V8DeoptInfo} deoptInfo
 * @param {string} entryId
 * @returns {import('v8-deopt-parser').Entry}
 */
function findEntry(deoptInfo, entryId) {
	if (!entryId) {
		return null;
	}

	/** @type {Array<keyof import('v8-deopt-parser').V8DeoptInfo>} */
	const kinds = ["codes", "deopts", "ics"];
	for (let kind of kinds) {
		for (let entry of deoptInfo[kind]) {
			if (entry.id == entryId) {
				return entry;
			}
		}
	}
}

/**
 * @typedef {{ fileId: string; entryId: string; }} RouteParams
 * @typedef {{ routeParams: RouteParams, fileDeoptInfo: import('..').V8DeoptInfoWithSources }} FileViewerProps
 * @param {FileViewerProps} props
 */
export function FileViewer({ fileDeoptInfo, routeParams }) {
	const selectedEntry = findEntry(fileDeoptInfo, routeParams.entryId);
	const [showLowSevs, setShowLowSevs] = useState(false);
	const [hideLineNums, setHideLineNums] = useState(false);

	return (
		<div class={styles.fileViewer}>
			<CodeSettings
				class={styles.codeSettings}
				showLowSevs={showLowSevs}
				toggleShowLowSevs={() => setShowLowSevs((prev) => !prev)}
				hideLineNums={hideLineNums}
				toggleHideLineNums={() => setHideLineNums((prev) => !prev)}
			/>
			<CodePanel
				fileDeoptInfo={fileDeoptInfo}
				selectedEntry={selectedEntry}
				fileId={routeParams.fileId}
				hideLineNums={hideLineNums}
				showLowSevs={showLowSevs}
			/>
			<DeoptsList
				fileDeoptInfo={fileDeoptInfo}
				selectedEntry={selectedEntry}
				fileId={routeParams.fileId}
				showLowSevs={showLowSevs}
			/>
		</div>
	);
}
