import { createElement } from "preact";
import { Route, Switch } from "wouter-preact";
import { V8DeoptInfoPanel } from "./V8DeoptInfoPanel";
import { CodePanel, CodePanelProvider } from "./CodePanel";
import { CodeSettings, useCodeSettingsState } from "./CodeSettings";
import {
	fileViewer,
	codeSettings as codeSettingsClass,
} from "./FileViewer.scss";
import { MapExplorer } from "./V8DeoptInfoPanel/MapExplorer";
import { DeoptTables } from "./V8DeoptInfoPanel/DeoptTables";
import { hasMapData } from "../utils/mapUtils";
import { codeRoute, deoptsRoute, icsRoute, mapsRoute } from "../routes";

/**
 * @typedef {keyof import('v8-deopt-parser').V8DeoptInfo} EntryKind
 * @typedef {{ fileId: number; }} RouteParams
 * @typedef {{ routeParams: RouteParams; deoptInfo: import('..').PerFileDeoptInfoWithSources; files: string[]; }} FileViewerProps
 * @param {FileViewerProps} props
 */
export function FileViewer({ files, deoptInfo, routeParams }) {
	const fileDeoptInfo = deoptInfo.files[files[routeParams.fileId]];

	const [codeSettings, toggleSetting] = useCodeSettingsState();

	const hasMaps = hasMapData(deoptInfo.maps);

	return (
		<div class={fileViewer}>
			<CodePanelProvider>
				<CodeSettings
					class={codeSettingsClass}
					state={codeSettings}
					toggle={toggleSetting}
				/>
				<CodePanel
					fileDeoptInfo={fileDeoptInfo}
					fileId={routeParams.fileId}
					settings={codeSettings}
				/>
				<V8DeoptInfoPanel
					fileId={routeParams.fileId}
					title={fileDeoptInfo.relativePath}
				>
					<Switch>
						<Route path={codeRoute.route}>
							{(params) => (
								<DeoptTables
									entryKind="codes"
									selectedEntryId={params.entryId}
									fileDeoptInfo={fileDeoptInfo}
									fileId={routeParams.fileId}
									showAllICs={codeSettings.showAllICs}
									hasMapData={hasMaps}
								/>
							)}
						</Route>
						<Route path={deoptsRoute.route}>
							{(params) => (
								<DeoptTables
									entryKind="deopts"
									selectedEntryId={params.entryId}
									fileDeoptInfo={fileDeoptInfo}
									fileId={routeParams.fileId}
									showAllICs={codeSettings.showAllICs}
									hasMapData={hasMaps}
								/>
							)}
						</Route>
						<Route path={icsRoute.route}>
							{(params) => (
								<DeoptTables
									entryKind="ics"
									selectedEntryId={params.entryId}
									fileDeoptInfo={fileDeoptInfo}
									fileId={routeParams.fileId}
									showAllICs={codeSettings.showAllICs}
									hasMapData={hasMaps}
								/>
							)}
						</Route>
						<Route path={mapsRoute.route}>
							{(params) => (
								<MapExplorer
									mapData={deoptInfo.maps}
									fileDeoptInfo={fileDeoptInfo}
									routeParams={params}
									settings={codeSettings}
									fileId={routeParams.fileId}
								/>
							)}
						</Route>
					</Switch>
				</V8DeoptInfoPanel>
			</CodePanelProvider>
		</div>
	);
}
