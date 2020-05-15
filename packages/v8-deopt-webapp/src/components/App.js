import { createElement, Fragment } from "preact";
import { Router, Route } from "wouter-preact";
import { Summary } from "./Summary";
import { useHashLocation } from "../utils/useHashLocation";
import { FileViewer } from "./FileViewer";
import styles from "./App.scss";

/**
 * @param {import('..').AppProps} props
 */
export function App({ deoptInfo }) {
	const files = Object.keys(deoptInfo);

	return (
		<Fragment>
			{/* TODO: Finish header
			- Style header
			- Add back button to return to summary
			 */}
			{/*
			TODO: Add settings cog
			- Show/hide line numbers
			- Show/hide low severities
			 */}
			<h1 class={styles.pageTitle}>V8 Deopt Viewer</h1>
			<Router hook={useHashLocation}>
				<Route path="/">
					<Summary deoptInfo={deoptInfo} />
				</Route>
				<Route path="/file/:fileId?/:entryId?">
					{(params) => (
						<FileViewer
							routeParams={{
								fileId: params.fileId || "0",
								entryId: params.entryId || null,
							}}
							fileDeoptInfo={deoptInfo[files[params.fileId || 0]]}
						/>
					)}
				</Route>
			</Router>
		</Fragment>
	);
}
