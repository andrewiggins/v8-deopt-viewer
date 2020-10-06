import { createElement, createContext } from "preact";
import { useState, useReducer, useMemo, useContext } from "preact/hooks";
import { Route, Switch } from "wouter-preact";
import { V8DeoptInfoPanel } from "./V8DeoptInfoPanel";
import { CodePanel } from "./CodePanel";
import { CodeSettings, useCodeSettingsState } from "./CodeSettings";
import {
	fileViewer,
	codeSettings as codeSettingsClass,
} from "./FileViewer.scss";
import { MapExplorer } from "./V8DeoptInfoPanel/MapExplorer";
import { DeoptTables } from "./V8DeoptInfoPanel/DeoptTables";
import { hasMapData } from "../utils/mapUtils";
import { codeRoute, deoptsRoute, icsRoute, mapsRoute } from "../routes";
import { AppProvider } from "./appState";

/**
 * @typedef {keyof import('v8-deopt-parser').V8DeoptInfo} EntryKind
 * @typedef {{ fileId: number; tabId?: string }} RouteParams
 * @typedef {{ routeParams: RouteParams; deoptInfo: import('..').PerFileDeoptInfoWithSources; files: string[]; }} FileViewerProps
 * @param {FileViewerProps} props
 */
export function FileViewer({ files, deoptInfo, routeParams }) {
	const { fileId, tabId } = routeParams;
	// TODO: COnsider using local state for tab navigation
	// const selectedTab = useState(tabId);
	const fileDeoptInfo = deoptInfo.files[files[fileId]];

	const [codeSettings, toggleSetting] = useCodeSettingsState();
	const toggleShowLowSevs = () => toggleSetting("showLowSevs");

	const hasMaps = hasMapData(deoptInfo.maps);

	return (
		<div class={fileViewer}>
			<AppProvider>
				<CodeSettings
					class={codeSettingsClass}
					state={codeSettings}
					toggle={toggleSetting}
				/>
				<CodePanel
					fileDeoptInfo={fileDeoptInfo}
					fileId={fileId}
					settings={codeSettings}
				/>
				<V8DeoptInfoPanel fileId={fileId} title={fileDeoptInfo.relativePath}>
					<Switch>
						<Route path={codeRoute.route}>
							{(params) => (
								<DeoptTables
									entryKind="codes"
									selectedEntryId={params.entryId}
									fileDeoptInfo={fileDeoptInfo}
									fileId={fileId}
									settings={codeSettings}
									toggleShowLowSevs={toggleShowLowSevs}
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
									fileId={fileId}
									settings={codeSettings}
									toggleShowLowSevs={toggleShowLowSevs}
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
									fileId={fileId}
									settings={codeSettings}
									toggleShowLowSevs={toggleShowLowSevs}
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
									fileId={fileId}
								/>
							)}
						</Route>
					</Switch>
				</V8DeoptInfoPanel>
			</AppProvider>
		</div>
	);
}
