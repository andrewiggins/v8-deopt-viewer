import { Fragment } from "preact";
import { Router, Route, useRoute } from "wouter-preact";
import { Summary } from "./Summary";
import { useHashLocation } from "../utils/useHashLocation";
import { fileRoute, summaryRoute } from "../routes";
import { FileViewer } from "./FileViewer";
import { btn, icon, icon_back } from "../spectre.module.scss";
import { pageHeader, backButton, subRoute, pageTitle } from "./App.module.scss";

/**
 * @param {import('..').AppProps} props
 */
export function App({ deoptInfo }) {
	const files = Object.keys(deoptInfo.files);

	return (
		<Fragment>
			<Router hook={useHashLocation}>
				<Header />
				<Route path={summaryRoute.route}>
					<Summary deoptInfo={deoptInfo} />
				</Route>
				<Route path={fileRoute.route}>
					{(params) => (
						<FileViewer
							routeParams={{
								fileId: parseInt(params.fileId) || 0,
								tabId: params.tabId,
							}}
							files={files}
							deoptInfo={deoptInfo}
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
