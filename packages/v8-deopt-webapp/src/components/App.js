import { createElement, Fragment } from "preact";
import { Router, Route, useRoute } from "wouter-preact";
import { Summary } from "./Summary";
import { useHashLocation } from "../utils/useHashLocation";
import { FileViewer } from "./FileViewer";
import { btn, icon, icon_back } from "../spectre.scss";
import { pageHeader, backButton, subRoute, pageTitle } from "./App.scss";

/**
 * @param {import('..').AppProps} props
 */
export function App({ deoptInfo }) {
	const files = Object.keys(deoptInfo.files);

	return (
		<Fragment>
			<Router hook={useHashLocation}>
				<Header />
				<Route path="/">
					<Summary deoptInfo={deoptInfo} />
				</Route>
				<Route path="/file/:fileId?/:entryKind?/:entryId?">
					{(params) => (
						<FileViewer
							routeParams={{
								fileId: params.fileId || "0",
								entryKind: params.entryKind || "codes",
								entryId: params.entryId || null,
							}}
							fileDeoptInfo={deoptInfo.files[files[params.fileId || 0]]}
						/>
					)}
				</Route>
			</Router>
		</Fragment>
	);
}

function Header() {
	const [isRootRoute] = useRoute("/");

	return (
		<div class={[pageHeader, (!isRootRoute && subRoute) || null].join(" ")}>
			<a href="#/" class={[btn, backButton].join(" ")}>
				<i class={[icon, icon_back].join(" ")}></i>
			</a>
			<h1 class={pageTitle}>V8 Deopt Viewer</h1>
		</div>
	);
}
