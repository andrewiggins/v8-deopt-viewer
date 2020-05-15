import { createElement } from "preact";
import { useState, useCallback, useMemo } from "preact/hooks";
import { DeoptsList } from "./DeoptsList";
import { CodePanel } from "./CodePanel";
import styles from "./FileViewer.scss";
import { CodeSettings } from "./CodeSettings";

/**
 * @param {import('..').V8DeoptInfoWithSources} fileDeoptInfo
 * @param {string} entryId
 * @returns {import('v8-deopt-parser').Entry}
 */
function findEntry(fileDeoptInfo, entryId) {
	if (!entryId) {
		return null;
	}

	/** @type {Array<keyof import('v8-deopt-parser').V8DeoptInfo>} */
	const kinds = ["codes", "deopts", "ics"];
	for (let kind of kinds) {
		for (let entry of fileDeoptInfo[kind]) {
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
	const [showLineNums, setShowLineNums] = useState(true);
	const filteredDeoptInfo = useMemo(() => {}, [fileDeoptInfo, showLowSevs]);

	return (
		<div class={styles.fileViewer}>
			<CodeSettings
				class={styles.codeSettings}
				showLowSevs={showLowSevs}
				toggleShowLowSevs={() => setShowLowSevs((prev) => !prev)}
				showLineNums={showLineNums}
				toggleShowLineNums={() => setShowLineNums((prev) => !prev)}
			/>
			<CodePanel
				fileDeoptInfo={fileDeoptInfo}
				selectedEntry={selectedEntry}
				fileId={routeParams.fileId}
			/>
			<DeoptsList
				fileDeoptInfo={fileDeoptInfo}
				selectedEntry={selectedEntry}
				fileId={routeParams.fileId}
			/>
		</div>
	);
}
